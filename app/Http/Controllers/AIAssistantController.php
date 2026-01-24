<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\AIConversation;
use App\Models\AIHistory;
use App\Models\Document;
use App\Models\DocumentEmbedding;
use App\Services\GroqService;

class AIAssistantController extends Controller
{
    private $aiServiceUrl;
    private $aiBridgeUrl;
    private $aiServiceType;
    private GroqService $groqService;

    public function __construct(GroqService $groqService)
    {
        $this->aiServiceUrl = env('AI_SERVICE_URL', 'http://localhost:5000');
        $this->aiBridgeUrl = env('AI_BRIDGE_URL', 'http://localhost:5003');
        $this->aiServiceType = env('AI_SERVICE_TYPE', 'local');
        $this->groqService = $groqService;
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'document_ids' => 'nullable|array',
            'document_ids.*' => 'integer|exists:documents,doc_id',
            'conversation_id' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if ($value !== null) {
                        if (is_string($value) && !is_numeric($value)) {
                            return;
                        }

                        if (!AIConversation::where('conversation_id', $value)
                            ->where('user_id', Auth::id())
                            ->exists()) {
                            $fail('The selected conversation is invalid.');
                        }
                    }
                },
            ],
        ]);

        try {
            // Increase execution time limit for document processing
            set_time_limit(300); // 5 minutes

            $userId = Auth::id();
            $conversationId = $request->conversation_id;

            Log::info('AI Chat Request', [
                'user_id' => $userId,
                'conversation_id' => $conversationId,
                'message_length' => strlen($request->message),
                'ai_service_url' => $this->aiServiceUrl
            ]);

            // Handle special conversation IDs
            if ($conversationId && !is_numeric($conversationId)) {
                if (str_starts_with($conversationId, 'starred-')) {
                    $conversation = AIConversation::create([
                        'user_id' => $userId,
                        'started_at' => now(),
                    ]);
                    $conversationId = $conversation->conversation_id;
                }
            }

            // Create new conversation if none provided
            if (!$conversationId) {
                $conversation = AIConversation::create([
                    'user_id' => $userId,
                    'started_at' => now(),
                ]);
                $conversationId = $conversation->conversation_id;
                
                Log::info('Created new conversation', ['conversation_id' => $conversationId]);
            } else {
                if (is_numeric($conversationId)) {
                    $conversation = AIConversation::where('conversation_id', $conversationId)
                        ->where('user_id', $userId)
                        ->firstOrFail();
                }
            }

            // Check if user is asking about document location/search or specific content
            $searchResults = $this->searchDocumentsByQuery($request->message, $userId);

            // Perform metadata search (fast SQL search on title/description)
            $metadataResults = $this->searchDocumentsMetadata($request->message, $userId);

            // Perform semantic search if query contains names or specific search terms
            $semanticResults = $this->performSemanticSearch($request->message, $userId);

            // Retrieve document context if document IDs are provided
            // Use higher limits for Groq API
            $documentContext = '';
            $useGroqLimits = $this->aiServiceType === 'groq';
            if ($request->document_ids && count($request->document_ids) > 0) {
                $documentContext = $this->retrieveDocumentContext($request->document_ids, $userId, $useGroqLimits);

                Log::info('Document context retrieved', [
                    'document_count' => count($request->document_ids),
                    'context_length' => strlen($documentContext),
                    'using_groq_limits' => $useGroqLimits
                ]);
            }

            // Add search results to document context if found
            if (!empty($searchResults)) {
                $documentContext .= "\n\n" . $searchResults['context'];
                Log::info('Document search results added to context', [
                    'documents_found' => $searchResults['count']
                ]);
            }

            // Add metadata search results to document context if found
            if (!empty($metadataResults)) {
                $documentContext .= "\n\n" . $metadataResults['context'];
                Log::info('Metadata search results added to context', [
                    'documents_found' => $metadataResults['count']
                ]);
            }

            // Add semantic search results to document context if found
            if (!empty($semanticResults) && !empty($semanticResults['results'])) {
                $documentContext .= "\n\n" . $semanticResults['context'];
                Log::info('Semantic search results added to context', [
                    'chunks_found' => count($semanticResults['results'])
                ]);
            }

            // Generate AI response with automatic fallback
            // Try Groq first if configured, fall back to local if it fails
            $aiResponse = null;
            $primaryService = $this->aiServiceType;

            try {
                if ($primaryService === 'groq') {
                    Log::info('Attempting Groq API for chat...');
                    $aiResponse = $this->callGroqAPI($request->message, $conversationId, $documentContext);
                } else {
                    Log::info('Attempting local AI service...');
                    $aiResponse = $this->callLocalAIService($request->message, $conversationId, $documentContext);
                }
            } catch (\Exception $e) {
                Log::warning("Primary AI service ({$primaryService}) failed: " . $e->getMessage());

                // Automatic fallback to alternative service
                try {
                    if ($primaryService === 'groq') {
                        Log::info('Groq failed, falling back to local AI service...');
                        $aiResponse = $this->callLocalAIService($request->message, $conversationId, $documentContext);
                    } else {
                        Log::info('Local AI failed, falling back to Groq API...');
                        $aiResponse = $this->callGroqAPI($request->message, $conversationId, $documentContext);
                    }
                } catch (\Exception $fallbackError) {
                    Log::error('Both AI services failed', [
                        'primary_error' => $e->getMessage(),
                        'fallback_error' => $fallbackError->getMessage()
                    ]);
                    throw new \Exception('All AI services are currently unavailable. Please ensure either the local AI server is running or you have internet connection for Groq API.');
                }
            }

            Log::info('AI response generated successfully', [
                'response_length' => strlen($aiResponse)
            ]);

            // Get document metadata for response if documents were provided OR found via search
            $documentReferences = [];
            if ($request->document_ids && count($request->document_ids) > 0) {
                $documents = Document::whereIn('doc_id', $request->document_ids)
                    ->with('folder:folder_id,folder_name')
                    ->get(['doc_id', 'title', 'folder_id']);

                $documentReferences = $documents->map(function($doc) {
                    return [
                        'doc_id' => $doc->doc_id,
                        'title' => $doc->title,
                        'folder_id' => $doc->folder_id,
                        'folder_name' => $doc->folder ? $doc->folder->folder_name : null,
                    ];
                })->toArray();
            } elseif (!empty($searchResults) && !empty($searchResults['documents'])) {
                // Add search results as document references
                $documentReferences = $searchResults['documents'];
            } elseif (!empty($metadataResults) && !empty($metadataResults['documents'])) {
                // Add metadata search results as document references
                $documentReferences = $metadataResults['documents'];
            } elseif (!empty($semanticResults) && !empty($semanticResults['documents'])) {
                // Add semantic search results as document references
                foreach ($semanticResults['documents'] as $semanticDoc) {
                    $doc = Document::with('folder:folder_id,folder_name')
                        ->find($semanticDoc['doc_id']);

                    if ($doc) {
                        $documentReferences[] = [
                            'doc_id' => $doc->doc_id,
                            'title' => $doc->title,
                            'folder_id' => $doc->folder_id,
                            'folder_name' => $doc->folder ? $doc->folder->folder_name : null,
                            'matches' => $semanticDoc['matches'] ?? 1
                        ];
                    }
                }
            }

            // Save chat history to database
            $timestamp = now();
            AIHistory::create([
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'doc_id' => null,
                'question' => $request->message,
                'answer' => $aiResponse,
                'status' => 'completed',
                'document_references' => !empty($documentReferences) ? json_encode($documentReferences) : null,
                'created_at' => $timestamp,
            ]);

            return response()->json([
                'id' => time(),
                'content' => $aiResponse,
                'session_id' => $conversationId,
                'type' => 'ai',
                'timestamp' => $timestamp->toISOString(),
                'documents' => $documentReferences,
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('AI service connection failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'service_url' => $this->aiServiceUrl
            ]);
            
            return response()->json([
                'error' => 'Cannot connect to AI service. Please ensure the AI server is running.',
                'details' => 'Connection timeout or refused'
            ], 503);
            
        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('AI service request failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'error' => 'AI service request failed',
                'details' => $e->getMessage()
            ], 500);
            
        } catch (\Exception $e) {
            Log::error('Chat failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to process message: ' . $e->getMessage(),
                'details' => 'Internal server error'
            ], 500);
        }
    }

    public function index()
    {
        $conversations = AIConversation::where('user_id', Auth::id())
            ->orderBy('started_at', 'desc')
            ->limit(20)
            ->get();

        return Inertia::render('Admin/Aiassistant/index', [
            'conversations' => $conversations,
        ]);
    }

    public function getConversations()
    {
        // Only get conversations that have actual chat history
        $conversationIds = AIHistory::where('user_id', Auth::id())
            ->distinct()
            ->pluck('conversation_id')
            ->toArray();

        if (empty($conversationIds)) {
            return response()->json([]);
        }

        // Get all first and last messages in one query to avoid N+1
        $firstMessages = AIHistory::where('user_id', Auth::id())
            ->whereIn('conversation_id', $conversationIds)
            ->select('conversation_id', 'question', 'created_at')
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy('conversation_id')
            ->map(fn($group) => $group->first());

        $lastMessages = AIHistory::where('user_id', Auth::id())
            ->whereIn('conversation_id', $conversationIds)
            ->select('conversation_id', 'answer', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('conversation_id')
            ->map(fn($group) => $group->first());

        $conversations = AIConversation::whereIn('conversation_id', $conversationIds)
            ->where('user_id', Auth::id())
            ->orderBy('started_at', 'desc')
            ->get()
            ->map(function($conv) use ($firstMessages, $lastMessages) {
                $firstHistory = $firstMessages->get($conv->conversation_id);
                $lastHistory = $lastMessages->get($conv->conversation_id);

                // Create a meaningful title from the first question (truncate if too long)
                $title = $firstHistory
                    ? (strlen($firstHistory->question) > 50
                        ? substr($firstHistory->question, 0, 50) . '...'
                        : $firstHistory->question)
                    : 'Chat ' . $conv->conversation_id;

                // Get last message preview
                $lastMessage = $lastHistory
                    ? (strlen($lastHistory->answer) > 60
                        ? substr($lastHistory->answer, 0, 60) . '...'
                        : $lastHistory->answer)
                    : null;

                return [
                    'id' => (string)$conv->conversation_id,
                    'title' => $title,
                    'lastMessage' => $lastMessage,
                    'created_at' => $conv->started_at,
                    'updated_at' => $conv->started_at,
                    'starred' => (bool)$conv->starred,
                ];
            });

        return response()->json($conversations);
    }

    public function getChatHistory($sessionId)
    {
        try {
            if (is_numeric($sessionId)) {
                AIConversation::where('conversation_id', $sessionId)
                    ->where('user_id', Auth::id())
                    ->firstOrFail();
            }

            // Get chat history from ai_histories table
            $history = AIHistory::where('conversation_id', $sessionId)
                ->where('user_id', Auth::id())
                ->orderBy('created_at', 'asc')
                ->get();

            // Format messages for frontend
            $messages = [];
            foreach ($history as $item) {
                // Add user message
                $messages[] = [
                    'id' => $item->ai_history_id * 2 - 1,
                    'type' => 'user',
                    'content' => $item->question,
                    'timestamp' => $item->created_at->toISOString(),
                ];

                // Add AI response
                $aiMessage = [
                    'id' => $item->ai_history_id * 2,
                    'type' => 'ai',
                    'content' => $item->answer,
                    'timestamp' => $item->created_at->toISOString(),
                ];

                // Add document references if they exist
                if ($item->document_references) {
                    $aiMessage['documents'] = json_decode($item->document_references, true);
                }

                $messages[] = $aiMessage;
            }

            return response()->json($messages);

        } catch (\Exception $e) {
            Log::error('Get chat history failed', [
                'session_id' => $sessionId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Conversation not found'], 404);
        }
    }

    public function deleteConversation($conversationId)
    {
        try {
            $deleted = AIConversation::where('conversation_id', $conversationId)
                ->where('user_id', Auth::id())
                ->delete();

            if (!$deleted) {
                return response()->json(['error' => 'Conversation not found'], 404);
            }

            return response()->json(['message' => 'Conversation deleted']);
        } catch (\Exception $e) {
            Log::error('Delete conversation failed', [
                'conversation_id' => $conversationId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Delete failed'], 500);
        }
    }

    public function starConversation($conversationId)
    {
        try {
            $conversation = AIConversation::where('conversation_id', $conversationId)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $conversation->starred = true;
            $conversation->save();

            return response()->json(['message' => 'Conversation starred']);
        } catch (\Exception $e) {
            Log::error('Star conversation failed', [
                'conversation_id' => $conversationId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to star conversation'], 500);
        }
    }

    public function unstarConversation($conversationId)
    {
        try {
            $conversation = AIConversation::where('conversation_id', $conversationId)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $conversation->starred = false;
            $conversation->save();

            return response()->json(['message' => 'Conversation unstarred']);
        } catch (\Exception $e) {
            Log::error('Unstar conversation failed', [
                'conversation_id' => $conversationId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to unstar conversation'], 500);
        }
    }

    /**
     * Retrieve document context from embeddings for the given document IDs
     */
    /**
     * Retrieve document context from embeddings for the given document IDs
     */
    private function retrieveDocumentContext(array $documentIds, int $userId, bool $useGroqLimits = false): string
    {
        try {
            // Allow all users to access all active documents
            $accessibleDocuments = Document::whereIn('doc_id', $documentIds)
                ->where('status', 'active')
                ->pluck('doc_id')
                ->toArray();

            if (empty($accessibleDocuments)) {
                Log::warning('No accessible documents found', [
                    'user_id' => $userId,
                    'requested_docs' => $documentIds
                ]);
                return '';
            }

            // Get document embeddings/chunks for accessible documents
            // We fetch ALL chunks first, then select them in a round-robin fashion
            $embeddings = DocumentEmbedding::whereIn('doc_id', $accessibleDocuments)
                ->with('document:doc_id,title')
                ->orderBy('doc_id')
                ->orderBy('chunk_index')
                ->get();

            if ($embeddings->isEmpty()) {
                Log::warning('No embeddings found for documents', [
                    'document_ids' => $accessibleDocuments
                ]);
                return '';
            }

            // Group embeddings by document ID
            $groupedEmbeddings = $embeddings->groupBy('doc_id');
            $docIds = $groupedEmbeddings->keys()->toArray();
            
            // Round Robin Selection
            // Create a flat list interleaving chunks: DocA-1, DocB-1, DocA-2, DocB-2...
            $interleavedEmbeddings = [];
            $maxChunksPerDoc = $embeddings->count(); // Upper bound
            
            for ($i = 0; $i < $maxChunksPerDoc; $i++) {
                $addedAny = false;
                foreach ($docIds as $docId) {
                    if (isset($groupedEmbeddings[$docId][$i])) {
                        $interleavedEmbeddings[] = $groupedEmbeddings[$docId][$i];
                        $addedAny = true;
                    }
                }
                if (!$addedAny) break;
            }

            // Build document context
            $context = "The user has attached documents to this conversation. Below is the extracted content from their attached documents that you should use to answer their questions:\n\n";

            $chunkCount = 0;

            // Use higher limits for Groq (supports 128K context), lower for local
            // INCREASED LIMITS: Local 3 -> 15 chunks, 2000 -> 6000 chars to support comparison
            $maxChunks = $useGroqLimits ? 40 : 15;
            $maxContextLength = $useGroqLimits ? 32000 : 6000;
            
            // Variable to track which documents we've already added a header for in the current block
            // Since we're interleaving, we might switch back and forth.
            // A better approach for the LLM is to group by document in the FINAL output, 
            // OR strictly label each chunk. 
            // Labeling each chunk is safer for "Compare these" queries so the LLM knows which doc is which.
            
            foreach ($interleavedEmbeddings as $embedding) {
                if ($chunkCount >= $maxChunks) {
                    break;
                }

                $docTitle = $embedding->document->title ?? 'Document ' . $embedding->doc_id;
                
                // Content with clear attribution
                $chunkContent = "--- Excerpt from Document: \"{$docTitle}\" ---\n{$embedding->chunk_text}\n";

                // Check if adding this chunk would exceed our length limit
                if (strlen($context . $chunkContent) > $maxContextLength) {
                    break;
                }

                $context .= $chunkContent . "\n";
                $chunkCount++;
            }

            $context .= "\n--- End of Attached Document Content ---\n\n";
            $context .= "IMPORTANT: The content above is from the user's attached documents. When the user compares documents, refers to 'this document', 'the attached file', or asks you to summarize/analyze documents, they are referring to the content provided above. You have access to this document content and should answer based on it.";

            Log::info('Document context built (Round Robin)', [
                'total_chunks' => $chunkCount,
                'documents_count' => count($docIds),
                'context_length' => strlen($context)
            ]);

            return $context;

        } catch (\Exception $e) {
            Log::error('Failed to retrieve document context', [
                'error' => $e->getMessage(),
                'document_ids' => $documentIds,
                'user_id' => $userId
            ]);
            return '';
        }
    }

    /**
     * Search for documents based on user query (e.g., asking for document location)
     */
    private function searchDocumentsByQuery(string $message, int $userId): array
    {
        try {
            // Check if the user is asking about document location or searching for a document
            $isLocationQuery = preg_match('/(where|location|find|search|give|show|tell|link).*(document|file|link|location)/i', $message) ||
                               preg_match('/(give me|show me|tell me|find).*(location|where|link|document|file)/i', $message) ||
                               preg_match('/\b(link|location|where is|find|search)\b/i', $message);

            if (!$isLocationQuery) {
                return [];
            }

            Log::info('Document location query detected', ['message' => $message]);

            // Extract potential document title from the message
            // Look for quoted text or capitalized phrases
            $titlePattern = '/"([^"]+)"|\'([^\']+)\'|([A-Z][A-Za-z\s]+(?:Guide|Manual|Policy|Procedures|Document|File|Report))/';
            preg_match_all($titlePattern, $message, $matches);

            $searchTerms = array_filter(array_merge(
                $matches[1] ?? [],
                $matches[2] ?? [],
                $matches[3] ?? []
            ));

            if (empty($searchTerms)) {
                // If no specific title found, extract keywords from the message
                $words = explode(' ', $message);
                $searchTerms = array_filter($words, function($word) {
                    return strlen($word) > 3 && !in_array(strtolower($word), ['where', 'location', 'find', 'document', 'file', 'give', 'show', 'tell', 'link', 'this', 'that', 'here', 'there']);
                });
            }

            // Search for documents matching the terms (all active documents)
            $query = Document::where('status', 'active')
                ->with('folder:folder_id,folder_name,parent_folder_id');

            if (!empty($searchTerms)) {
                // Search with specific terms
                foreach ($searchTerms as $term) {
                    $query->where(function($q) use ($term) {
                        $q->where('title', 'LIKE', "%{$term}%")
                          ->orWhere('description', 'LIKE', "%{$term}%");
                    });
                }
                $documents = $query->limit(5)->get();
            } else {
                // If user asks "give me the link" without specifying which document,
                // show the most recent documents
                Log::info('No specific search terms, showing recent documents');
                $documents = Document::where('status', 'active')
                    ->with('folder:folder_id,folder_name,parent_folder_id')
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get();
            }

            if ($documents->isEmpty()) {
                return [];
            }

            // Build context for AI
            $context = "\n\n=== DOCUMENT DATABASE SEARCH RESULTS ===\n\n";
            $context .= "I have searched the user's document management system and found these documents:\n\n";

            $documentReferences = [];

            foreach ($documents as $doc) {
                $folderPath = $this->buildFolderPath($doc->folder);
                $context .= "Document #{$doc->doc_id}: \"{$doc->title}\"\n";
                $context .= "  └─ Folder Location: {$folderPath}\n";
                $context .= "  └─ Uploaded: {$doc->created_at->format('F d, Y')}\n";
                if ($doc->description) {
                    $context .= "  └─ Description: {$doc->description}\n";
                }
                $context .= "\n";

                $documentReferences[] = [
                    'doc_id' => $doc->doc_id,
                    'title' => $doc->title,
                    'folder_id' => $doc->folder_id,
                    'folder_name' => $doc->folder ? $doc->folder->folder_name : null,
                ];
            }

            $context .= "\n=== CRITICAL INSTRUCTIONS ===\n";
            $context .= "YOU MUST RESPOND BASED ON THE DOCUMENTS LISTED ABOVE.\n";
            $context .= "These documents are from the user's OWN document management system.\n\n";
            $context .= "Your response MUST:\n";
            $context .= "1. Tell the user that you found the document(s) in their system\n";
            $context .= "2. State the exact document title(s) from the list above\n";
            $context .= "3. State the folder location(s) shown above\n";
            $context .= "4. Tell them clickable links will appear below your message\n\n";
            $context .= "DO NOT:\n";
            $context .= "- Say you cannot access documents or locations\n";
            $context .= "- Suggest checking HR, intranet, or physical locations\n";
            $context .= "- Give generic advice\n";
            $context .= "- Create, generate, or write ANY links, markdown links, or clickable elements\n";
            $context .= "- Write [**Document Link**] or any link syntax like [text](url) or [text](#)\n";
            $context .= "- Use markdown link formatting - the system automatically adds clickable links below your message\n";
            $context .= "- Write phrases like 'Click here:' followed by a link\n\n";
            $context .= "EXAMPLE GOOD RESPONSE:\n";
            $context .= "\"I found the '{$documents->first()->title}' document in your system! It's located in the '{$this->buildFolderPath($documents->first()->folder)}' folder. You can click on the document link below this message to navigate directly to it.\"\n\n";

            return [
                'context' => $context,
                'count' => $documents->count(),
                'documents' => $documentReferences
            ];

        } catch (\Exception $e) {
            Log::error('Failed to search documents by query', [
                'error' => $e->getMessage(),
                'message' => $message,
                'user_id' => $userId
            ]);
            return [];
        }
    }

    /**
     * Build folder path string for a folder
     */
    private function buildFolderPath($folder): string
    {
        if (!$folder) {
            return 'Root Folder';
        }

        $path = [$folder->folder_name];
        $current = $folder;

        // Traverse up the folder hierarchy (limit to 10 levels to prevent infinite loops)
        $maxLevels = 10;
        $level = 0;

        while ($current->parent_folder_id && $level < $maxLevels) {
            $parent = \App\Models\Folder::find($current->parent_folder_id);
            if (!$parent) break;

            array_unshift($path, $parent->folder_name);
            $current = $parent;
            $level++;
        }

        return implode(' > ', $path);
    }

    /**
     * Call Groq API for chat completion with document context
     */
    private function callGroqAPI(string $message, $conversationId, string $documentContext = ''): string
    {
        try {
            if (!$this->groqService->isConfigured()) {
                throw new \Exception('Groq API key is not configured. Please set GROQ_API_KEY in .env file.');
            }

            // Get conversation history for context
            $conversationHistory = [];
            if ($conversationId && is_numeric($conversationId)) {
                $history = AIHistory::where('conversation_id', $conversationId)
                    ->where('user_id', Auth::id())
                    ->orderBy('created_at', 'desc')
                    ->limit(6) // Last 3 exchanges (6 messages)
                    ->get()
                    ->reverse();

                foreach ($history as $item) {
                    $conversationHistory[] = ['role' => 'user', 'content' => $item->question];
                    $conversationHistory[] = ['role' => 'assistant', 'content' => $item->answer];
                }
            }

            // Build system prompt
            $systemPrompt = $this->groqService->buildDocumentSystemPrompt($documentContext);

            // Add document context to message if available
            $userMessage = $message;
            if (!empty($documentContext)) {
                $userMessage = $documentContext . "\n\nUser Question: " . $message;
            }

            Log::info('Groq API request', [
                'model' => $this->groqService->getModel(),
                'history_messages' => count($conversationHistory),
                'has_document_context' => !empty($documentContext)
            ]);

            // Call Groq service with chat history
            $aiResponse = $this->groqService->chatWithHistory(
                $userMessage,
                $conversationHistory,
                $systemPrompt,
                [
                    'temperature' => 0.7,
                    'max_tokens' => 2000,
                    'timeout' => 60
                ]
            );

            Log::info('Groq API response received', [
                'response_length' => strlen($aiResponse),
                'model' => $this->groqService->getModel()
            ]);

            return $aiResponse;

        } catch (\Exception $e) {
            Log::error('Groq API call failed', [
                'error' => $e->getMessage(),
                'conversation_id' => $conversationId
            ]);
            throw $e;
        }
    }

    /**
     * Call local AI service (Python Flask)
     */
    private function callLocalAIService(string $message, $conversationId, string $documentContext = ''): string
    {
        try {
            // First, check if AI service is available
            Log::info('Checking local AI service health...');

            $healthResponse = Http::timeout(15)->get("{$this->aiServiceUrl}/health");

            if (!$healthResponse->successful()) {
                throw new \Exception('AI service health check failed: ' . $healthResponse->status());
            }

            $healthData = $healthResponse->json();
            Log::info('AI service health check', $healthData);

            if (!$healthData['model_loaded']) {
                throw new \Exception('AI model not loaded in service');
            }

            // Call Python AI service with document context as separate parameter
            Log::info('Sending request to local AI service...', [
                'has_document_context' => !empty($documentContext),
                'context_length' => strlen($documentContext)
            ]);

            $response = Http::timeout(240)
                ->retry(2, 1000)
                ->post("{$this->aiServiceUrl}/chat", [
                    'message' => $message,
                    'conversation_id' => $conversationId,
                    'document_context' => $documentContext,
                ]);

            Log::info('Local AI service response received', [
                'status' => $response->status(),
                'response_size' => strlen($response->body())
            ]);

            if (!$response->successful()) {
                $errorBody = $response->body();
                Log::error('Local AI service error response', [
                    'status' => $response->status(),
                    'body' => $errorBody
                ]);

                throw new \Exception('AI service error (HTTP ' . $response->status() . '): ' . $errorBody);
            }

            $data = $response->json();

            if (!isset($data['response'])) {
                throw new \Exception('Invalid response format from AI service');
            }

            return $data['response'];

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Local AI service connection failed', [
                'error' => $e->getMessage(),
                'service_url' => $this->aiServiceUrl
            ]);

            throw new \Exception('Cannot connect to AI service. Please ensure the AI server is running.');

        } catch (\Exception $e) {
            Log::error('Local AI service call failed', [
                'error' => $e->getMessage(),
                'conversation_id' => $conversationId
            ]);
            throw $e;
        }
    }

    /**
     * Perform semantic search across document content using AI embeddings
     */
    private function performSemanticSearch(string $message, int $userId): array
    {
        try {
            if (!$this->shouldTriggerSemanticSearch($message)) {
                return [];
            }

            $searchResults = $this->callSemanticSearchService($message, $userId);

            if (empty($searchResults)) {
                return [];
            }

            return [
                'context' => $this->buildSemanticSearchContext($searchResults),
                'results' => $searchResults,
                'documents' => $this->extractDocumentMap($searchResults)
            ];

        } catch (\Exception $e) {
            Log::error('Semantic search failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Search documents by metadata (title, description) - Fast SQL search
     */
    private function searchDocumentsMetadata(string $message, int $userId): array
    {
        try {
            // Extract potential search terms from the message
            $words = preg_split('/\s+/', $message);
            
            // Filter out common words but keep proper names (capitalized) and meaningful terms
            $stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how'];
            
            $searchTerms = array_filter($words, function($word) use ($stopWords) {
                $wordLower = strtolower($word);
                // Keep if: length > 2 AND (not a stop word OR starts with capital letter - likely a name)
                $isProperName = ctype_upper($word[0] ?? '');
                return strlen($word) > 2 && (!in_array($wordLower, $stopWords) || $isProperName);
            });

            if (empty($searchTerms)) {
                return [];
            }

            Log::info('Metadata search triggered', [
                'original_message' => $message,
                'search_terms' => array_values($searchTerms)
            ]);

            // Search for documents matching the terms in title or description
            $query = Document::where('status', 'active')
                ->with('folder:folder_id,folder_name,parent_folder_id');

            // Add OR conditions for each search term
            $query->where(function($q) use ($searchTerms) {
                foreach ($searchTerms as $term) {
                    $q->orWhere('title', 'LIKE', "%{$term}%")
                      ->orWhere('description', 'LIKE', "%{$term}%");
                }
            });

            $documents = $query->limit(10)->get();

            if ($documents->isEmpty()) {
                return [];
            }

            // Build context for AI
            $context = "\n\n=== DOCUMENT METADATA SEARCH RESULTS ===\n\n";
            $context .= "I found these documents in your system that match your search:\n\n";

            $documentReferences = [];

            foreach ($documents as $doc) {
                $folderPath = $this->buildFolderPath($doc->folder);
                $context .= "Document: \"{$doc->title}\"\n";
                $context .= "  └─ Folder: {$folderPath}\n";
                if ($doc->description) {
                    $context .= "  └─ Description: {$doc->description}\n";
                }
                $context .= "\n";

                $documentReferences[] = [
                    'doc_id' => $doc->doc_id,
                    'title' => $doc->title,
                    'folder_id' => $doc->folder_id,
                    'folder_name' => $doc->folder ? $doc->folder->folder_name : null,
                ];
            }

            $context .= "\n=== RESPONSE INSTRUCTIONS ===\n";
            $context .= "Tell the user you found these documents. List them by title and mention clickable links will appear below.\n";

            return [
                'context' => $context,
                'count' => $documents->count(),
                'documents' => $documentReferences
            ];

        } catch (\Exception $e) {
            Log::error('Metadata search failed', [
                'error' => $e->getMessage(),
                'message' => $message,
                'user_id' => $userId
            ]);
            return [];
        }
    }

    /**
     * Check if semantic search should be triggered
     */
    private function shouldTriggerSemanticSearch(string $message): bool
    {
        // Trigger on content queries
        $hasContentQuery = preg_match('/(does|has|find|search|look for|check if|tell me if|show me).*(have|has|contain|include|mention)/i', $message) ||
                          preg_match('/\b(affidavit|certificate|resolution|contract|agreement|document|file)\b/i', $message);

        // Trigger on names (potential person/org search)
        $hasNames = preg_match('/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/', $message);

        // Trigger on search keywords
        $hasSearchKeywords = preg_match('/\b(find|search|locate|where|which|show|list)\b/i', $message);

        return $hasContentQuery || $hasNames || $hasSearchKeywords;
    }

    /**
     * Call AI Bridge semantic search service
     */
    private function callSemanticSearchService(string $message, int $userId): array
    {
        // Use Groq intelligent search if configured
        if ($this->aiServiceType === 'groq') {
            return $this->groqIntelligentSearch($message, $userId);
        }

        // Use BERT embeddings semantic search
        $response = Http::timeout(30)
            ->post("{$this->aiBridgeUrl}/api/documents/search", [
                'query' => $message,
                'limit' => 5,
                'user_id' => $userId
            ]);

        if (!$response->successful()) {
            Log::warning('Semantic search API error', ['status' => $response->status()]);
            return [];
        }

        $data = $response->json();
        return $data['results'] ?? [];
    }

    /**
     * Use Groq to intelligently search through documents
     */
    private function groqIntelligentSearch(string $query, int $userId): array
    {
        try {
            // Fetch recent documents with embeddings (content excerpts)
            $documents = Document::where('created_by', $userId)
                ->where('status', 'active')
                ->with(['folder:folder_id,folder_name', 'embeddings'])
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();

            if ($documents->isEmpty()) {
                Log::info('No documents found for Groq intelligent search');
                return [];
            }

            // Build document list for Groq
            $documentList = $this->buildDocumentListForGroq($documents);

            // Call Groq to identify relevant documents
            $relevantDocIds = $this->askGroqToIdentifyDocuments($query, $documentList);

            if (empty($relevantDocIds)) {
                Log::info('Groq found no matching documents');
                return [];
            }

            // Build results from identified documents
            return $this->buildGroqSearchResults($documents, $relevantDocIds);

        } catch (\Exception $e) {
            Log::error('Groq intelligent search failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Build document list for Groq analysis
     */
    private function buildDocumentListForGroq($documents): string
    {
        $list = "=== AVAILABLE DOCUMENTS ===\n\n";

        foreach ($documents as $doc) {
            $list .= "ID: {$doc->doc_id}\n";
            $list .= "Title: {$doc->title}\n";
            $list .= "Type: {$doc->document_type}\n";

            // Get content preview from embeddings or extracted text
            $preview = '';
            if ($doc->embeddings->isNotEmpty()) {
                $preview = substr($doc->embeddings->first()->chunk_text, 0, 300);
            } elseif ($doc->extracted_text) {
                $preview = substr($doc->extracted_text, 0, 300);
            }

            if (!empty($preview)) {
                $list .= "Content Preview: {$preview}...\n";
            }

            $list .= "\n";
        }

        return $list;
    }

    /**
     * Ask Groq to identify relevant document IDs
     */
    private function askGroqToIdentifyDocuments(string $query, string $documentList): array
    {
        return $this->groqService->identifyRelevantDocuments($query, $documentList);
    }

    /**
     * Build search results from Groq-identified documents
     */
    private function buildGroqSearchResults($documents, array $relevantDocIds): array
    {
        $results = [];

        foreach ($documents as $doc) {
            if (!in_array($doc->doc_id, $relevantDocIds)) {
                continue;
            }

            // Get full content from embeddings or extracted text
            $content = '';
            if ($doc->embeddings->isNotEmpty()) {
                $content = $doc->embeddings->first()->chunk_text;
            } elseif ($doc->extracted_text) {
                $content = substr($doc->extracted_text, 0, 1000);
            }

            $results[] = [
                'doc_id' => $doc->doc_id,
                'title' => $doc->title,
                'matched_chunk' => $content,
                'similarity_score' => 0.95 // High score since Groq identified it as relevant
            ];
        }

        Log::info('Groq search results built', ['count' => count($results)]);
        return $results;
    }

    /**
     * Build context string from semantic search results
     */
    private function buildSemanticSearchContext(array $results): string
    {
        $context = "\n\n=== DOCUMENT CONTENT SEARCH RESULTS ===\n\n";

        foreach ($results as $result) {
            $doc = Document::with('folder:folder_id,folder_name')->find($result['doc_id']);
            $folderName = $doc?->folder?->folder_name ?? 'No folder assigned';
            $similarity = round($result['similarity_score'] * 100, 1);
            $excerpt = substr($result['matched_chunk'], 0, 400);

            $context .= "Document: \"{$result['title']}\" (ID: {$result['doc_id']})\n";
            $context .= "Folder: {$folderName}\n";
            $context .= "Relevance: {$similarity}%\n";
            $context .= "Content: \"{$excerpt}...\"\n\n";
        }

        $context .= $this->getSemanticSearchInstructions();
        return $context;
    }

    /**
     * Get AI instructions for semantic search responses
     */
    private function getSemanticSearchInstructions(): string
    {
        return "\n=== RESPONSE INSTRUCTIONS ===\n" .
               "MUST DO:\n" .
               "- Answer using ONLY the content shown above\n" .
               "- Quote specific text from the excerpts\n" .
               "- State document titles only\n" .
               "- If asked 'what folder?', reply with ONLY the folder name\n\n" .
               "FORBIDDEN:\n" .
               "- Creating multi-level folder paths\n" .
               "- Using phrases like 'located in', 'found in'\n" .
               "- Mentioning folders unless directly asked\n" .
               "- Inventing information not in the context\n\n";
    }

    /**
     * Extract document map from search results
     */
    private function extractDocumentMap(array $results): array
    {
        $map = [];
        foreach ($results as $result) {
            $docId = $result['doc_id'];
            if (!isset($map[$docId])) {
                $map[$docId] = [
                    'doc_id' => $docId,
                    'title' => $result['title'],
                    'matches' => 0
                ];
            }
            $map[$docId]['matches']++;
        }
        return array_values($map);
    }
}