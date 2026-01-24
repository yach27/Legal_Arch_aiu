import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ActivityLogsPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
    onPrevPage: () => void;
    onNextPage: () => void;
    onGoToPage: (page: number) => void;
}

const ActivityLogsPagination: React.FC<ActivityLogsPaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    onPrevPage,
    onNextPage,
    onGoToPage,
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 font-normal">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrevPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-white"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>

                    <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                                page = i + 1;
                            } else if (currentPage <= 3) {
                                page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                page = totalPages - 4 + i;
                            } else {
                                page = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={page}
                                    onClick={() => onGoToPage(page)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        currentPage === page
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm'
                                            : 'border border-gray-300 text-gray-700 hover:bg-white bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={onNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-white"
                        aria-label="Next page"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogsPagination;
