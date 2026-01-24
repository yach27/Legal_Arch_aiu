import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { Folder } from "../../types/types";

interface DeleteFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  folder: Folder | null;
}

const DeleteFolderDialog: React.FC<DeleteFolderDialogProps> = ({
  isOpen,
  onClose,
  onDelete,
  folder,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !folder) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      await onDelete();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete folder");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
      style={{ margin: 0, padding: 0 }}
    >
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-50 rounded-full border border-red-200">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Delete Folder</h2>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            Are you sure you want to delete the folder <strong className="text-gray-900">"{folder.folder_name}"</strong>?
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              <strong>Warning:</strong> This action cannot be undone. All files and subfolders within this folder will also be permanently deleted.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-all duration-200 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );

  // Only render portal if DOM document.body is available
  if (typeof window !== 'undefined' && window.document?.body) {
    return createPortal(modalContent, window.document.body);
  }

  return null;
};

export default DeleteFolderDialog;