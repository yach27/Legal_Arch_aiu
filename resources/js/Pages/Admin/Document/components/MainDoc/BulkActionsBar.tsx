import React, { useState } from 'react';
import { Archive, RotateCcw, Trash2, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onArchive: () => Promise<void>;
  onRestore: () => Promise<void>;
  onDelete: () => void;
  onClear: () => void;
  isArchived: boolean;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onArchive,
  onRestore,
  onDelete,
  onClear,
  isArchived
}) => {
  const [loading, setLoading] = useState(false);

  if (selectedCount === 0) return null;

  const handleArchive = async () => {
    setLoading(true);
    try {
      await onArchive();
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await onRestore();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gradient-to-r from-[#228B22] to-[#1a6b1a] rounded-2xl shadow-2xl border border-white/20 p-4">
        <div className="flex items-center gap-4">
          {/* Selected count */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <span className="text-white font-bold text-sm">
              {selectedCount} {selectedCount === 1 ? 'document' : 'documents'} selected
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isArchived && (
              <button
                onClick={handleArchive}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                type="button"
              >
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>
            )}

            {isArchived && (
              <button
                onClick={handleRestore}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#FBEC5D] hover:bg-[#F4D03F] disabled:bg-[#FBEC5D]/50 text-gray-900 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                type="button"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore</span>
              </button>
            )}

            <button
              onClick={onDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            <button
              onClick={onClear}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 px-4">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white text-sm font-medium">Processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;
