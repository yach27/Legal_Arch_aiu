// Dashboard/index.tsx
import React, { useState } from "react";
import AdminLayout from "../../../../Layouts/AdminLayout";
import DashboardHeader from "./components/DashboardHeader";
import RecentFiles from "./components/RecentFiles";
import RecentDownloads from "./components/RecentDownloads";
import DocumentAnalytics from "./components/DocumentAnalytics";
import MonthlyUploads from "./components/MonthlyUploads";
import StatsCard from "./components/StatsCard";
import FileUploadUI from "../Document/components/FileUpload/FileUploadUI";
import { usePage } from '@inertiajs/react';
import { DashboardProps } from './types/dashboard';
import {
  documentCategories,
  monthlyUploadData
} from "./data/mockData";

export default function AdminDashboard() {
  const { props } = usePage<DashboardProps>();
  const stats = props.stats || { totalDocuments: 0 };
  const recentFiles = props.recentFiles || [];
  const recentDownloads = props.recentDownloads || [];
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Modern Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Header Section */}
      <DashboardHeader onUploadClick={() => setIsUploadModalOpen(true)} />
      
      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Modern Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Left Column - Stats and Analytics */}
          <div className="xl:col-span-4">
            <div className="space-y-6">
              {/* Total Documents Card */}
              <StatsCard
                title="TOTAL DOCUMENTS"
                value={stats.totalDocuments.toLocaleString()}
                showExport={true}
              />

              {/* Document Analytics below */}
              <DocumentAnalytics categories={documentCategories} />
            </div>
          </div>

          {/* Right Column - Chart and Recent Activity */}
          <div className="xl:col-span-8">
            <div className="space-y-6">
              {/* Monthly Chart at top */}
              <MonthlyUploads data={monthlyUploadData} />

              {/* Recent Activity below */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
                  <RecentFiles files={recentFiles} />
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
                  <RecentDownloads downloads={recentDownloads} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Modern Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl mx-4 ml-64" style={{ marginLeft: '16rem' }}>
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Upload Document</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <FileUploadUI
                maxFileSize={10 * 1024 * 1024}
                acceptedFileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onUploadSuccess={(file) => {
                  setIsUploadModalOpen(false);
                  window.location.href = `/ai-processing?fileName=${encodeURIComponent(file.name)}&title=${encodeURIComponent(file.name)}`;
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Apply Admin Layout wrapper
AdminDashboard.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
);