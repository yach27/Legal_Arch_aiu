import ReactDOMServer from 'react-dom/server';
import React from 'react';
import ReportTemplate from '../templates/ReportTemplate';

interface ReportStats {
    totalDocuments: number;
    documentsThisMonth: number;
    documentsThisWeek: number;
    activeUsers: number;
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

interface RenderReportOptions {
    reportType: string;
    stats: ReportStats;
    documentsByCategory: CategoryData[];
    recentActivity: ActivityData[];
}

export const renderReportToHTML = (options: RenderReportOptions): string => {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const reportElement = React.createElement(ReportTemplate, {
        reportType: options.reportType,
        stats: options.stats,
        documentsByCategory: options.documentsByCategory,
        recentActivity: options.recentActivity,
        date,
        time
    });

    return ReactDOMServer.renderToStaticMarkup(reportElement);
};
