import React, { DragEvent, ChangeEvent } from 'react';
import { FileUploadUIProps } from '../../types/types';
import { useFileUpload } from '../../hooks/useFileUpload';
import UploadArea from './UploadArea';
import FilePreview from './FilePreview';
import UploadActions from './UploadActions';

const FileUploadUI: React.FC<FileUploadUIProps> = ({
  maxFileSize,
  acceptedFileTypes,
  onUploadSuccess,
  onUploadError
}) => {
  const {
    uploadedFile,
    isDragging,
    isUploading,
    fileInputRef,
    setIsDragging,
    handleFileSelect,
    handleConfirmUpload,
    handleCancelUpload
  } = useFileUpload({
    maxFileSize,
    acceptedFileTypes,
    onUploadSuccess,
    onUploadError
  });

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full bg-white/30 backdrop-blur-md rounded-2xl">
      {/* Header */}
      <div className="px-8 py-5 bg-gray-50 border-b border-gray-300 rounded-t-lg">
        <h2 className="text-base font-bold text-gray-900 tracking-wide">
          UPLOAD YOUR FILE HERE
        </h2>
      </div>

      {/* Upload Area */}
      <div className="p-8">
        {!uploadedFile ? (
          <>
            <UploadArea
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onBrowseFiles={handleBrowseFiles}
            />
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
              accept={acceptedFileTypes || '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png'}
            />
          </>
        ) : (
          <FilePreview file={uploadedFile} />
        )}
      </div>

      {/* Action Buttons */}
      {uploadedFile && (
        <UploadActions
          isUploading={isUploading}
          onConfirm={handleConfirmUpload}
          onCancel={handleCancelUpload}
          uploadedFile={uploadedFile} 
        />
      )}
    </div>
  );
};

export default FileUploadUI;