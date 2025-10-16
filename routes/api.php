<?php
use App\Http\Controllers\FolderController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\AIAssistantController;
use App\Http\Controllers\AIProcessController;
use App\Http\Controllers\ManualProcessController;

/*
|--------------------------------------------------------------------------|
| API Routes                                                                |
|--------------------------------------------------------------------------|
*/

// Public routes
Route::post('/login', [LoginController::class, 'login']);

// Health check route (public)
Route::get('/ai/health', function () {
    try {
        $response = Http::timeout(5)->get('http://localhost:5000/health');
        return response()->json([
            'laravel' => 'healthy',
            'ai_service' => $response->successful() ? 'healthy' : 'unavailable',
            'ai_service_response' => $response->json()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'laravel' => 'healthy', 
            'ai_service' => 'unavailable',
            'error' => $e->getMessage()
        ], 503);
    }
});

// Public AI helper routes (for Flask AI Bridge Service)
Route::get('/ai/categories/public', [DocumentController::class, 'getAICategories']);
Route::get('/ai/folders/public', [DocumentController::class, 'getAIFolders']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Folder routes
    Route::apiResource('folders', FolderController::class);
    Route::get('folders/search/{term}', [FolderController::class, 'search']);
    Route::get('folders/recent/{limit?}', [FolderController::class, 'recent']);
    Route::get('folders/tree', [FolderController::class, 'tree']);
    
    // Upload and category routes
    Route::post('/upload', [DocumentController::class, 'store']);
    Route::get('/categories', [CategoryController::class, 'index']);
    
    // Document routes
    Route::get('/documents', [DocumentController::class, 'getDocuments']);
    Route::get('/documents/counts', [DocumentController::class, 'getDocumentCounts']);
    Route::get('/counts', [DocumentController::class, 'getDocumentCounts']); // Alias for frontend compatibility

    // Optimized folder document count routes
    Route::post('/documents/folders/bulk-counts', [DocumentController::class, 'getBulkFolderCounts']);
    Route::get('/documents/folder/{folderId}/count', [DocumentController::class, 'getFolderDocumentCount']);
    // Manual Processing routes
    Route::get('/manual-process/categories', [ManualProcessController::class, 'getCategories']);
    Route::get('/manual-process/folders', [ManualProcessController::class, 'getFolders']);
    Route::post('/manual-process/save', [ManualProcessController::class, 'saveDocument']);
    Route::post('/manual-process/update', [ManualProcessController::class, 'updateDocument']);
    Route::get('/manual-process/document/{id}', [ManualProcessController::class, 'getDocument']);
    
    // Document routes for Flask AI Bridge integration
    Route::get('/documents/{id}', [DocumentController::class, 'show']); // Get single document
    Route::get('/documents/{id}/content', [DocumentController::class, 'getContent']); // Get document content for viewing
    Route::get('/doc/{id}/view', [DocumentController::class, 'getContent']); // Alternative endpoint to avoid ad blockers
    Route::post('/files/stream/{id}', [DocumentController::class, 'streamContent']); // Stream content as base64 to bypass ad blockers
    Route::post('/documents/{id}/log-download', [DocumentController::class, 'logDownload']); // Log download activity
    Route::put('/documents/{id}/status', [DocumentController::class, 'updateStatus']); // Update document status
    Route::put('/documents/{id}/update-metadata', [DocumentController::class, 'updateMetadata']); // Update document metadata (AI)
    
    // Document embedding routes
    Route::post('/document-embeddings/store', [DocumentController::class, 'storeEmbeddings']); // Store embeddings
    Route::get('/document-embeddings/{docId}', [DocumentController::class, 'getEmbeddings']); // Get embeddings
    
    // AI Processing helper routes - get categories and folders for AI suggestions
    Route::get('/ai/categories', [DocumentController::class, 'getAICategories']); // Get categories for AI
    Route::get('/ai/folders', [DocumentController::class, 'getAIFolders']); // Get folders for AI
    
    // AI Processing route (legacy)
    Route::post('/documents/process-ai', [AIProcessController::class, 'processWithAI']); // Process document with AI
    
    // Keep legacy routes for backward compatibility
    Route::post('/documents/save', [ManualProcessController::class, 'saveDocument']); // Manual document save
    Route::post('/documents/update', [ManualProcessController::class, 'updateDocument']); // Update uploaded document
    
    // Auth routes
    Route::post('/logout', [LogoutController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // User profile route
    Route::get('/user/profile', [App\Http\Controllers\AdminController::class, 'getUserProfile']);

    // AI Assistant routes (moved inside auth middleware)
    Route::prefix('ai')->group(function () {
        Route::post('/send-message', [AIAssistantController::class, 'sendMessage']);
        Route::get('/conversations', [AIAssistantController::class, 'getConversations']);
        Route::get('/chat-history/{sessionId}', [AIAssistantController::class, 'getChatHistory']);
        Route::delete('/conversations/{conversationId}', [AIAssistantController::class, 'deleteConversation']);
    });
});