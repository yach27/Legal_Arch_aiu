import React, { useState } from "react";
import { FileText, Download, Loader2, Activity } from "lucide-react";
import axios from "axios";

const ReportActionCards: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExportingActivityLogs, setIsExportingActivityLogs] = useState(false);

    const handleGenerateUsageReport = async () => {
        setIsGenerating(true);
        try {
            // Open report in new window
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
        <div className="grid grid-cols-1 gap-6">
            <div className="relative rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 p-6 text-white overflow-hidden group transform hover:-translate-y-1" style={{
                background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)'
            }}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative">
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#FBEC5D' }}>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        DOCUMENT USAGE REPORT
                    </h3>
                    <p className="text-white/90 text-sm mb-4 font-normal">
                        Generate detailed reports on document statistics and folder distribution.
                    </p>
                    <button
                        onClick={handleGenerateUsageReport}
                        disabled={isGenerating}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg text-white"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                GENERATING...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                GENERATE REPORT
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportActionCards;
