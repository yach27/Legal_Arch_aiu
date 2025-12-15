import React, { useState } from "react";
import { FileText, BarChart3, Download, Loader2 } from "lucide-react";
import axios from "axios";

const ReportActionCards: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isViewingCompliance, setIsViewingCompliance] = useState(false);

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

    const handleViewCompliance = async () => {
        setIsViewingCompliance(true);
        try {
            const response = await axios.post('/admin/reports/export-excel', {
                reportType: 'compliance'
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `compliance-report-${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error viewing compliance report:", error);
            alert("Failed to generate compliance report. Please try again.");
        } finally {
            setIsViewingCompliance(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Document Usage Report
                </h3>
                <p className="text-green-100 text-sm mb-4">
                    Generate detailed reports on document access, downloads, and user interactions.
                </p>
                <button
                    onClick={handleGenerateUsageReport}
                    disabled={isGenerating}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Generate Report
                        </>
                    )}
                </button>
            </div>

            <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Compliance Report
                </h3>
                <p className="text-green-100 text-sm mb-4">
                    Track document retention policies, compliance status, and audit trails.
                </p>
                <button
                    onClick={handleViewCompliance}
                    disabled={isViewingCompliance}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isViewingCompliance ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            View Compliance
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ReportActionCards;
