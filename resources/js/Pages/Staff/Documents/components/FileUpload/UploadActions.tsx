import React from "react";
import { router } from "@inertiajs/react";
import { UploadActionsProps } from "../../types/types";

const UploadActions: React.FC<UploadActionsProps> = ({
  isUploading,
  onConfirm,
  onCancel,
  uploadedFile,
}) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    // After file upload completes, navigate to AI processing for metadata entry
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleConfirm}
        disabled={isUploading}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 text-white py-4 rounded-lg text-sm font-bold tracking-wide transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed"
      >
        {isUploading ? "UPLOADING..." : "CONFIRM TO UPLOAD FILE"}
      </button>

      <button
        onClick={onCancel}
        disabled={isUploading}
        className="w-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 py-4 rounded-lg text-sm font-bold tracking-wide transition-all disabled:cursor-not-allowed"
      >
        CANCEL UPLOAD
      </button>
    </div>
  );
};

export default UploadActions;
