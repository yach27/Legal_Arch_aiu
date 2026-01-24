import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Folder } from "../../types/types";

interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  folder: Folder | null;
}

const RenameFolderModal: React.FC<RenameFolderModalProps> = ({
  isOpen,
  onClose,
  onRename,
  folder,
}) => {
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && folder) {
      setFolderName(folder.folder_name);
      setError("");
    }
  }, [isOpen, folder]);

  if (!isOpen || !folder) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      setError("Folder name cannot be empty");
      return;
    }

    if (folderName.trim() === folder.folder_name) {
      onClose();
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onRename(folderName.trim());
      setFolderName("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to rename folder");
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
        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">Rename Folder</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-lg transition-all text-xl"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Current Name: <span className="font-normal text-gray-500">{folder.folder_name}</span>
            </label>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter new folder name"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 font-normal shadow-sm"
              required
              disabled={loading}
              maxLength={255}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 border border-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !folderName.trim()}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Renaming..." : "Rename"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Only render portal if DOM document.body is available
  if (typeof window !== 'undefined' && window.document?.body) {
    return createPortal(modalContent, window.document.body);
  }

  return null;
};

export default RenameFolderModal;