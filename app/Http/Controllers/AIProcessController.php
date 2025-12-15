<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

class AIProcessController extends Controller
{
    /**
     * Show AI processing page
     */
    public function show(Request $request)
    {
        // Get specific document by ID if provided, or latest uploaded document by the current user
        $docId = $request->query('docId');
        
        \Log::info('AIProcessController::show() - Debug info', [
            'docId_from_url' => $docId,
            'auth_user_id' => auth()->id(),
            'auth_check' => auth()->check(),
            'all_query_params' => $request->query(),
            'request_url' => $request->fullUrl()
        ]);
        
        if ($docId) {
            // First try to find with user restriction
            $latestDocument = Document::where('doc_id', $docId)
                ->where('created_by', auth()->id())
                ->first();
            
            // If not found, try without user restriction for debugging
            if (!$latestDocument) {
                $anyUserDocument = Document::where('doc_id', $docId)->first();
                \Log::info('AIProcessController::show() - Document found with different user', [
                    'doc_id' => $docId,
                    'current_user_id' => auth()->id(),
                    'document_owner' => $anyUserDocument ? $anyUserDocument->created_by : null,
                    'document' => $anyUserDocument ? [
                        'doc_id' => $anyUserDocument->doc_id,
                        'title' => $anyUserDocument->title,
                        'created_by' => $anyUserDocument->created_by,
                        'status' => $anyUserDocument->status
                    ] : null
                ]);
                
                // For now, use the document regardless of user for debugging
                $latestDocument = $anyUserDocument;
            }
                
            \Log::info('AIProcessController::show() - Searching by docId', [
                'doc_id' => $docId,
                'user_id' => auth()->id(),
                'found_document' => $latestDocument ? [
                    'doc_id' => $latestDocument->doc_id,
                    'title' => $latestDocument->title,
                    'created_by' => $latestDocument->created_by,
                    'status' => $latestDocument->status
                ] : null
            ]);
        } else {
            // If no docId provided, get the latest document (like ManualProcessController)
            if (!auth()->id()) {
                $latestDocument = Document::latest('created_at')->first();
            } else {
                // First try with user restriction
                $latestDocument = Document::where('created_by', auth()->id())
                    ->latest('created_at')
                    ->first();
                
                // If no user documents found, get latest overall document
                if (!$latestDocument) {
                    $latestDocument = Document::latest('created_at')->first();
                }
            }
                
            \Log::info('AIProcessController::show() - Searching latest document', [
                'user_id' => auth()->id(),
                'found_document' => $latestDocument ? [
                    'doc_id' => $latestDocument->doc_id,
                    'title' => $latestDocument->title,
                    'created_by' => $latestDocument->created_by,
                    'status' => $latestDocument->status
                ] : null,
                'total_user_docs' => Document::where('created_by', auth()->id())->count(),
                'all_user_docs' => Document::where('created_by', auth()->id())->get(['doc_id', 'title', 'status', 'created_at'])->toArray()
            ]);
        }
            
        $documentData = [];
        
        if ($latestDocument) {
            // Load relationships
            $latestDocument->load(['folder', 'user']);

            // Construct full name from user
            $createdByName = 'Unknown User';
            if ($latestDocument->user) {
                $nameParts = array_filter([
                    $latestDocument->user->firstname,
                    $latestDocument->user->middle_name,
                    $latestDocument->user->lastname
                ]);
                $createdByName = implode(' ', $nameParts) ?: 'Unknown User';
            }

            $documentData = [
                'doc_id' => $latestDocument->doc_id,
                'fileName' => basename($latestDocument->file_path) ?: $latestDocument->title,
                'title' => $latestDocument->title,
                'description' => $latestDocument->remarks,
                'createdAt' => $latestDocument->created_at->format('Y-m-d'),
                'createdBy' => $createdByName,
                'filePath' => $latestDocument->file_path,
                'analysis' => $latestDocument->remarks ?: 'This document has been analyzed and is ready for processing.',
                // Show folder name as the location
                'suggestedLocation' => $latestDocument->folder ? $latestDocument->folder->folder_name : 'General',
                'suggestedCategory' => $latestDocument->folder ? $latestDocument->folder->folder_name : 'General Document',
                'status' => ucfirst($latestDocument->status ?? 'Pending Review')
            ];
        } else {
            // Fallback to URL parameters if no document found
            $documentData = [
                'doc_id' => $request->query('docId', null),
                'fileName' => $request->query('fileName', 'No file selected'),
                'title' => $request->query('title', $request->query('fileName', 'No file selected')),
                'createdAt' => now()->format('Y-m-d'),
                'createdBy' => 'System AI',
                'analysis' => 'This document has been analyzed and is ready for processing.',
                'suggestedLocation' => 'Documents / General',
                'suggestedCategory' => 'General Document',
                'status' => 'Pending Review'
            ];
        }

        return Inertia::render('Admin/Document/components/FileUpload/AIProcessing', [
            'documentData' => $documentData
        ]);
    }

    /**
     * Process document with AI (generate embeddings)
     */
    public function processWithAI(Request $request)
    {
        try {
            // Increase execution time limit for OCR processing
            set_time_limit(300); // 5 minutes
            // Get specific document by ID if provided, or latest uploaded document by the current user
            $docId = $request->input('docId');
            
            if ($docId) {
                $document = Document::where('doc_id', $docId)
                    ->where('created_by', auth()->id())
                    ->first();
            } else {
                // First try to find a document with 'processing' status
                $document = Document::where('created_by', auth()->id())
                    ->where('status', 'processing')
                    ->latest('created_at')
                    ->first();
                    
                // If no processing document found, look for processed ones
                if (!$document) {
                    $document = Document::where('created_by', auth()->id())
                        ->where('status', 'processed')
                        ->latest('created_at')
                        ->first();
                }
            }
            
            // Debug logging
            \Log::info('AI Processing - Looking for document', [
                'user_id' => auth()->id(),
                'docId_from_request' => $docId,
                'request_data' => $request->all(),
                'found_document' => $document ? [
                    'doc_id' => $document->doc_id,
                    'title' => $document->title,
                    'status' => $document->status,
                    'file_path' => $document->file_path
                ] : null
            ]);
                
            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => $docId ? 'Document not found with the provided ID.' : 'No documents found for current user. Please upload a file first.',
                    'debug_info' => [
                        'user_id' => auth()->id(),
                        'requested_doc_id' => $docId,
                        'total_documents' => Document::count(),
                        'user_documents' => Document::where('created_by', auth()->id())->count()
                    ]
                ], 404);
            }

            // Get file extension to determine mime type
            $fileName = basename($document->file_path);
            $extension = pathinfo($fileName, PATHINFO_EXTENSION);
            $mimeTypes = [
                'pdf' => 'application/pdf',
                'doc' => 'application/msword',
                'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'txt' => 'text/plain',
            ];
            $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';

            // Update status to processing (if not already)
            if ($document->status !== 'processing') {
                $document->update(['status' => 'processing']);
            }

            // Process document content and generate embeddings
            $this->processDocumentContent($document, $mimeType);

            return response()->json([
                'success' => true,
                'message' => 'AI processing completed successfully',
                'document' => [
                    'id' => $document->doc_id,
                    'title' => $document->title,
                    'status' => 'active'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'AI processing failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process document content and generate embeddings
     */
    private function processDocumentContent(Document $document, string $mimeType): void
    {
        try {
            $fullPath = Storage::disk('documents')->path($document->file_path);
            
            // Extract text using Python service
            $fullText = $this->extractTextFromDocument($fullPath, $mimeType);
            
            if (empty($fullText)) {
                $document->update(['status' => 'failed', 'remarks' => 'Could not extract text from document']);
                return;
            }

            // Split text into chunks
            $chunks = $this->chunkText($fullText);
            
            if (empty($chunks)) {
                $document->update(['status' => 'failed', 'remarks' => 'Document text too short for processing']);
                return;
            }

            // Generate embeddings for chunks
            $embeddings = $this->generateEmbeddingsForChunks($chunks);

            // Store embeddings in database
            foreach ($embeddings as $index => $embeddingData) {
                \App\Models\DocumentEmbedding::create([
                    'doc_id' => $document->doc_id,
                    'chunk_index' => $index,
                    'chunk_text' => $embeddingData['chunk_text'],
                    'embedding_vector' => json_encode($embeddingData['embedding']),
                    'metadata' => [
                        'model_type' => $embeddingData['model_type'] ?? 'all-MiniLM-L6-v2',
                        'embedding_dimensions' => count($embeddingData['embedding']),
                        'chunk_length' => strlen($embeddingData['chunk_text']),
                        'generated_at' => now()->toISOString(),
                        'service_url' => env('LOCAL_EMBEDDING_URL', 'http://127.0.0.1:5001'),
                        'service_response' => $embeddingData['service_response'] ?? false
                    ],
                    'created_at' => now(),
                ]);
            }

            // Update document status
            $document->update([
                'status' => 'processed',
                'remarks' => "Processed into " . count($chunks) . " chunks with embeddings"
            ]);

        } catch (\Exception $e) {
            $document->update([
                'status' => 'failed', 
                'remarks' => 'AI processing failed: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Extract text from document using Python service
     */
    private function extractTextFromDocument(string $filePath, string $mimeType): string
    {
        $textExtractionUrl = env('TEXT_EXTRACTION_URL', 'http://127.0.0.1:5002');
        
        try {
            // Convert Windows paths to forward slashes for the HTTP request
            $normalizedPath = str_replace('\\', '/', $filePath);
            
            $response = Http::timeout(120)->post($textExtractionUrl . '/extract/path', [
                'file_path' => $normalizedPath,
                'mime_type' => $mimeType
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['text'] ?? '';
            }
            
            throw new \Exception('Text extraction service error: ' . $response->body());
            
        } catch (\Exception $e) {
            throw new \Exception('Text extraction failed: ' . $e->getMessage());
        }
    }

    /**
     * Split text into chunks
     */
    private function chunkText(string $text, int $chunkSize = 1000, int $overlap = 200): array
    {
        if (empty($text)) {
            return [];
        }

        $chunks = [];
        $sentences = $this->splitIntoSentences($text);
        
        $currentChunk = '';
        $currentLength = 0;
        
        foreach ($sentences as $sentence) {
            $sentenceLength = strlen($sentence);
            
            if ($currentLength + $sentenceLength > $chunkSize && !empty($currentChunk)) {
                $chunks[] = trim($currentChunk);
                
                $overlapText = $this->getOverlapText($currentChunk, $overlap);
                $currentChunk = $overlapText . ' ' . $sentence;
                $currentLength = strlen($currentChunk);
            } else {
                $currentChunk .= ' ' . $sentence;
                $currentLength += $sentenceLength + 1;
            }
        }
        
        if (!empty($currentChunk)) {
            $chunks[] = trim($currentChunk);
        }
        
        return array_filter($chunks, fn($chunk) => strlen(trim($chunk)) > 50);
    }

    /**
     * Split text into sentences
     */
    private function splitIntoSentences(string $text): array
    {
        $sentences = preg_split('/(?<=[.!?])\\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        return array_filter($sentences, fn($sentence) => strlen(trim($sentence)) > 10);
    }

    /**
     * Get overlap text from end of chunk
     */
    private function getOverlapText(string $text, int $overlapLength): string
    {
        if (strlen($text) <= $overlapLength) {
            return $text;
        }
        
        $overlap = substr($text, -$overlapLength);
        $spacePos = strpos($overlap, ' ');
        if ($spacePos !== false) {
            $overlap = substr($overlap, $spacePos + 1);
        }
        
        return $overlap;
    }

    /**
     * Generate embeddings for text chunks
     */
    private function generateEmbeddingsForChunks(array $chunks): array
    {
        $embeddingUrl = env('LOCAL_EMBEDDING_URL', 'http://127.0.0.1:5001');
        $embeddings = [];
        
        foreach ($chunks as $chunk) {
            try {
                $response = Http::timeout(30)->post($embeddingUrl . '/embed/single', [
                    'text' => $chunk
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $embeddings[] = [
                        'chunk_text' => $chunk,
                        'embedding' => $data['embedding'] ?? [],
                        'model_type' => 'all-MiniLM-L6-v2',
                        'dimensions' => $data['dimensions'] ?? 384,
                        'service_response' => true
                    ];
                } else {
                    // Use mock embedding as fallback
                    $embeddings[] = [
                        'chunk_text' => $chunk,
                        'embedding' => $this->generateMockEmbedding($chunk),
                        'model_type' => 'mock-fallback',
                        'dimensions' => 384,
                        'service_response' => false
                    ];
                }
            } catch (\Exception $e) {
                // Use mock embedding as fallback
                $embeddings[] = [
                    'chunk_text' => $chunk,
                    'embedding' => $this->generateMockEmbedding($chunk),
                    'model_type' => 'mock-fallback',
                    'dimensions' => 384,
                    'service_response' => false,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return $embeddings;
    }

    /**
     * Generate mock embedding for fallback
     */
    private function generateMockEmbedding(string $text): array
    {
        $hash = md5($text);
        $embedding = [];
        
        for ($i = 0; $i < 32; $i += 2) {
            $hex = substr($hash, $i, 2);
            $value = (hexdec($hex) / 255.0) * 2.0 - 1.0;
            $embedding[] = round($value, 6);
        }
        
        while (count($embedding) < 384) {
            $embedding = array_merge($embedding, $embedding);
        }
        
        return array_slice($embedding, 0, 384);
    }
}