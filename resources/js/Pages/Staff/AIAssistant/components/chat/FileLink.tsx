import React from 'react';
import { FileText } from 'lucide-react';
import { router } from '@inertiajs/react';
import { DocumentReference } from '../../types';

interface FileLinkProps {
  document: DocumentReference;
}

export const FileLink: React.FC<FileLinkProps> = ({ document }) => {
  const handleClick = () => {
    // Navigate to the specific folder where the document is located
    if (document.folder_id) {
      router.visit(`/admin/documents?folder=${document.folder_id}`);
    } else {
      // If no folder_id, navigate to root documents page
      router.visit('/admin/documents');
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-800 rounded-lg border border-green-200 transition-colors text-sm font-medium hover:shadow-md"
      title={`Click to view "${document.title}" in the Documents page${document.folder_name ? ` (located in ${document.folder_name} folder)` : ''}`}
    >
      <FileText size={14} className="flex-shrink-0" />
      <span className="truncate max-w-xs font-semibold">{document.title}</span>
      {document.folder_name && (
        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded ml-1">📁 {document.folder_name}</span>
      )}
    </button>
  );
};
