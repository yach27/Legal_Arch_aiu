import React, { useState } from "react";
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

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 ml-64"
        onClick={(e) => e.stopPropagation()}
        style={{ marginLeft: '16rem' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Delete Folder</h2>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            Are you sure you want to delete the folder <strong>"{folder.folder_name}"</strong>?
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
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transform hover:scale-105 transition-all duration-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none disabled:hover:from-red-600 disabled:hover:to-red-700 flex items-center gap-2"
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
};

export default DeleteFolderDialog;