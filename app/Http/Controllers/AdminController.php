<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;
use App\Models\Folder;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Display the admin dashboard
     */
    public function dashboard(Request $request)
    {
        // Get authenticated user - middleware ensures user is authenticated
        $user = $request->user('sanctum') ?? $request->user();

        // Get document statistics - count active documents
        $totalDocuments = Document::where('status', 'active')->count();

        // Get monthly upload statistics (last 12 months)
        $monthlyUploads = $this->getMonthlyUploadData();

        // Get document analytics by folder
        $documentAnalytics = $this->getDocumentAnalytics();

        // Get recent files (recently made active within last 24 hours)
        $recentFiles = Document::with(['user', 'folder'])
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
            'monthlyUploads' => $monthlyUploads,
            'documentAnalytics' => $documentAnalytics,
            'recentFiles' => $recentFiles,
            'recentDownloads' => $recentDownloads,
        ]);
    }

    /**
     * Get monthly upload data for the last 12 months
     */
    private function getMonthlyUploadData()
    {
        $monthlyData = [];
        $now = Carbon::now();

        // Get data for last 12 months
        for ($i = 11; $i >= 0; $i--) {
            $date = $now->copy()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            $count = Document::where('status', 'active')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->count();

            $monthlyData[] = [
                'month' => $date->format('M'),
                'year' => $date->format('Y'),
                'count' => $count,
                'label' => $date->format('M Y'),
            ];
        }

        return $monthlyData;
    }

    /**
     * Get document analytics grouped by folder
     */
    private function getDocumentAnalytics()
    {
        $folders = Folder::all();
        $analytics = [];

        foreach ($folders as $folder) {
            $count = Document::where('status', 'active')
                ->where('folder_id', $folder->folder_id)
                ->count();

            // Only include folders that have documents
            if ($count > 0) {
                $analytics[] = [
                    'folder_id' => $folder->folder_id,
                    'folder_name' => $folder->folder_name,
                    'count' => $count,
                    'color' => $this->getColorForFolder($folder->folder_id),
                ];
            }
        }

        // Sort by count descending
        usort($analytics, function($a, $b) {
            return $b['count'] - $a['count'];
        });

        return $analytics;
    }

    /**
     * Get a consistent color for each folder
     */
    private function getColorForFolder($folderId)
    {
        $colors = [
            '#16A34A', // green-600
            '#059669', // emerald-600
            '#0D9488', // teal-600
            '#0891B2', // cyan-600
            '#0284C7', // sky-600
            '#2563EB', // blue-600
            '#F59E0B', // amber-500
            '#EF4444', // red-500
        ];

        return $colors[$folderId % count($colors)];
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
                'profile_picture' => $user->profile_picture,
                'created_at' => $user->created_at->toISOString(),
                'updated_at' => $user->updated_at->toISOString(),
            ],
        ]);
    }
}