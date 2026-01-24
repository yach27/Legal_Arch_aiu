import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Document } from '../../types/types';

interface DeleteDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onDocumentDeleted: () => void;
}

const DeleteDocumentDialog: React.FC<DeleteDocumentDialogProps> = ({
  isOpen,
  onClose,
  document,
  onDocumentDeleted
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'delete') {
      setError('Please type "delete" to confirm');
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`/api/documents/${document.doc_id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete document');
      }

      onDocumentDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Document</h3>
              <p className="text-sm text-gray-600 mt-0.5">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Message */}
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-700 mb-1">Warning</h4>
              <p className="text-sm text-red-600">
                Deleting this document will permanently remove the file from storage and all associated data.
              </p>
            </div>
          </div>

          {/* Document Info */}
          <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Document to delete:</div>
            <div className="font-semibold text-gray-900 break-words">{document.title}</div>
            {document.folder?.folder_name && (
              <div className="text-xs text-gray-600 mt-2">
                Folder: {document.folder.folder_name}
              </div>
            )}
          </div>

          {/* Confirmation Input */}
          <div className="mb-4">
            <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">delete</span> to confirm
            </label>
            <input
              type="text"
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Type 'delete' to confirm"
              autoComplete="off"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || confirmText.toLowerCase() !== 'delete'}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDocumentDialog;
