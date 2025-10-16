<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AIAssistantController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\AIProcessController;
use App\Http\Controllers\ManualProcessController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

Route::get('/', [HomeController::class, 'index']);

// Login route - return the main page with login modal capability
Route::get('/login', [HomeController::class, 'index'])->name('login');

Route::get('/ai-processing', [AIProcessController::class, 'show'])->name('ai.processing');
Route::get('/manualy-processing', [ManualProcessController::class, 'show'])->name('manual.processing');

// Admin Routes (Protected) - Session authentication
Route::prefix('admin')->middleware('auth')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    Route::get('/document-stats', [AdminController::class, 'getDocumentStats'])->name('admin.document-stats');
    Route::get('/ai-assistant', [AIAssistantController::class, 'index'])->name('admin.Aiassistant.index');
    route::get('/documents', [DocumentController::class, 'index'])->name('admin.Document.index');
    
    // Add these routes to your routes/web.php

Route::get('/admin/documents', [DocumentController::class, 'index'])->name('documents.index');
Route::post('/admin/documents', [DocumentController::class, 'store'])->name('documents.store');
Route::get('/admin/documents/list', [DocumentController::class, 'getDocuments'])->name('documents.list');
Route::get('/admin/documents/counts', [DocumentController::class, 'getDocumentCounts'])->name('documents.counts');
});