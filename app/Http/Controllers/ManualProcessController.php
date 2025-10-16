<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;
use App\Models\Category;
use App\Models\Folder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ManualProcessController extends Controller
{
    public function show(Request $request)
    {
        // Get specific document by ID if provided, or latest uploaded document by the current user
        $docId = $request->query('docId');
        
        \Log::info('ManualProcessController - show() called', [
            'url' => $request->fullUrl(),
            'all_params' => $request->all(),
            'query_params' => $request->query(),
            'docId' => $docId,
            'user_id' => auth()->id()
        ]);
        
        // Debug logging
        \Log::info('ManualProcessController - Document lookup', [
            'user_id' => auth()->id(),
            'auth_check' => auth()->check(),
            'docId_from_query' => $docId,
            'all_query_params' => $request->query()
        ]);
        
        if ($docId) {
            // If we have a document ID, find it (don't restrict by user for now to debug)
            $latestDocument = Document::where('doc_id', $docId)->first();
                
            \Log::info('ManualProcessController - Document search by ID', [
                'doc_id' => $docId,
                'found_document' => $latestDocument ? [
                    'doc_id' => $latestDocument->doc_id,
                    'title' => $latestDocument->title,
                    'status' => $latestDocument->status,
                    'created_by' => $latestDocument->created_by
                ] : null
            ]);
        } else {
            // If no auth, try to get the latest document overall for debugging
            if (!auth()->id()) {
                $latestDocument = Document::latest('created_at')->first();
            } else {
                $latestDocument = Document::where('created_by', auth()->id())
                    ->latest('created_at')
                    ->first();
            }
                
            \Log::info('ManualProcessController - Document search latest', [
                'user_id' => auth()->id(),
                'found_document' => $latestDocument ? [
                    'doc_id' => $latestDocument->doc_id,
                    'title' => $latestDocument->title,
                    'status' => $latestDocument->status,
                    'created_by' => $latestDocument->created_by
                ] : null,
                'user_documents_count' => Document::where('created_by', auth()->id())->count(),
                'all_documents_count' => Document::count(),
                'all_user_docs' => Document::where('created_by', auth()->id())->get(['doc_id', 'title', 'status', 'created_at'])->toArray()
            ]);
        }
            
        if ($latestDocument) {
            $documentData = [
                'doc_id' => $latestDocument->doc_id,
                'fileName' => basename($latestDocument->file_path) ?: $latestDocument->title,
                'title' => $latestDocument->title,
                'createdAt' => $latestDocument->created_at->format('Y-m-d'),
                'createdBy' => $latestDocument->created_by,
                'category_id' => $latestDocument->category_id,
                'folder_id' => $latestDocument->folder_id,
                'remarks' => $latestDocument->remarks,
            ];
        } else {
            $documentData = [
                'doc_id' => null,
                'fileName' => 'No file selected',
                'title' => 'No file selected',
                'createdAt' => now()->format('Y-m-d'),
                'createdBy' => 'Current User',
            ];
        }

        return Inertia::render('Admin/Document/components/FileUpload/ManualProcessing', [
            'documentData' => $documentData
        ]);
    }

    /**
     * Get categories for dropdown
     */
    public function getCategories()
    {
        $categories = Category::select('category_id', 'category_name')
            ->orderBy('category_name')
            ->get();

        return response()->json($categories);
    }

    /**
     * Get folders for dropdown
     */
    public function getFolders()
    {
        $folders = Folder::select('folder_id', 'folder_name', 'folder_path', 'folder_type', 'category_id', 'parent_folder_id')
            ->with('category:category_id,category_name')
            ->orderBy('folder_name')
            ->get();

        return response()->json($folders);
    }

    /**
     * Update document metadata
     */
    public function updateDocument(Request $request)
    {
        try {
            $request->validate([
                'doc_id' => 'required|integer|exists:documents,doc_id',
                'title' => 'required|string|max:255',
                'category_id' => 'required|exists:categories,category_id',
                'folder_id' => 'nullable|exists:folders,folder_id',
                'remarks' => 'nullable|string|max:1000',
            ]);

            $document = Document::find($request->doc_id);
                
            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            $newFilePath = $document->file_path; // Keep original path by default

            // If a folder is selected, move the file to that folder
            if ($request->folder_id && $request->folder_id != $document->folder_id) {
                $folder = \App\Models\Folder::find($request->folder_id);
                if ($folder) {
                    try {
                        // Get the current file name
                        $fileName = basename($document->file_path);
                        
                        // Since documents disk root is D:\legal_office, we need to get relative path
                        // folder_path is like "d:/legal_office/MOA", we need just "MOA"
                        $basePath = 'd:/legal_office/';
                        $newFolderPath = str_replace($basePath, '', $folder->folder_path);
                        $newFilePath = $newFolderPath . '/' . $fileName;
                        
                        // Move the file from current location to new folder
                        if (Storage::disk('documents')->exists($document->file_path)) {
                            Storage::disk('documents')->move($document->file_path, $newFilePath);
                            
                            \Log::info('File moved successfully', [
                                'from' => $document->file_path,
                                'to' => $newFilePath,
                                'folder_name' => $folder->folder_name,
                                'folder_path' => $folder->folder_path
                            ]);
                        }
                    } catch (\Exception $e) {
                        \Log::error('Failed to move file', [
                            'error' => $e->getMessage(),
                            'from' => $document->file_path,
                            'folder' => $folder->folder_name
                        ]);
                        // Continue with update even if file move fails
                        $newFilePath = $document->file_path;
                    }
                }
            }

            // Update document with new metadata and potentially new file path
            $document->update([
                'title' => $request->title,
                'category_id' => $request->category_id,
                'folder_id' => $request->folder_id,
                'remarks' => $request->remarks,
                'file_path' => $newFilePath,
                'status' => 'active',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update document',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}