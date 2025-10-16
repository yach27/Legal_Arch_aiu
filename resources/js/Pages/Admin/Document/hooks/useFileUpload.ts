import { useState, useRef } from 'react';
import { router } from '@inertiajs/react';
import { UploadedFile } from '../types/types';
import { validateFileType, validateFileSize } from '../utils/fileUtils';

interface UseFileUploadProps {
  maxFileSize?: number;
  acceptedFileTypes?: string;
  onUploadSuccess?: (file: UploadedFile) => void;
  onUploadError?: (error: string) => void;
}

export const useFileUpload = ({
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png',
  onUploadSuccess,
  onUploadError
}: UseFileUploadProps = {}) => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!validateFileType(file, acceptedFileTypes)) {
      onUploadError?.('Invalid file type. Please select a supported file format.');
      return;
    }

    // Validate file size
    if (!validateFileSize(file, maxFileSize)) {
      onUploadError?.(`File size exceeds the maximum limit of ${maxFileSize / (1024 * 1024)}MB.`);
      return;
    }

    const uploadedFileData: UploadedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    };

    setUploadedFile(uploadedFileData);
  };

  const handleConfirmUpload = async () => {
    if (!uploadedFile) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      
      // Get Bearer token from localStorage (or wherever you store it)
      const token = localStorage.getItem('auth_token');
      
      // Replace with your Laravel API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const responseData = await response.json();
      console.log('Upload response:', responseData);
      
      if (responseData.success && responseData.document) {
        console.log('Navigating to AI processing with docId:', responseData.document.id);
        // Navigate to AI processing page with document ID as query parameter
        router.visit(`/ai-processing?docId=${responseData.document.id}`);
      } else {
        console.error('Upload response missing document data:', responseData);
        onUploadError?.('Upload succeeded but document data is missing');
      }
      
      onUploadSuccess?.(uploadedFile);
      setUploadedFile(null);
    } catch (error) {
      onUploadError?.('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    uploadedFile,
    isDragging,
    isUploading,
    fileInputRef,
    setIsDragging,
    handleFileSelect,
    handleConfirmUpload,
    handleCancelUpload,
    resetFileInput
  };
};