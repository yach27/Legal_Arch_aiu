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

class ReportController extends Controller
{
    /**
     * Display the reports page with real-time analytics
     */
    public function index(Request $request)
    {
        $period = $request->get('period', 'month');
        $folderFilter = $request->get('folder', 'all'); // Changed from category to folder

        // Calculate date ranges based on period
        $now = Carbon::now();
        $startOfWeek = $now->copy()->startOfWeek();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfYear = $now->copy()->startOfYear();

        // Determine the date range based on selected period
        $startDate = match($period) {
            'week' => $startOfWeek,
            'year' => $startOfYear,
            default => $startOfMonth,
        };

        // Base query for documents
        $baseQuery = Document::where('status', 'active');

        // Apply folder filter if not 'all'
        if ($folderFilter !== 'all') {
            $baseQuery->where('folder_id', $folderFilter);
        }

        // Get total documents count (with folder filter applied)
        $totalDocuments = (clone $baseQuery)->count();

        // Get documents this period (with folder filter applied)
        $documentsThisPeriod = (clone $baseQuery)
            ->where('created_at', '>=', $startDate)
            ->count();

        // Get documents this month
        $documentsThisMonth = (clone $baseQuery)
            ->where('created_at', '>=', $startOfMonth)
            ->count();

        // Get documents this week
        $documentsThisWeek = (clone $baseQuery)
            ->where('created_at', '>=', $startOfWeek)
            ->count();

        // Get active users (users who have uploaded documents or have activity)
        $activeUsers = User::whereHas('activityLogs', function ($query) use ($startOfMonth) {
            $query->where('activity_time', '>=', $startOfMonth);
        })->count();

        // Calculate storage used (sum of file sizes)
        $storageUsed = $this->formatBytes(
            (clone $baseQuery)->sum(DB::raw('LENGTH(file_path)')) * 1024 // Approximate calculation
        );

        // Calculate average processing time (placeholder - can be enhanced with actual processing time tracking)
        $avgProcessingTime = "2.3s"; // You can add actual tracking later

        // Get documents by folder (all folders, not filtered)
        $documentsByFolder = Folder::all()
        ->map(function ($folder) use ($totalDocuments, $startDate, $period) {
            // Count documents in this folder
            $count = Document::where('status', 'active')
                ->where('folder_id', $folder->folder_id)
                ->count();

            $percentage = $totalDocuments > 0 ? ($count / $totalDocuments) * 100 : 0;

            // Calculate trend (comparing this month vs last month)
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
            $trendSign = $trend >= 0 ? '+' : '';

            return [
                'category' => $folder->folder_name, // Keep 'category' key for frontend compatibility
                'count' => $count,
                'percentage' => round($percentage, 1),
                'trend' => $trendSign . $trend . '%'
            ];
        })
        ->sortByDesc('count')
        ->values()
        ->take(5);

        // Get recent activity from activity logs
        $recentActivity = ActivityLog::with(['document', 'user'])
            ->orderBy('activity_time', 'desc')
            ->limit(10)
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
            'recentActivity' => $recentActivity,
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
     * Export report as PDF
     */
    public function exportPDF(Request $request)
    {
        $reportType = $request->input('reportType', 'general');
        $title = $reportType === 'usage' ? 'Document Usage Report' : 'General Report';

        // Get report data
        $stats = $this->getReportStats();
        $documentsByCategory = $this->getDocumentsByCategory();
        $recentActivity = $this->getRecentActivity();

        // Render using Blade template
        return response()->view('reports.template', [
            'title' => $title,
            'reportType' => $reportType,
            'stats' => $stats,
            'documentsByCategory' => $documentsByFolder,
            'recentActivity' => $recentActivity,
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

        // Generate CSV content (can be upgraded to Excel using maatwebsite/excel)
        $csv = $this->generateCSVContent($stats, $documentsByCategory, $recentActivity, $reportType);

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="report-' . date('Y-m-d') . '.csv"');
    }

    /**
     * Get report statistics
     */
    private function getReportStats()
    {
        $now = Carbon::now();
        $startOfWeek = $now->copy()->startOfWeek();
        $startOfMonth = $now->copy()->startOfMonth();

        $totalDocuments = Document::where('status', 'active')->count();
        $documentsThisMonth = Document::where('status', 'active')
            ->where('created_at', '>=', $startOfMonth)
            ->count();
        $documentsThisWeek = Document::where('status', 'active')
            ->where('created_at', '>=', $startOfWeek)
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
     * Get recent activity
     */
    private function getRecentActivity()
    {
        return ActivityLog::with(['document', 'user'])
            ->orderBy('activity_time', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($log) {
                // For login/logout activities, show empty string (no document)
                if (in_array($log->activity_type, ['login', 'logout'])) {
                    $documentTitle = '';
                } else {
                    $documentTitle = $log->document ? $log->document->title : 'Unknown Document';
                }

                return [
                    'action' => $this->formatActivityType($log->activity_type),
                    'document' => $documentTitle,
                    'user' => $log->user ? $log->user->firstname . ' ' . $log->user->lastname : 'Unknown User',
                    'time' => Carbon::parse($log->activity_time)->format('Y-m-d H:i:s')
                ];
            });
    }

    /**
     * Generate CSV content
     */
    private function generateCSVContent($stats, $documentsByCategory, $recentActivity, $reportType)
    {
        $title = $reportType === 'compliance' ? 'Compliance Report' : 'General Report';
        $csv = "{$title}\n";
        $csv .= "Generated on: " . date('F d, Y') . "\n\n";

        // Summary stats
        $csv .= "Summary Statistics\n";
        $csv .= "Total Documents,{$stats['totalDocuments']}\n";
        $csv .= "Documents This Month,{$stats['documentsThisMonth']}\n";
        $csv .= "Documents This Week,{$stats['documentsThisWeek']}\n";
        $csv .= "Active Users,{$stats['activeUsers']}\n";
        $csv .= "Growth Rate,{$stats['growthRate']}\n\n";

        // Documents by category
        $csv .= "Documents by Category\n";
        $csv .= "Category,Count,Percentage,Trend\n";
        foreach ($documentsByCategory as $item) {
            $csv .= "\"{$item['category']}\",{$item['count']},{$item['percentage']}%,{$item['trend']}\n";
        }

        // Recent activity
        $csv .= "\nRecent Activity\n";
        $csv .= "Action,Document,User,Time\n";
        foreach ($recentActivity as $activity) {
            $csv .= "\"{$activity['action']}\",\"{$activity['document']}\",\"{$activity['user']}\",{$activity['time']}\n";
        }

        return $csv;
    }
}
