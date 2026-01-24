import React, { RefObject } from "react";
import { Download, Loader2 } from "lucide-react";

interface ActivityLogsHeaderProps {
    dateInputRef: RefObject<HTMLInputElement>;
    selectedDate: string;
    isExporting: boolean;
    onDateChange: (date: string) => void;
    onExport: (date?: string) => void;
}

const ActivityLogsHeader: React.FC<ActivityLogsHeaderProps> = ({
    dateInputRef,
    selectedDate,
    isExporting,
    onDateChange,
    onExport,
}) => {
    return (
        <div className="w-full shadow-lg rounded-b-3xl" style={{
            background: 'linear-gradient(135deg, #228B22 0%, #1e461eff 100%)'
        }}>
            <div className="px-8 py-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2" style={{ color: '#FBEC5D' }}>ACTIVITY LOGS</h1>
                        <p className="text-white/90 text-sm font-normal">
                            Monitor and track all system activities
                        </p>
                    </div>

                    {/* Export Button */}
                    <div className="flex items-center gap-2">
                        <input
                            ref={dateInputRef}
                            type="date"
                            onChange={(e) => {
                                const date = e.target.value;
                                onDateChange(date);
                                if (date) {
                                    onExport(date);
                                }
                            }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none z-50"
                        />
                        <button
                            onClick={() => dateInputRef.current?.showPicker()}
                            disabled={isExporting}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Export Logs
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogsHeader;
