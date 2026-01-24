// components/DashboardHeader.tsx
import { useContext, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { DashboardContext } from '../../../../Context/DashboardContext';
import { FileText, Download, Upload, Loader2 } from 'lucide-react';
import axios from 'axios';

interface User {
  firstname?: string;
  name?: string;
}

interface PageProps {
  user?: User;
  auth?: {
    user?: User;
  };
  [key: string]: any;
}

interface DashboardHeaderProps {
  onUploadClick?: () => void;
}

export default function DashboardHeader({ onUploadClick }: DashboardHeaderProps) {
  const dashboardContext = useContext(DashboardContext);
  const collapsed = dashboardContext?.collapse;
  const pageData = usePage<PageProps>();
  const user = pageData.props.user || pageData.props.auth?.user;
  const userName = user?.firstname || user?.name || 'User';

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingActivityLogs, setIsExportingActivityLogs] = useState(false);

  const handleNavigateToDocuments = () => {
    router.visit('/admin/documents');
  };

  const handleGenerateUsageReport = async () => {
    setIsGenerating(true);
    try {
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
      reportTypeInput.value = 'usage';
      form.appendChild(reportTypeInput);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (error) {
      console.error("Error generating usage report:", error);
      alert("Failed to generate usage report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportActivityLogs = async () => {
    setIsExportingActivityLogs(true);
    try {
      const response = await axios.post('/admin/reports/export-activity-logs', {}, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting activity logs:", error);
      alert("Failed to export activity logs. Please try again.");
    } finally {
      setIsExportingActivityLogs(false);
    }
  };

  return (
    <div className="w-full shadow-lg rounded-b-3xl" style={{
      background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)'
    }}>
      <div className={`transition-all duration-300 ${
        collapsed ? 'px-4 py-5' : 'px-8 py-6'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex-shrink-0">
            <div className="relative">
              <h1 className={`font-bold text-white mb-2 transition-all duration-300 tracking-wide ${
                collapsed ? 'text-2xl' : 'text-3xl'
              }`}
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                HELLO, {userName.toUpperCase()}!
              </h1>
              <div className={`h-1 bg-gradient-to-r from-yellow-400 to-transparent rounded-full transition-all duration-300 ${
                collapsed ? 'w-40' : 'w-64'
              }`}></div>
            </div>
            <p className={`text-white/90 font-medium mt-3 transition-all duration-300 ${
              collapsed ? 'text-sm' : 'text-base'
            }`}
            style={{
              letterSpacing: '0.05em'
            }}>
              WELCOME BACK TO YOUR <span className="font-bold text-yellow-300">DASHBOARD</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          {/* Upload Document Button */}
          <button
            onClick={handleNavigateToDocuments}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Upload className="w-4 h-4" />
            <span>UPLOAD DOCUMENT</span>
          </button>

          {/* Generate Report Button */}
          <button
            onClick={handleGenerateUsageReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>GENERATING...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>GENERATE REPORT</span>
              </>
            )}
          </button>

          {/* Export Logs Button */}
          <button
            onClick={handleExportActivityLogs}
            disabled={isExportingActivityLogs}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingActivityLogs ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>EXPORTING...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>EXPORT LOGS</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}