import React from "react";
import { BarChart3, Download } from "lucide-react";

interface ReportHeaderProps {
    onExportPDF: () => void;
    onExportExcel: () => void;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ onExportPDF, onExportExcel }) => {
    return (
        <div className="relative bg-gradient-to-r from-green-700 via-green-600 to-green-700 text-white px-8 py-8 mb-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        <BarChart3 className="w-8 h-8" />
                        Document Reports & Analytics
                    </h1>
                    <p className="text-green-100 text-sm">
                        Comprehensive insights into your legal document management system
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={onExportPDF}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Export PDF
                    </button>
                    <button
                        onClick={onExportExcel}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Export Excel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportHeader;
