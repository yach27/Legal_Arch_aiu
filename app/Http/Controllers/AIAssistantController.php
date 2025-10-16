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

class AIAssistantController extends Controller
{
    private $aiServiceUrl = 'http://localhost:5000';

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

            // Check if user is asking about document location/search
            $searchResults = $this->searchDocumentsByQuery($request->message, $userId);

            // Retrieve document context if document IDs are provided
            $documentContext = '';
            if ($request->document_ids && count($request->document_ids) > 0) {
                $documentContext = $this->retrieveDocumentContext($request->document_ids, $userId);

                Log::info('Document context retrieved', [
                    'document_count' => count($request->document_ids),
                    'context_length' => strlen($documentContext)
                ]);
            }

            // Add search results to document context if found
            if (!empty($searchResults)) {
                $documentContext .= "\n\n" . $searchResults['context'];
                Log::info('Document search results added to context', [
                    'documents_found' => $searchResults['count']
                ]);
            }

            // First, check if AI service is available
            Log::info('Checking AI service health...');
            try {
                $healthResponse = Http::timeout(5)->get("{$this->aiServiceUrl}/health");
                
                if (!$healthResponse->successful()) {
                    throw new \Exception('AI service health check failed: ' . $healthResponse->status());
                }
                
                $healthData = $healthResponse->json();
                Log::info('AI service health check', $healthData);
                
                if (!$healthData['model_loaded']) {
                    throw new \Exception('AI model not loaded in service');
                }
                
            } catch (\Exception $healthError) {
                Log::error('AI service unavailable', [
                    'error' => $healthError->getMessage(),
                    'service_url' => $this->aiServiceUrl
                ]);
                
                return response()->json([
                    'error' => 'AI service is currently unavailable. Please try again later.',
                    'details' => 'Service health check failed'
                ], 503);
            }

            // Call Python AI service with increased timeout and better error handling
            Log::info('Sending request to AI service...');
            
            $response = Http::timeout(240) // Increased timeout to 4 minutes for document processing
                ->retry(2, 1000) // Retry twice with 1 second delay
                ->post("{$this->aiServiceUrl}/chat", [
                    'message' => $request->message,
                    'conversation_id' => $conversationId,
                    'document_context' => $documentContext,
                ]);

            Log::info('AI service response received', [
                'status' => $response->status(),
                'response_size' => strlen($response->body())
            ]);

            if (!$response->successful()) {
                $errorBody = $response->body();
                Log::error('AI service error response', [
                    'status' => $response->status(),
                    'body' => $errorBody
                ]);
                
                throw new \Exception('AI service error (HTTP ' . $response->status() . '): ' . $errorBody);
            }

            $data = $response->json();
            
            if (!isset($data['response'])) {
                throw new \Exception('Invalid response format from AI service');
            }

            Log::info('AI response generated successfully', [
                'response_length' => strlen($data['response'])
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
            }

            // Save chat history to database
            $timestamp = now();
            AIHistory::create([
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'doc_id' => null,
                'question' => $request->message,
                'answer' => $data['response'],
                'status' => 'completed',
                'document_references' => !empty($documentReferences) ? json_encode($documentReferences) : null,
                'created_at' => $timestamp,
            ]);

            return response()->json([
                'id' => time(),
                'content' => $data['response'],
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
                    'starred' => false,
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

    /**
     * Retrieve document context from embeddings for the given document IDs
     */
    private function retrieveDocumentContext(array $documentIds, int $userId): string
    {
        try {
            // Verify user owns the documents
            $ownedDocuments = Document::whereIn('doc_id', $documentIds)
                ->where('created_by', $userId)
                ->pluck('doc_id')
                ->toArray();

            if (empty($ownedDocuments)) {
                Log::warning('No owned documents found for user', [
                    'user_id' => $userId,
                    'requested_docs' => $documentIds
                ]);
                return '';
            }

            // Get document embeddings/chunks for owned documents
            $embeddings = DocumentEmbedding::whereIn('doc_id', $ownedDocuments)
                ->with('document:doc_id,title')
                ->orderBy('doc_id')
                ->orderBy('chunk_index')
                ->get();

            if ($embeddings->isEmpty()) {
                Log::warning('No embeddings found for documents', [
                    'document_ids' => $ownedDocuments
                ]);
                return '';
            }

            // Build document context
            $context = "The user has attached documents to this conversation. Below is the extracted content from their attached documents that you should use to answer their questions:\n\n";

            $currentDocId = null;
            $chunkCount = 0;
            $maxChunks = 3; // Reduced to 3 chunks for faster processing
            $maxContextLength = 2000; // Maximum 2000 characters for context

            foreach ($embeddings as $embedding) {
                if ($chunkCount >= $maxChunks) {
                    break;
                }

                // Check if adding this chunk would exceed our length limit
                $potentialAddition = $embedding->chunk_text . "\n\n";
                if (strlen($context . $potentialAddition) > $maxContextLength) {
                    break;
                }

                // Add document header when switching to a new document
                if ($currentDocId !== $embedding->doc_id) {
                    $currentDocId = $embedding->doc_id;
                    $docTitle = $embedding->document->title ?? 'Document ' . $embedding->doc_id;
                    $context .= "\n--- Document: {$docTitle} ---\n";
                }

                // Add chunk text (truncate if still too long)
                $chunkText = $embedding->chunk_text;
                if (strlen($chunkText) > 600) {
                    $chunkText = substr($chunkText, 0, 600) . "... [content continues]";
                }

                $context .= $chunkText . "\n\n";
                $chunkCount++;
            }

            $context .= "\n--- End of Attached Document Content ---\n\n";
            $context .= "IMPORTANT: The content above is from the user's attached documents. When the user refers to 'this document', 'the attached file', or asks you to summarize/analyze documents, they are referring to the content provided above. You have access to this document content and should answer based on it. Do NOT say you cannot see attachments or that you need the user to copy/paste content - you already have the document content above.";

            Log::info('Document context built', [
                'total_chunks' => $chunkCount,
                'documents_included' => array_unique($embeddings->pluck('doc_id')->toArray()),
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

            // Search for documents matching the terms
            $query = Document::where('created_by', $userId)
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
                // show their most recent documents
                Log::info('No specific search terms, showing recent documents');
                $documents = Document::where('created_by', $userId)
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
}