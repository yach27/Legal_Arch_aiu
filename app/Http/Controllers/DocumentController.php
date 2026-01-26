<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\ActivityLog;
use App\Services\DocumentProcessingService;
use App\Services\AIAnalysisService;
use App\Services\DocumentStorageService;
use App\Services\FolderMatchingService;
use App\Services\DocumentQueryService;
use Illuminate\Support\Facades\Log;

class DocumentController extends Controller
{
    protected $processingService;
    protected $aiAnalysisService;
    protected $storageService;
    protected $folderMatchingService;
    protected $queryService;

    public function __construct(
        DocumentProcessingService $processingService,
        AIAnalysisService $aiAnalysisService,
        DocumentStorageService $storageService,
        FolderMatchingService $folderMatchingService,
        DocumentQueryService $queryService
    ) {
        $this->processingService = $processingService;
        $this->aiAnalysisService = $aiAnalysisService;
        $this->storageService = $storageService;
        $this->folderMatchingService = $folderMatchingService;
        $this->queryService = $queryService;
    }

    public function index()
    {
        return Inertia::render('Admin/Document/index');
    }

    /**
     * Handle file upload with text processing and embedding generation
     */
    public function store(Request $request)
    {
        // Validate the uploaded file
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,txt|max:51200',
            'folder_id' => 'nullable|integer',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category_id' => 'nullable|integer',
        ]);

        $user = $request->user();
        if (!$user->can_upload && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to upload documents'
            ], 403);
        }

        try {
            set_time_limit(600); // 10 minutes for large PDF OCR processing

            $file = $request->file('file');

            // Store the file using storage service
            $path = $this->storageService->storeUploadedFile($file, $request->folder_id);

            // Create document record
            $document = Document::create([
                'title' => $request->title ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'file_path' => $path,
                'folder_id' => $request->folder_id,
                'remarks' => $request->description,
                'status' => 'processing',
                'created_by' => auth()->id(),
            ]);

            Log::info('Document uploaded successfully', [
                'doc_id' => $document->doc_id,
                'title' => $document->title,
                'file_path' => $document->file_path,
            ]);

            // Process document content and generate embeddings automatically
            try {
                $fullText = null;

                // Extract text first
                try {
                    $fullText = $this->storageService->getDocumentText($document);
                } catch (\Exception $extractError) {
                    Log::warning('Text extraction failed, proceeding without AI analysis', [
                        'doc_id' => $document->doc_id,
                        'error' => $extractError->getMessage()
                    ]);
                }

                // Process document content and generate embeddings
                $this->processingService->processDocument($document, $file->getMimeType());

                // Use AI to analyze and auto-fill metadata
                if ($fullText) {
                    try {
                        $aiAnalysis = $this->aiAnalysisService->analyzeDocument(
                            $document->doc_id,
                            $fullText,
                            $document->title
                        );

                        // Log AI analysis result for debugging
                        Log::info('AI analysis result', [
                            'doc_id' => $document->doc_id,
                            'ai_title' => $aiAnalysis['title'] ?? 'NULL',
                            'ai_description' => $aiAnalysis['description'] ?? 'NULL',
                            'ai_remarks' => $aiAnalysis['remarks'] ?? 'NULL',
                            'ai_suggested_folder' => $aiAnalysis['suggested_folder'] ?? 'NULL',
                        ]);

                        // Update document with AI suggestions
                        if (!empty($aiAnalysis['title']) || !empty($aiAnalysis['description'])) {
                            $updateData = [
                                'title' => $aiAnalysis['title'] ?? $document->title,
                                'description' => $aiAnalysis['description'] ?? $document->description,
                                'ai_suggested_folder' => $aiAnalysis['suggested_folder'] ?? null,
                            ];

                            if (!empty($aiAnalysis['remarks'])) {
                                $updateData['remarks'] = $aiAnalysis['remarks'];
                            }

                            Log::info('Updating document with AI data', [
                                'doc_id' => $document->doc_id,
                                'update_data' => $updateData,
                            ]);

                            // Match folder intelligently
                            $folder = $this->folderMatchingService->matchFolderFromAI($aiAnalysis);

                            if ($folder) {
                                $updateData['folder_id'] = $folder->folder_id;
                                Log::info('Folder matched successfully', [
                                    'doc_id' => $document->doc_id,
                                    'folder_id' => $folder->folder_id,
                                    'folder_name' => $folder->folder_name,
                                ]);
                            }

                            $document->update($updateData);
                        }
                    } catch (\Exception $aiError) {
                        Log::warning('AI auto-fill failed, document saved without AI metadata', [
                            'doc_id' => $document->doc_id,
                            'error' => $aiError->getMessage()
                        ]);
                    }
                }

                // Log successful upload activity
                ActivityLog::create([
                    'user_id' => auth()->id(),
                    'doc_id' => $document->doc_id,
                    'activity_type' => 'upload',
                    'activity_time' => now(),
                    'activity_details' => 'Document uploaded and processed with AI: ' . $document->title
                ]);

            } catch (\Exception $e) {
                Log::error('Document processing failed in upload', [
                    'doc_id' => $document->doc_id,
                    'error' => $e->getMessage()
                ]);
                $document->update([
                    'status' => 'failed',
                    'remarks' => 'Processing timeout or error: ' . $e->getMessage()
                ]);

                ActivityLog::create([
                    'user_id' => auth()->id(),
                    'doc_id' => $document->doc_id,
                    'activity_type' => 'upload',
                    'activity_time' => now(),
                    'activity_details' => 'Document upload failed: ' . $e->getMessage()
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
     * Handle scanner service uploads (public endpoint, no auth required)
     * This is specifically for the local scanner bridge service
     */
    public function scannerUpload(Request $request)
    {
        // Validate the uploaded file
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,txt|max:51200',
        ]);

        try {
            set_time_limit(600); // 10 minutes for large PDF OCR processing

            $file = $request->file('file');

            // Store the file using storage service (no folder specified for scanner uploads)
            $path = $this->storageService->storeUploadedFile($file, null);

            // Create document record using system user (user_id 1, typically admin)
            // You can change this to a specific "scanner" user if you create one
            $systemUserId = 1;

            $document = Document::create([
                'title' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'file_path' => $path,
                'folder_id' => null,
                'remarks' => 'Uploaded via scanner service',
                'status' => 'processing',
                'created_by' => $systemUserId,
            ]);

            Log::info('Scanner document uploaded successfully', [
                'doc_id' => $document->doc_id,
                'title' => $document->title,
                'file_path' => $document->file_path,
            ]);

            // Process document content and generate embeddings automatically
            try {
                $fullText = null;

                // Extract text first
                try {
                    $fullText = $this->storageService->getDocumentText($document);
                } catch (\Exception $extractError) {
                    Log::warning('Text extraction failed for scanner upload', [
                        'doc_id' => $document->doc_id,
                        'error' => $extractError->getMessage()
                    ]);
                }

                // Process document content and generate embeddings
                $this->processingService->processDocument($document, $file->getMimeType());

                // Use AI to analyze and auto-fill metadata
                if ($fullText) {
                    try {
                        $aiAnalysis = $this->aiAnalysisService->analyzeDocument(
                            $document->doc_id,
                            $fullText,
                            $document->title
                        );

                        // Update document with AI suggestions
                        if (!empty($aiAnalysis['title']) || !empty($aiAnalysis['description'])) {
                            $updateData = [
                                'title' => $aiAnalysis['title'] ?? $document->title,
                                'description' => $aiAnalysis['description'] ?? $document->description,
                                'ai_suggested_folder' => $aiAnalysis['suggested_folder'] ?? null,
                            ];

                            if (!empty($aiAnalysis['remarks'])) {
                                $updateData['remarks'] = $aiAnalysis['remarks'];
                            }

                            // Match folder intelligently
                            $folder = $this->folderMatchingService->matchFolderFromAI($aiAnalysis);

                            if ($folder) {
                                $updateData['folder_id'] = $folder->folder_id;
                                Log::info('Folder matched for scanner upload', [
                                    'doc_id' => $document->doc_id,
                                    'folder_id' => $folder->folder_id,
                                    'folder_name' => $folder->folder_name,
                                ]);
                            }

                            $document->update($updateData);
                        }
                    } catch (\Exception $aiError) {
                        Log::warning('AI auto-fill failed for scanner upload', [
                            'doc_id' => $document->doc_id,
                            'error' => $aiError->getMessage()
                        ]);
                    }
                }

                // Log successful upload activity
                ActivityLog::create([
                    'user_id' => $systemUserId,
                    'doc_id' => $document->doc_id,
                    'activity_type' => 'upload',
                    'activity_time' => now(),
                    'activity_details' => 'Document uploaded via scanner: ' . $document->title
                ]);

            } catch (\Exception $e) {
                Log::error('Scanner document processing failed', [
                    'doc_id' => $document->doc_id,
                    'error' => $e->getMessage()
                ]);
                $document->update([
                    'status' => 'failed',
                    'remarks' => 'Processing error: ' . $e->getMessage()
                ]);
            }

            // Return response in format expected by scanner service
            return response()->json([
                'success' => true,
                'message' => 'Scanner document uploaded and processing started',
                'file' => [
                    'id' => $document->doc_id,
                    'original_name' => basename($document->file_path),
                    'title' => $document->title,
                    'status' => $document->status,
                    'created_at' => $document->created_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Scanner upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Scanner upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**

     * Get documents with filtering support
     */
    public function getDocuments(Request $request)
    {
        $documents = $this->queryService->getDocuments($request);
        return response()->json($documents);
    }

    /**
     * Get document counts
     */
    public function getDocumentCounts(Request $request)
    {
        try {
            $counts = $this->queryService->getDocumentCounts();
            return response()->json($counts);
        } catch (\Exception $e) {
            Log::error('Failed to get document counts', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve document counts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get bulk folder document counts (optimized)
     */
    public function getBulkFolderCounts(Request $request)
    {
        $validated = $request->validate([
            'folder_ids' => 'required|array',
            'folder_ids.*' => 'integer|exists:folders,folder_id'
        ]);

        try {
            $result = $this->queryService->getBulkFolderCounts($validated['folder_ids']);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get folder counts',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single folder document count (optimized)
     */
    public function getFolderDocumentCount($folderId)
    {
        try {
            $count = $this->queryService->getFolderDocumentCount($folderId);
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
        $latestDocument = $this->queryService->getLatestProcessingDocument(auth()->id());

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
     * Note: Categories system was removed - returning empty array for compatibility
     */
    public function getAICategories()
    {
        // Categories system removed - folders act as categories now
        return response()->json([
            'success' => true,
            'data' => []
        ]);
    }

    /**
     * Get folders for AI suggestions
     */
    public function getAIFolders()
    {
        try {
            $folders = \App\Models\Folder::select('folder_id', 'folder_name', 'folder_path', 'folder_type', 'created_by')
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

            $totalStored = $this->queryService->storeEmbeddings(
                $validated['doc_id'],
                $validated['embeddings'],
                $validated['model_used']
            );

            return response()->json([
                'success' => true,
                'message' => 'Embeddings stored successfully',
                'total_stored' => $totalStored
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
     * Get document text for AI processing
     */
    public function getDocumentText($docId)
    {
        try {
            $document = Document::findOrFail($docId);
            $fullText = $this->storageService->getDocumentText($document);

            return response()->json([
                'success' => true,
                'data' => [
                    'text' => $fullText,
                    'length' => strlen($fullText),
                    'doc_id' => $docId
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get document text', [
                'error' => $e->getMessage(),
                'doc_id' => $docId
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to get document text',
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
            $result = $this->queryService->getEmbeddings($docId);
            return response()->json($result);

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
     * Get all document embeddings for semantic search
     */
    public function getAllEmbeddings()
    {
        try {
            $result = $this->queryService->getAllEmbeddings();
            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Failed to get all embeddings', [
                'error' => $e->getMessage()
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
            $document = $this->queryService->getDocument($id);

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

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string|max:1000',
                'category_id' => 'sometimes|integer|exists:categories,category_id',
                'folder_id' => 'sometimes|integer|exists:folders,folder_id',
                'remarks' => 'sometimes|string|max:1000',
                'file_path' => 'sometimes|string|max:500',
            ]);

            $user = $request->user();
            if (!$user->can_edit && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to edit documents'
                ], 403);
            }

            $document->update($validated);

            Log::info('Document metadata updated by AI', [
                'doc_id' => $id,
                'updated_fields' => array_keys($validated),
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
            
            $user = auth()->user();
            if (!$user->can_view && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'error' => 'You do not have permission to view documents'
                ], 403);
            }

            $fileInfo = $this->storageService->getDocumentContent($document);
            return $this->storageService->getFileResponse($document, $fileInfo);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Document not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Error getting document content', [
                'doc_id' => $id,
                'error' => $e->getMessage(),
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
            $result = $this->storageService->streamContent($document);
            return response()->json($result);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Document not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Error streaming document content', [
                'doc_id' => $id,
                'error' => $e->getMessage(),
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

            ActivityLog::create([
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

    /**
     * Delete a document (soft delete)
     */
    public function destroy($docId)
    {
        try {
            $document = Document::where('doc_id', $docId)->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            $user = auth()->user();
            
            // Allow deletion if user has permission OR if it's their own document in 'processing' state
            $isOwner = $document->created_by === $user->user_id || $document->created_by === $user->id;
            $isProcessing = $document->status === 'processing';
            
            if (!$user->can_delete && $user->role !== 'admin') {
                // If they don't have global delete permission, check if it's their own draft
                if (!($isOwner && $isProcessing)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You do not have permission to delete documents'
                    ], 403);
                }
            }

            // Log the activity BEFORE deleting
            ActivityLog::create([
                'user_id' => auth()->id(),
                'doc_id' => $docId,
                'activity_type' => 'delete',
                'activity_time' => now(),
                'activity_details' => 'Document deleted: ' . $document->title
            ]);

            // Delete physical file and embeddings
            $this->storageService->deleteDocument($document);

            // Delete the document record
            $document->delete();

            Log::info('Document deleted successfully', [
                'doc_id' => $docId,
                'title' => $document->title,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Document deletion failed', [
                'doc_id' => $docId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive a document
     */
    public function archive($id)
    {
        try {
            $document = Document::findOrFail($id);

            Log::info('Archive attempt started', [
                'doc_id' => $id,
                'current_status' => $document->status,
                'current_folder_id' => $document->folder_id
            ]);

            $user = auth()->user();
            if (!$user->can_archive && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to archive documents'
                ], 403);
            }

            // Keep folder_id and only change status to archived
            $document->status = 'archived';
            $saved = $document->save();

            Log::info('Archive attempt completed', [
                'doc_id' => $id,
                'save_result' => $saved,
                'new_status' => $document->status,
                'folder_id' => $document->folder_id
            ]);

            // Verify the change was saved
            $verifyDocument = Document::find($id);
            Log::info('Archive verification', [
                'doc_id' => $id,
                'verified_status' => $verifyDocument->status,
                'verified_folder_id' => $verifyDocument->folder_id
            ]);

            ActivityLog::create([
                'user_id' => auth()->id(),
                'doc_id' => $document->doc_id,
                'activity_type' => 'archive',
                'activity_time' => now(),
                'activity_details' => "Document '{$document->title}' archived (folder ID: {$document->folder_id})"
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document archived successfully',
                'data' => $document->fresh()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to archive document', [
                'doc_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to archive document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore an archived document
     */
    public function restore($id)
    {
        try {
            $document = Document::findOrFail($id);

            if ($document->status !== 'archived') {
                return response()->json([
                    'success' => false,
                    'message' => 'Document is not archived'
                ], 400);
            }

            $document->status = 'active';
            $document->save();

            ActivityLog::create([
                'user_id' => auth()->id(),
                'doc_id' => $document->doc_id,
                'activity_type' => 'restore',
                'activity_time' => now(),
                'activity_details' => "Document '{$document->title}' restored from archive"
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document restored successfully',
                'data' => $document
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to restore document', [
                'doc_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to restore document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk archive documents
     */
    public function bulkArchive(Request $request)
    {
        try {
            $request->validate([
                'document_ids' => 'required|array',
                'document_ids.*' => 'integer|exists:documents,doc_id'
            ]);

            $documentIds = $request->document_ids;
            $archivedCount = 0;

            foreach ($documentIds as $docId) {
                $document = Document::find($docId);
                if ($document && $document->status !== 'archived') {
                    // Keep folder_id and only change status to archived
                    $document->status = 'archived';
                    $document->save();
                    $archivedCount++;

                    ActivityLog::create([
                        'user_id' => auth()->id(),
                        'doc_id' => $docId,
                        'activity_type' => 'archive',
                        'activity_time' => now(),
                        'activity_details' => "Document '{$document->title}' archived (folder ID: {$document->folder_id}) (bulk operation)"
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => "{$archivedCount} documents archived successfully",
                'archived_count' => $archivedCount
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to bulk archive documents', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to archive documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk restore documents
     */
    public function bulkRestore(Request $request)
    {
        try {
            $request->validate([
                'document_ids' => 'required|array',
                'document_ids.*' => 'integer|exists:documents,doc_id'
            ]);

            $documentIds = $request->document_ids;
            $restoredCount = 0;

            foreach ($documentIds as $docId) {
                $document = Document::find($docId);
                if ($document && $document->status === 'archived') {
                    $document->status = 'active';
                    $document->save();
                    $restoredCount++;

                    ActivityLog::create([
                        'user_id' => auth()->id(),
                        'doc_id' => $docId,
                        'activity_type' => 'restore',
                        'activity_time' => now(),
                        'activity_details' => "Document '{$document->title}' restored (bulk operation)"
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => "{$restoredCount} documents restored successfully",
                'restored_count' => $restoredCount
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to bulk restore documents', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to restore documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete documents
     */
    public function bulkDelete(Request $request)
    {
        try {
            $request->validate([
                'document_ids' => 'required|array',
                'document_ids.*' => 'integer|exists:documents,doc_id'
            ]);

            $documentIds = $request->document_ids;
            $deletedCount = 0;

            foreach ($documentIds as $docId) {
                $document = Document::find($docId);
                if ($document) {
                    // Log before deletion
                    ActivityLog::create([
                        'user_id' => auth()->id(),
                        'doc_id' => $docId,
                        'activity_type' => 'delete',
                        'activity_time' => now(),
                        'activity_details' => "Document '{$document->title}' deleted (bulk operation)"
                    ]);

                    // Delete file and embeddings
                    $this->storageService->deleteDocument($document);

                    // Delete document record
                    $document->delete();
                    $deletedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => "{$deletedCount} documents deleted successfully",
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to bulk delete documents', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
