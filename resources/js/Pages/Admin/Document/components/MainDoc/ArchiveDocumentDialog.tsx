import React from 'react';
import { Archive } from 'lucide-react';
import { Document } from '../../types/types';

interface ArchiveDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onArchive: () => Promise<void>;
  document: Document;
}

const ArchiveDocumentDialog: React.FC<ArchiveDocumentDialogProps> = ({
  isOpen,
  onClose,
  onArchive,
  document,
}) => {
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleArchive = async () => {
    setIsArchiving(true);
    setError(null);

    try {
      await onArchive();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive document');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header - Staff theme */}
        <div className="bg-gradient-to-r from-[#228B22] to-[#1a6b1a] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Archive className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-white">Archive Document</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to archive this document?
            </p>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {document.title}
              </p>
              <p className="text-xs text-gray-500">
                {document.description || 'No description'}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              The document will be moved to archived and can be restored later.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isArchiving}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleArchive}
              disabled={isArchiving}
              className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isArchiving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Archiving...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  Archive
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveDocumentDialog;
