<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;
use App\Services\DocumentProcessingService;

class AIProcessController extends Controller
{
    protected DocumentProcessingService $documentProcessor;

    public function __construct(DocumentProcessingService $documentProcessor)
    {
        $this->documentProcessor = $documentProcessor;
    }

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
                'description' => $latestDocument->description,  // AI-generated description
                'createdAt' => $latestDocument->created_at->format('Y-m-d'),
                'createdBy' => $createdByName,
                'filePath' => $latestDocument->file_path,
                'analysis' => $latestDocument->description ?: 'This document has been analyzed and is ready for processing.',
                // Use AI suggested folder name if available, otherwise use matched folder
                'suggestedLocation' => $latestDocument->ai_suggested_folder ?: ($latestDocument->folder ? $latestDocument->folder->folder_name : null),
                'suggestedCategory' => $latestDocument->folder ? $latestDocument->folder->folder_name : 'General Document',
                'status' => ucfirst($latestDocument->status ?? 'Pending Review'),
                'physicalLocation' => $latestDocument->physical_location,
                'folder_id' => $latestDocument->folder_id,
                'remarks' => $latestDocument->remarks  // Processing status (e.g., "Processed into 9 chunks")
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
            $mimeType = $this->documentProcessor->getMimeType($fileName);

            // Update status to processing (if not already)
            if ($document->status !== 'processing') {
                $document->update(['status' => 'processing']);
            }

            // Process document content and generate embeddings using service
            $this->documentProcessor->processDocument($document, $mimeType);

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
}