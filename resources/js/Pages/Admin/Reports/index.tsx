import React, { useState } from "react";
import AdminLayout from "../../../../Layouts/AdminLayout";
import { usePage } from '@inertiajs/react';
import {
    FileText,
    Calendar,
    Users,
    FolderOpen
} from "lucide-react";
import ReportHeader from "./components/ReportHeader";
import ReportFilters from "./components/ReportFilters";
import StatCard from "./components/StatCard";
import CategoryChart from "./components/CategoryChart";
import ReportActionCards from "./components/ReportActionCards";

interface ReportStats {
    totalDocuments: number;
    documentsThisMonth: number;
    documentsThisWeek: number;
    activeUsers: number;
    storageUsed: string;
    avgProcessingTime: string;
    growthRate: string;
}

interface CategoryData {
    category: string;
    count: number;
    percentage: number;
    trend: string;
}


interface PaginationData {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

interface ReportProps {
    stats: ReportStats;
    documentsByCategory: CategoryData[];
    pagination?: PaginationData;
    [key: string]: any;
}

const Reports = () => {
    const { props } = usePage<ReportProps>();

    // Read period and folder from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const periodFromUrl = urlParams.get('period') as 'week' | 'month' | 'year' | null;
    const folderFromUrl = urlParams.get('folder');
    const pageFromUrl = urlParams.get('page');

    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>(periodFromUrl || 'month');
    const [selectedCategory, setSelectedCategory] = useState<string>(folderFromUrl || 'all');
    const [currentPage, setCurrentPage] = useState<number>(pageFromUrl ? parseInt(pageFromUrl) : 1);

    // Use real data from backend with fallback
    const stats: ReportStats = props.stats || {
        totalDocuments: 0,
        documentsThisMonth: 0,
        documentsThisWeek: 0,
        activeUsers: 0,
        storageUsed: "0 B",
        avgProcessingTime: "0s",
        growthRate: "+0%"
    };

    const documentsByCategory: CategoryData[] = props.documentsByCategory || [];
    const pagination: PaginationData | undefined = props.pagination;

    // Handle filter changes
    const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
        setSelectedPeriod(period);
        // Reload page with new period filter
        window.location.href = `/admin/reports?period=${period}&folder=${selectedCategory}`;
    };

    const handleCategoryChange = (folder: string) => {
        setSelectedCategory(folder);
        // Reload page with new folder filter
        window.location.href = `/admin/reports?period=${selectedPeriod}&folder=${folder}`;
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Reload page with new page number
        window.location.href = `/admin/reports?period=${selectedPeriod}&folder=${selectedCategory}&page=${page}`;
    };

    return (
        <div className="min-h-screen">
            <ReportHeader />

            <div className="px-8 py-6 space-y-6">
                {/* Report Action Cards - Moved to top */}
                <ReportActionCards />

                <ReportFilters
                    selectedPeriod={selectedPeriod}
                    selectedCategory={selectedCategory}
                    onPeriodChange={handlePeriodChange}
                    onCategoryChange={handleCategoryChange}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        icon={<FileText className="w-6 h-6" />}
                        title="Total Documents"
                        value={stats.totalDocuments.toLocaleString()}
                        subtitle="All time"
                    />
                    <StatCard
                        icon={<Calendar className="w-6 h-6" />}
                        title="Documents This Month"
                        value={stats.documentsThisMonth.toString()}
                        subtitle={`+${stats.documentsThisWeek} last 7 days`}
                    />
                    <StatCard
                        icon={<Users className="w-6 h-6" />}
                        title="Active Users"
                        value={stats.activeUsers.toString()}
                        subtitle="Last 30 days"
                    />
                </div>

                <CategoryChart
                    data={documentsByCategory}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
};

Reports.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);

export default Reports;
