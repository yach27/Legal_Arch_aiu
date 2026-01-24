import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DocumentQueueNavigationProps {
    currentPosition: number;
    totalDocuments: number;
    isFirstDocument: boolean;
    isLastDocument: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onSkipAll?: () => void;
    showSkipAll?: boolean;
}

/**
 * Navigation component for multi-document upload flow.
 * Shows current position and provides previous/next navigation buttons.
 */
const DocumentQueueNavigation: React.FC<DocumentQueueNavigationProps> = ({
    currentPosition,
    totalDocuments,
    isFirstDocument,
    isLastDocument,
    onPrevious,
    onNext,
    onSkipAll,
    showSkipAll = false
}) => {
    if (totalDocuments <= 1) return null;

    return (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
                {/* Progress indicator */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalDocuments }, (_, i) => (
                            <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < currentPosition
                                        ? 'bg-[#228B22]'
                                        : i === currentPosition - 1
                                            ? 'bg-[#228B22] ring-2 ring-green-300'
                                            : 'bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                        Document {currentPosition} of {totalDocuments}
                    </span>
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrevious}
                        disabled={isFirstDocument}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isFirstDocument
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
                            }`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>

                    <button
                        onClick={onNext}
                        disabled={isLastDocument}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isLastDocument
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
                            }`}
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    {showSkipAll && onSkipAll && !isLastDocument && (
                        <button
                            onClick={onSkipAll}
                            className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-all duration-200"
                        >
                            Cancel All Remaining
                        </button>
                    )}
                </div>
            </div>

            {/* Remaining documents info */}
            {!isLastDocument && (
                <div className="mt-3 text-xs text-gray-500">
                    {totalDocuments - currentPosition} document{totalDocuments - currentPosition !== 1 ? 's' : ''} remaining after this one
                </div>
            )}
        </div>
    );
};

export default DocumentQueueNavigation;
