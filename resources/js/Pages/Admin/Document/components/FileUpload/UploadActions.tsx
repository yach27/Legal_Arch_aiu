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
    <div className="px-8 pb-8 space-y-4 bg-white/30 backdrop-blur-md rounded-2xl shadow-lg">
      <button
        onClick={handleConfirm}
        disabled={isUploading}
        className="w-full bg-green-500/80 hover:bg-green-600/90 disabled:bg-green-300 text-white py-4 rounded-lg text-sm font-bold tracking-wide transition-colors"
      >
        {isUploading ? "UPLOADING..." : "CONFIRM TO UPLOAD FILE"}
      </button>

      <button
        onClick={onCancel}
        disabled={isUploading}
        className="w-full bg-white/60 hover:bg-white/80 disabled:bg-white/40 text-gray-700 py-4 rounded-lg text-sm font-bold tracking-wide transition-colors"
      >
        CANCEL UPLOAD
      </button>
    </div>
  );
};

export default UploadActions;
