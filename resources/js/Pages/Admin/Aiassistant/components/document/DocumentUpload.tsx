import React, { useCallback, useState } from 'react';

interface DocumentUploadProps {
  onUpload: (files: File[]) => void;
  isUploading?: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload, isUploading = false }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const acceptedFiles = files.filter(file => {
      const acceptedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      return acceptedTypes.includes(file.type);
    });
    
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files);
    }
  }, [onUpload]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
      } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
    >
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload"
        disabled={isUploading}
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="text-gray-600">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {isUploading ? (
            <p>Uploading...</p>
          ) : isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
              <p className="text-sm text-gray-500">Supported: PDF, DOC, DOCX, TXT</p>
            </div>
          )}
        </div>
      </label>
    </div>
  );
};