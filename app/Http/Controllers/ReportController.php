<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;
use App\Models\ActivityLog;
use App\Models\Folder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Exports\ReportExport;
use App\Exports\ActivityLogExport;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    /**
     * Display the reports page with real-time analytics
     */
    public function index(Request $request)
    {
        $folderFilter = $request->get('folder', 'all');

        // Calculate date ranges
        $now = Carbon::now();
        $last7Days = $now->copy()->subDays(7);
        $startOfMonth = $now->copy()->startOfMonth();

        // Base query for documents
        $baseQuery = Document::where('status', 'active');

        // Apply folder filter if not 'all'
        if ($folderFilter !== 'all') {
            $baseQuery->where('folder_id', $folderFilter);
        }

        // Get total documents count (with folder filter applied)
        $totalDocuments = (clone $baseQuery)->count();

        // Get documents this month
        $documentsThisMonth = (clone $baseQuery)
            ->where('created_at', '>=', $startOfMonth)
            ->count();

        // Get documents in last 7 days
        $documentsThisWeek = (clone $baseQuery)
            ->where('created_at', '>=', $last7Days)
            ->count();

        // Get active users (users who have activity in the last 30 days)
        $last30Days = $now->copy()->subDays(30);
        $activeUsers = User::whereHas('activityLogs', function ($query) use ($last30Days) {
            $query->where('activity_time', '>=', $last30Days);
        })->count();

        // Calculate storage used (sum of file sizes)
        $storageUsed = $this->formatBytes(
            (clone $baseQuery)->sum(DB::raw('LENGTH(file_path)')) * 1024
        );

        // Calculate average processing time (placeholder)
        $avgProcessingTime = "2.3s";

        // Get documents by folder with pagination
        $perPage = $request->get('per_page', 5);
        $allFoldersData = Folder::all()
        ->map(function ($folder) use ($totalDocuments) {
            $count = Document::where('status', 'active')
                ->where('folder_id', $folder->folder_id)
                ->count();

            $percentage = $totalDocuments > 0 ? ($count / $totalDocuments) * 100 : 0;

            return [
                'category' => $folder->folder_name,
                'count' => $count,
                'percentage' => round($percentage, 1)
            ];
        })
        ->sortByDesc('count')
        ->values();

        // Manual pagination
        $page = $request->get('page', 1);
        $total = $allFoldersData->count();
        $documentsByFolder = $allFoldersData->forPage($page, $perPage)->values()->toArray();

        $pagination = [
            'current_page' => (int)$page,
            'per_page' => (int)$perPage,
            'total' => $total,
            'last_page' => (int)ceil($total / $perPage),
            'from' => (($page - 1) * $perPage) + 1,
            'to' => min($page * $perPage, $total),
        ];

        return Inertia::render('Admin/Reports/index', [
            'stats' => [
                'totalDocuments' => $totalDocuments,
                'documentsThisMonth' => $documentsThisMonth,
                'documentsThisWeek' => $documentsThisWeek,
                'activeUsers' => $activeUsers,
                'storageUsed' => $storageUsed,
                'avgProcessingTime' => $avgProcessingTime,
            ],
            'documentsByCategory' => $documentsByFolder,
            'pagination' => $pagination,
        ]);
    }

    /**
     * Format activity type for display
     */
    private function formatActivityType($type)
    {
        $types = [
            'upload' => 'Document Uploaded',
            'download' => 'Document Downloaded',
            'view' => 'Document Viewed',
            'update' => 'Document Updated',
            'delete' => 'Document Deleted',
            'process' => 'Document Processed',
            'share' => 'Document Shared',
            'login' => 'User Login',
            'logout' => 'User Logout',
        ];

        return $types[$type] ?? ucfirst($type);
    }

    /**
     * Format bytes to human-readable size
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Export report as PDF (excludes activity logs)
     */
    public function exportPDF(Request $request)
    {
        $reportType = $request->input('reportType', 'general');
        $title = $reportType === 'usage' ? 'Document Usage Report' : 'General Report';

        // Get report data (without activity logs)
        $stats = $this->getReportStats();
        $documentsByCategory = $this->getDocumentsByCategory();

        // Render using Blade template
        return response()->view('reports.template', [
            'title' => $title,
            'reportType' => $reportType,
            'stats' => $stats,
            'documentsByCategory' => $documentsByCategory,
            'recentActivity' => [], // Empty array - no activity logs in PDF
            'date' => date('F d, Y'),
            'time' => date('h:i A')
        ], 200)
        ->header('Content-Type', 'text/html; charset=UTF-8')
        ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
        ->header('Pragma', 'no-cache')
        ->header('Expires', '0');
    }

    /**
     * Export report as Excel
     */
    public function exportExcel(Request $request)
    {
        $reportType = $request->input('reportType', 'general');

        // Get report data
        $stats = $this->getReportStats();
        $documentsByCategory = $this->getDocumentsByCategory();
        $recentActivity = $this->getRecentActivity();

        // Generate Excel file
        $filename = $reportType . '-report-' . date('Y-m-d') . '.xlsx';

        return Excel::download(
            new ReportExport($stats, $documentsByCategory, $recentActivity, $reportType),
            $filename
        );
    }

    /**
     * Get report statistics
     */
    private function getReportStats()
    {
        $now = Carbon::now();
        $last7Days = $now->copy()->subDays(7);
        $startOfMonth = $now->copy()->startOfMonth();

        $totalDocuments = Document::where('status', 'active')->count();
        $documentsThisMonth = Document::where('status', 'active')
            ->where('created_at', '>=', $startOfMonth)
            ->count();
        $documentsThisWeek = Document::where('status', 'active')
            ->where('created_at', '>=', $last7Days)
            ->count();

        // Count users active in last 30 days
        $last30Days = $now->copy()->subDays(30);
        $activeUsers = User::whereHas('activityLogs', function ($query) use ($last30Days) {
            $query->where('activity_time', '>=', $last30Days);
        })->count();

        return [
            'totalDocuments' => $totalDocuments,
            'documentsThisMonth' => $documentsThisMonth,
            'documentsThisWeek' => $documentsThisWeek,
            'activeUsers' => $activeUsers,
        ];
    }

    /**
     * Get documents by folder
     */
    private function getDocumentsByCategory()
    {
        $totalDocuments = Document::where('status', 'active')->count();

        return Folder::all()->map(function ($folder) use ($totalDocuments) {
            // Count documents in this folder
            $count = Document::where('status', 'active')
                ->where('folder_id', $folder->folder_id)
                ->count();

            $percentage = $totalDocuments > 0 ? ($count / $totalDocuments) * 100 : 0;

            $thisMonthCount = Document::where('status', 'active')
                ->where('folder_id', $folder->folder_id)
                ->where('created_at', '>=', Carbon::now()->startOfMonth())
                ->count();

            $lastMonthCount = Document::where('status', 'active')
                ->where('folder_id', $folder->folder_id)
                ->whereBetween('created_at', [
                    Carbon::now()->subMonth()->startOfMonth(),
                    Carbon::now()->subMonth()->endOfMonth()
                ])
                ->count();

            $trend = $lastMonthCount > 0
                ? round((($thisMonthCount - $lastMonthCount) / $lastMonthCount) * 100)
                : 0;

            return [
                'category' => $folder->folder_name, // Keep 'category' key for frontend compatibility
                'count' => $count,
                'percentage' => round($percentage, 1),
                'trend' => ($trend >= 0 ? '+' : '') . $trend . '%'
            ];
        })->sortByDesc('count')->take(10);
    }

    /**
     * Get recent activity (includes all activities including login/logout)
     */
    private function getRecentActivity($limit = 20)
    {
        return ActivityLog::with(['document', 'user'])
            ->orderBy('activity_time', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                // For login/logout activities, document is empty
                $documentTitle = in_array($log->activity_type, ['login', 'logout'])
                    ? ''
                    : ($log->document ? $log->document->title : 'Unknown Document');

                return [
                    'action' => $this->formatActivityType($log->activity_type),
                    'document' => $documentTitle,
                    'user' => $log->user ? $log->user->firstname . ' ' . $log->user->lastname : 'Unknown User',
                    'time' => Carbon::parse($log->activity_time)->format('Y-m-d H:i:s')
                ];
            });
    }

    /**
     * Export activity logs as Excel (includes all activities including login/logout)
     */
    public function exportActivityLogs(Request $request)
    {
        $date = $request->input('date');

        // Get all activity logs including login/logout (no limit)
        $query = ActivityLog::with(['document', 'user'])
            ->orderBy('activity_time', 'desc');

        if ($date) {
            $query->whereDate('activity_time', $date);
        }

        $activityLogs = $query->get()
            ->map(function ($log) {
                // For login/logout activities, document is empty
                $documentTitle = in_array($log->activity_type, ['login', 'logout'])
                    ? ''
                    : ($log->document ? $log->document->title : 'Unknown Document');

                return [
                    'activity_type' => $this->formatActivityType($log->activity_type),
                    'document' => $documentTitle,
                    'user' => $log->user ? $log->user->firstname . ' ' . $log->user->lastname : 'Unknown User',
                    'time' => Carbon::parse($log->activity_time)->format('Y-m-d H:i:s'),
                ];
            });

        // Generate Excel file
        $dateSuffix = $date ? '-' . $date : '';
        $filename = 'activity-logs' . $dateSuffix . '-' . date('Y-m-d') . '.xlsx';

        return Excel::download(
            new ActivityLogExport($activityLogs),
            $filename
        );
    }

    /**
     * Display the activity logs page
     */
    public function activityLogs(Request $request)
    {
        // Get all activity logs including login/logout
        $activities = ActivityLog::with(['document', 'user'])
            ->orderBy('activity_time', 'desc')
            ->limit(100) // Get last 100 activities
            ->get()
            ->map(function ($log) {
                $activityTime = Carbon::parse($log->activity_time);

                // For login/logout activities, show empty string (no document)
                if (in_array($log->activity_type, ['login', 'logout'])) {
                    $documentTitle = '';
                } else {
                    $documentTitle = $log->document ? $log->document->title : 'Unknown Document';
                }

                return [
                    'action' => $this->formatActivityType($log->activity_type),
                    'document' => $documentTitle,
                    'user' => $log->user
                        ? $log->user->firstname . ' ' . $log->user->lastname
                        : 'Unknown User',
                    'time' => $activityTime->diffForHumans()
                ];
            });

        return Inertia::render('Admin/ActivityLogs/index', [
            'activities' => $activities,
        ]);
    }

}
