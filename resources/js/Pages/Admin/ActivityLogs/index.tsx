import React, { useState, useRef } from "react";
import AdminLayout from "../../../../Layouts/AdminLayout";
import { usePage } from '@inertiajs/react';
import axios from "axios";
import ActivityLogsHeader from "./components/ActivityLogsHeader";
import ActivityLogsCard from "./components/ActivityLogsCard";

interface Activity {
    action: string;
    document: string;
    user: string;
    time: string;
}

interface ActivityLogsProps {
    activities: Activity[];
    [key: string]: any;
}

const ActivityLogs = () => {
    const { props } = usePage<ActivityLogsProps>();
    const activities = props.activities || [];

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const itemsPerPage = 10;

    // Get unique activity types for filter
    const activityTypes = ['all', ...Array.from(new Set(activities.map(a => a.action)))];

    // Filter activities based on selected filter
    const filteredActivities = selectedFilter === 'all'
        ? activities
        : activities.filter(a => a.action === selectedFilter);

    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handleGoToPage = (page: number) => {
        setCurrentPage(page);
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
    };

    const handleExportActivityLogs = async (date?: string) => {
        setIsExporting(true);
        try {
            const exportDate = date || selectedDate;

            const response = await axios.post('/admin/reports/export-activity-logs', {
                date: exportDate
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            const dateSuffix = exportDate ? `-${exportDate}` : '';
            link.href = url;
            link.setAttribute('download', `activity-logs${dateSuffix}-${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting activity logs:", error);
            alert("Failed to export activity logs. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <ActivityLogsHeader
                dateInputRef={dateInputRef}
                selectedDate={selectedDate}
                isExporting={isExporting}
                onDateChange={handleDateChange}
                onExport={handleExportActivityLogs}
            />

            <div className="px-6 py-6">
                <div className="max-w-7xl mx-auto">
                    <ActivityLogsCard
                        activities={filteredActivities}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        selectedFilter={selectedFilter}
                        activityTypes={activityTypes}
                        onFilterChange={handleFilterChange}
                        onPrevPage={handlePrevPage}
                        onNextPage={handleNextPage}
                        onGoToPage={handleGoToPage}
                    />
                </div>
            </div>
        </>
    );
};

ActivityLogs.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);

export default ActivityLogs;
