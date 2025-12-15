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
import RecentActivity from "./components/RecentActivity";
import ReportActionCards from "./components/ReportActionCards";
import axios from 'axios';

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

interface ActivityData {
    action: string;
    document: string;
    user: string;
    time: string;
}

interface ReportProps {
    stats: ReportStats;
    documentsByCategory: CategoryData[];
    recentActivity: ActivityData[];
    [key: string]: any;
}

const Reports = () => {
    const { props } = usePage<ReportProps>();

    // Read period and folder from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const periodFromUrl = urlParams.get('period') as 'week' | 'month' | 'year' | null;
    const folderFromUrl = urlParams.get('folder');

    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>(periodFromUrl || 'month');
    const [selectedCategory, setSelectedCategory] = useState<string>(folderFromUrl || 'all');

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

    const recentActivity: ActivityData[] = props.recentActivity || [];

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

    const handleExportPDF = () => {
        try {
            // Open report in new window using form submission
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/admin/reports/export-pdf';
            form.target = '_blank';

            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrfToken) {
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = '_token';
                csrfInput.value = csrfToken;
                form.appendChild(csrfInput);
            }

            const reportTypeInput = document.createElement('input');
            reportTypeInput.type = 'hidden';
            reportTypeInput.name = 'reportType';
            reportTypeInput.value = 'general';
            form.appendChild(reportTypeInput);

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await axios.post('/admin/reports/export-excel', {
                reportType: 'general'
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting Excel:', error);
            alert('Failed to export Excel. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%),
                                     radial-gradient(circle at 75% 75%, #059669 0%, transparent 50%)`
                }}></div>
            </div>

            <ReportHeader onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />

            <div className="px-8 py-6 space-y-6">
                <ReportFilters
                    selectedPeriod={selectedPeriod}
                    selectedCategory={selectedCategory}
                    onPeriodChange={handlePeriodChange}
                    onCategoryChange={handleCategoryChange}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        subtitle={`+${stats.documentsThisWeek} this week`}
                    />
                    <StatCard
                        icon={<Users className="w-6 h-6" />}
                        title="Active Users"
                        value={stats.activeUsers.toString()}
                        subtitle="Last 30 days"
                    />
                    <StatCard
                        icon={<FolderOpen className="w-6 h-6" />}
                        title="Storage Used"
                        value={stats.storageUsed}
                        subtitle="Of available space"
                    />
                </div>

                <CategoryChart data={documentsByCategory} />

                <RecentActivity activities={recentActivity} />

                <ReportActionCards />
            </div>
        </div>
    );
};

Reports.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);

export default Reports;
