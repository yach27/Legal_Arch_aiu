<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\View;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;
use App\Models\Document;
use App\Models\DocumentEmbedding;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DocumentController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Document/index');
    }

    // Handle file upload with text processing and embedding generation
    public function store(Request $request)
    {
        // Validate the uploaded file
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,txt|max:10240', // 10MB max, document types only
            'folder_id' => 'nullable|integer',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category_id' => 'nullable|integer',
        ]);

        try {
            // Increase execution time for OCR processing
            set_time_limit(150); // 2.5 minutes to handle OCR processing

            $file = $request->file('file');

            // Get the folder path if folder_id is provided
            $folderPath = '';
            if ($request->folder_id) {
                $folder = \App\Models\Folder::find($request->folder_id);
                if ($folder) {
                    $folderPath = $folder->folder_name;
                }
            }
            
            // Store the file in the appropriate folder
            $path = $file->store($folderPath, 'documents');
            
            // Create document record
            $document = Document::create([
                'title' => $request->title ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'file_path' => $path,
                'folder_id' => $request->folder_id,
                'category_id' => $request->category_id ?? 1,
                'remarks' => $request->description,
                'status' => 'processing', // Set to processing since we auto-process
                'created_by' => auth()->id(),
            ]);

            // Debug logging
            \Log::info('Document uploaded successfully', [
                'doc_id' => $document->doc_id,
                'title' => $document->title,
                'file_path' => $document->file_path,
                'status' => $document->status,
                'created_by' => $document->created_by,
                'user_id' => auth()->id()
            ]);

            // Process document content and generate embeddings automatically
            try {
                $this->processDocumentContent($document, $file->getMimeType());
                \Log::info('Document processing completed', ['doc_id' => $document->doc_id, 'status' => 'active']);
            } catch (\Exception $e) {
                \Log::error('Document processing failed in upload', [
                    'doc_id' => $document->doc_id,
                    'error' => $e->getMessage()
                ]);
                $document->update([
                    'status' => 'failed',
                    'remarks' => 'Processing timeout or error: ' . $e->getMessage()
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded and processing started',
                'document' => [
                    'id' => $document->doc_id,
                    'title' => $document->title,
                    'filename' => basename($document->file_path),
                    'status' => $document->status,
                    'created_at' => $document->created_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
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
                DocumentEmbedding::create([
                    'doc_id' => $document->doc_id,
                    'chunk_index' => $index,
                    'chunk_text' => $embeddingData['chunk_text'],
                    'embedding_vector' => json_encode($embeddingData['embedding']),
                    'metadata' => [
                        'model_type' => $embeddingData['model_type'] ?? 'all-MiniLM-L6-v2',
                        'embedding_dimensions' => count($embeddingData['embedding']),
                        'chunk_length' => strlen($embeddingData['chunk_text']),
                        'generated_at' => now()->toISOString(),
                        'service_url' => env('LOCAL_EMBEDDING_URL', 'http://127.0.0.1:5001')
                    ],
                    'created_at' => now(),
                ]);
            }

            // Update document status to active after successful processing
            $document->update([
                'status' => 'active',
                'remarks' => "Processed into " . count($chunks) . " chunks"
            ]);

        } catch (\Exception $e) {
            $document->update([
                'status' => 'failed', 
                'remarks' => 'Processing failed: ' . $e->getMessage()
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
        $sentences = preg_split('/(?<=[.!?])\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
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

    // Get documents with filtering support
    public function getDocuments(Request $request)
    {
        $query = Document::with(['category', 'folder']);
        
        // Apply filters
        if ($request->has('folder_id') && $request->folder_id !== null && $request->folder_id !== '') {
            $query->where('folder_id', $request->folder_id);
        }

        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('year') && $request->year) {
            $query->whereYear('created_at', $request->year);
        }
        
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhere('remarks', 'LIKE', '%' . $searchTerm . '%');
            });
        }
        
        // Apply sorting
        $sortBy = $request->get('sort_by', 'updated_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        $documents = $query->orderBy($sortBy, $sortOrder)->get();
        
        return response()->json($documents);
    }

    // Get document counts
    public function getDocumentCounts(Request $request)
    {
        $totalDocuments = Document::count();
        $documentsByStatus = Document::select('status')
            ->selectRaw('count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return response()->json([
            'total_documents' => $totalDocuments,
            'documents_by_status' => $documentsByStatus
        ]);
    }

    // Get bulk folder document counts (optimized)
    public function getBulkFolderCounts(Request $request)
    {
        $validated = $request->validate([
            'folder_ids' => 'required|array',
            'folder_ids.*' => 'integer|exists:folders,folder_id'
        ]);

        try {
            $counts = Document::select('folder_id')
                ->selectRaw('count(*) as count')
                ->whereIn('folder_id', $validated['folder_ids'])
                ->groupBy('folder_id')
                ->pluck('count', 'folder_id')
                ->toArray();

            // Ensure all requested folders have a count (even if 0)
            $result = [];
            foreach ($validated['folder_ids'] as $folderId) {
                $result[$folderId] = $counts[$folderId] ?? 0;
            }

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get folder counts',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Get single folder document count (optimized)
    public function getFolderDocumentCount($folderId)
    {
        try {
            $count = Document::where('folder_id', $folderId)->count();
            return response()->json(['count' => $count]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get folder document count',
                'message' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Show AI processing page with latest uploaded document
     */
    public function aiProcessing(Request $request)
    {
        // Get the latest uploaded document by the current user with 'processing' status
        $latestDocument = Document::where('created_by', auth()->id())
            ->whereIn('status', ['processing', 'processed'])
            ->latest('created_at')
            ->first();
            
        $documentData = [];
        
        if ($latestDocument) {
            $documentData = [
                'doc_id' => $latestDocument->doc_id,
                'fileName' => basename($latestDocument->file_path) ?: $latestDocument->title,
                'title' => $latestDocument->title,
                'createdAt' => $latestDocument->created_at->format('Y-m-d'),
                'createdBy' => $latestDocument->created_by,
                'filePath' => $latestDocument->file_path,
            ];
        } else {
            // Fallback to URL parameters if no document found
            $documentData = [
                'doc_id' => $request->query('docId', null),
                'fileName' => $request->query('fileName', 'No file selected'),
                'title' => $request->query('title', $request->query('fileName', 'No file selected')),
                'createdAt' => now()->format('Y-m-d'),
                'createdBy' => 'System AI',
            ];
        }

        return Inertia::render('Admin/Document/components/FileUpload/AIProcessing', [
            'documentData' => $documentData
        ]);
    }

    /**
     * Get categories for AI suggestions
     */
    public function getAICategories()
    {
        try {
            $categories = \App\Models\Category::select('category_id', 'category_name', 'description')
                ->orderBy('category_name')
                ->get()
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get categories for AI', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to retrieve categories',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get folders for AI suggestions
     */
    public function getAIFolders()
    {
        try {
            $folders = \App\Models\Folder::select('folder_id', 'folder_name', 'folder_path', 'folder_type', 'category_id', 'created_by')
                ->with(['category:category_id,category_name'])
                ->orderBy('folder_name')
                ->get()
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => $folders
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get folders for AI', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to retrieve folders',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store embeddings from AI Bridge Service
     */
    public function storeEmbeddings(Request $request)
    {
        try {
            $validated = $request->validate([
                'doc_id' => 'required|integer',
                'embeddings' => 'required|array',
                'total_chunks' => 'required|integer',
                'model_used' => 'required|string'
            ]);

            $document = Document::findOrFail($validated['doc_id']);
            
            // Clear existing embeddings for this document
            DocumentEmbedding::where('doc_id', $validated['doc_id'])->delete();
            
            // Store new embeddings
            foreach ($validated['embeddings'] as $index => $embeddingData) {
                DocumentEmbedding::create([
                    'doc_id' => $validated['doc_id'],
                    'chunk_index' => $index,
                    'chunk_text' => $embeddingData['chunk_text'],
                    'embedding_vector' => json_encode($embeddingData['embedding']),
                    'metadata' => [
                        'model_type' => $validated['model_used'],
                        'embedding_dimensions' => count($embeddingData['embedding']),
                        'chunk_length' => strlen($embeddingData['chunk_text']),
                        'generated_at' => now()->toISOString(),
                        'service_url' => env('AI_BRIDGE_URL', 'http://127.0.0.1:5003'),
                        'service_response' => true
                    ],
                    'created_at' => now(),
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Embeddings stored successfully',
                'total_stored' => count($validated['embeddings'])
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to store embeddings', [
                'error' => $e->getMessage(),
                'doc_id' => $request->get('doc_id')
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to store embeddings',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get embeddings for a document
     */
    public function getEmbeddings($docId)
    {
        try {
            $document = Document::findOrFail($docId);
            
            $embeddings = DocumentEmbedding::where('doc_id', $docId)
                ->orderBy('chunk_index')
                ->get()
                ->map(function ($embedding) {
                    return [
                        'embedding_id' => $embedding->embedding_id,
                        'chunk_index' => $embedding->chunk_index,
                        'chunk_text' => $embedding->chunk_text,
                        'embedding_vector' => json_decode($embedding->embedding_vector),
                        'metadata' => $embedding->metadata,
                        'created_at' => $embedding->created_at
                    ];
                });

            return response()->json([
                'success' => true,
                'doc_id' => $docId,
                'document_title' => $document->title,
                'total_embeddings' => $embeddings->count(),
                'embeddings' => $embeddings
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get embeddings', [
                'error' => $e->getMessage(),
                'doc_id' => $docId
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve embeddings',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single document by ID
     */
    public function show($id)
    {
        try {
            $document = Document::with(['category', 'folder'])
                ->where('doc_id', $id)
                ->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'doc_id' => $document->doc_id,
                    'title' => $document->title,
                    'file_path' => $document->file_path,
                    'status' => $document->status,
                    'category_id' => $document->category_id,
                    'folder_id' => $document->folder_id,
                    'created_by' => $document->created_by,
                    'created_at' => $document->created_at,
                    'updated_at' => $document->updated_at,
                    'remarks' => $document->remarks,
                    'description' => $document->description,
                    'category' => $document->category,
                    'folder' => $document->folder
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching document', [
                'doc_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve document'
            ], 500);
        }
    }

    /**
     * Update document metadata (called by AI Bridge Service)
     */
    public function updateMetadata(Request $request, $id)
    {
        try {
            $document = Document::findOrFail($id);
            
            // Validate the request data
            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string|max:1000',
                'category_id' => 'sometimes|integer|exists:categories,category_id',
                'folder_id' => 'sometimes|integer|exists:folders,folder_id',
                'remarks' => 'sometimes|string|max:1000',
                'file_path' => 'sometimes|string|max:500',
            ]);

            // Update the document with AI-suggested metadata (status is protected from AI changes)
            $document->update($validated);
            
            Log::info('Document metadata updated by AI', [
                'doc_id' => $id,
                'updated_fields' => array_keys($validated),
                'new_title' => $document->title,
                'new_category_id' => $document->category_id,
                'new_folder_id' => $document->folder_id,
                'new_status' => $document->status
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Document metadata updated successfully by AI',
                'document' => [
                    'doc_id' => $document->doc_id,
                    'title' => $document->title,
                    'category_id' => $document->category_id,
                    'folder_id' => $document->folder_id,
                    'status' => $document->status,
                    'remarks' => $document->remarks
                ]
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found'
            ], 404);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('Error updating document metadata', [
                'doc_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update document metadata'
            ], 500);
        }
    }

    /**
     * Get document content for viewing
     */
    public function getContent($id)
    {
        try {
            $document = Document::findOrFail($id);
            
            // Check if user has permission to view this document
            // You can add authorization logic here if needed
            
            $filePath = $document->file_path;
            $storagePath = Storage::disk('documents')->path($filePath);
            
            // Check if file exists
            if (!Storage::disk('documents')->exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Document file not found'
                ], 404)->header('Access-Control-Allow-Origin', '*');
            }
            
            // Get file info
            $mimeType = Storage::disk('documents')->mimeType($filePath);
            $size = Storage::disk('documents')->size($filePath);
            $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            
            // Handle different file types
            switch ($extension) {
                case 'pdf':
                    // For PDFs, return the file directly with proper headers
                    return response()->file($storagePath, [
                        'Content-Type' => 'application/pdf',
                        'Content-Disposition' => 'inline; filename="' . basename($document->title) . '.pdf"',
                        'Access-Control-Allow-Origin' => '*',
                        'Access-Control-Allow-Methods' => 'GET',
                        'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                        'Cache-Control' => 'no-cache, must-revalidate'
                    ]);
                    
                case 'jpg':
                case 'jpeg':
                case 'png':
                case 'gif':
                case 'bmp':
                case 'webp':
                    // For images, return the file directly with proper headers
                    return response()->file($storagePath, [
                        'Content-Type' => $mimeType,
                        'Content-Disposition' => 'inline; filename="' . basename($document->title) . '.' . $extension . '"',
                        'Access-Control-Allow-Origin' => '*',
                        'Access-Control-Allow-Methods' => 'GET',
                        'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                        'Cache-Control' => 'no-cache, must-revalidate'
                    ]);
                    
                case 'txt':
                case 'md':
                case 'csv':
                    // For text files, read and return content
                    $content = Storage::disk('documents')->get($filePath);
                    return response()->json([
                        'success' => true,
                        'content' => $content,
                        'type' => 'text',
                        'mime_type' => $mimeType,
                        'size' => $size
                    ])->header('Access-Control-Allow-Origin', '*');
                    
                case 'doc':
                case 'docx':
                    // For Word documents, you might want to convert to text or PDF
                    // For now, just provide download link
                    return response()->json([
                        'success' => false,
                        'error' => 'Word documents cannot be previewed. Please download to view.',
                        'file_type' => $extension
                    ])->header('Access-Control-Allow-Origin', '*');
                    
                default:
                    // For unsupported formats, provide download option
                    return response()->json([
                        'success' => false,
                        'error' => 'File type not supported for preview',
                        'file_type' => $extension,
                        'mime_type' => $mimeType
                    ])->header('Access-Control-Allow-Origin', '*');
            }
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Document not found'
            ], 404);
            
        } catch (\Exception $e) {
            Log::error('Error getting document content', [
                'doc_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to load document content: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stream document content as base64 to bypass ad blockers
     */
    public function streamContent($id)
    {
        try {
            $document = Document::findOrFail($id);
            
            $filePath = $document->file_path;
            
            // Check if file exists
            if (!Storage::disk('documents')->exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Document file not found'
                ], 404);
            }
            
            // Get file info
            $mimeType = Storage::disk('documents')->mimeType($filePath);
            $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            
            // For text files, return content directly
            if (in_array($extension, ['txt', 'md', 'csv', 'json', 'xml', 'html'])) {
                $content = Storage::disk('documents')->get($filePath);
                return response()->json([
                    'success' => true,
                    'content' => $content,
                    'type' => 'text',
                    'mime_type' => $mimeType,
                    'extension' => $extension
                ]);
            }
            
            // For binary files (PDF, images), encode as base64
            $fileContent = Storage::disk('documents')->get($filePath);
            $base64Content = base64_encode($fileContent);
            
            return response()->json([
                'success' => true,
                'content' => $base64Content,
                'type' => 'binary',
                'mime_type' => $mimeType,
                'extension' => $extension,
                'encoding' => 'base64',
                'filename' => $document->title,
                'size' => strlen($fileContent)
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Document not found'
            ], 404);
            
        } catch (\Exception $e) {
            Log::error('Error streaming document content', [
                'doc_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to load document content: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Log document download activity
     */
    public function logDownload(Request $request, $id)
    {
        try {
            $user = $request->user('sanctum') ?? $request->user();

            if (!$user) {
                return response()->json(['success' => false, 'error' => 'Unauthorized'], 401);
            }

            $document = Document::find($id);

            if (!$document) {
                return response()->json(['success' => false, 'error' => 'Document not found'], 404);
            }

            // Log the download activity
            \App\Models\ActivityLog::create([
                'user_id' => $user->user_id,
                'doc_id' => $document->doc_id,
                'activity_type' => 'download',
                'activity_time' => now(),
                'activity_details' => 'Downloaded document: ' . $document->title,
            ]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Download logging failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

}