<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;

class AdminController extends Controller
{
    /**
     * Display the admin dashboard
     */
    public function dashboard(Request $request)
    {
        // Get authenticated user - middleware ensures user is authenticated
        $user = $request->user('sanctum') ?? $request->user();

        // Get document statistics - count active and processed documents
        $totalDocuments = Document::whereIn('status', ['active'])->count();

        // Get recent files (recently made active within last 24 hours)
        $recentFiles = Document::with(['user', 'category'])
            ->where('status', 'active')
            ->where('updated_at', '>=', now()->subDay())
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($doc) {
                return [
                    'id' => $doc->doc_id,
                    'title' => $doc->title,
                    'timestamp' => $doc->updated_at->format('g:i A'),
                    'date' => $doc->updated_at->format('M d, Y'),
                    'created_by' => $doc->user ? $doc->user->firstname . ' ' . $doc->user->lastname : 'Unknown',
                ];
            });

        // Get recent downloads (from last 24 hours)
        $recentDownloads = \App\Models\ActivityLog::with(['document', 'user'])
            ->where('activity_type', 'download')
            ->where('activity_time', '>=', now()->subDay())
            ->orderBy('activity_time', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($log) {
                $activityTime = \Carbon\Carbon::parse($log->activity_time);
                return [
                    'id' => $log->log_id,
                    'title' => $log->document ? $log->document->title : 'Unknown Document',
                    'timestamp' => $activityTime->format('g:i A'),
                    'date' => $activityTime->format('M d, Y'),
                    'downloaded_by' => $log->user ? $log->user->firstname . ' ' . $log->user->lastname : 'Unknown',
                ];
            });

        return Inertia::render('Admin/Dashboard/index', [
            'user' => $user ? [
                'user_id' => $user->user_id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'middle_name' => $user->middle_name,
                'email' => $user->email,
            ] : null,
            'stats' => [
                'totalDocuments' => $totalDocuments,
            ],
            'recentFiles' => $recentFiles,
            'recentDownloads' => $recentDownloads,
        ]);
    }

    /**
     * Get document statistics for API calls
     */
    public function getDocumentStats(Request $request)
    {
        $totalDocuments = Document::whereIn('status', ['active', 'processed'])->count();

        return response()->json([
            'totalDocuments' => $totalDocuments,
        ]);
    }

    /**
     * Get the authenticated user's profile information
     */
    public function getUserProfile(Request $request)
    {
        // Get authenticated user
        $user = $request->user('sanctum') ?? $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'user_id' => $user->user_id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'middle_name' => $user->middle_name,
                'email' => $user->email,
                'created_at' => $user->created_at->toISOString(),
                'updated_at' => $user->updated_at->toISOString(),
            ],
        ]);
    }
}