// DocumentListItem.tsx - Individual document row in list view with TypeScript
import React, { useState } from 'react';
import { FileText, MoreVertical } from 'lucide-react';
import { router } from '@inertiajs/react';
import { DocumentListItemProps, Document } from '../../types/types';
import DocumentViewer from '../DocumentViewer/DocumentViewer';
import DocumentMenu from './DocumentMenu';

const DocumentListItem: React.FC<DocumentListItemProps> = ({
  document,
  category
}) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDocumentClick = (): void => {
    console.log('Document clicked:', document.title);
    setIsViewerOpen(true);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleMenuAction = (action: string): void => {
    setMenuOpen(false);

    switch (action) {
      case 'properties':
        console.log('Show properties for:', document.title);
        // TODO: Open properties modal
        break;
      case 'edit':
        console.log('Edit document:', document.title);
        // TODO: Open edit modal
        break;
      case 'delete':
        console.log('Delete document:', document.title);
        // TODO: Open delete confirmation
        break;
    }
  };

  const getStatusBadge = (status: Document['status']): string => {
    const statusConfig: Record<Document['status'], string> = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800',
      pending: 'bg-blue-100 text-blue-800'
    };

    return statusConfig[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (): React.ReactNode => {
    // You can extend this to show different icons based on file type
    return <FileText className="w-5 h-5 text-green-600" />;
  };

  const getFileExtension = (filename: string): string => {
    const extension = filename.split('.').pop()?.toUpperCase();
    return extension || 'FILE';
  };

  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
      onClick={handleDocumentClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleDocumentClick();
        }
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
          {getFileIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate">
              {document.title}
            </h4>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
              {getFileExtension(document.title)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span className="truncate">By {document.created_by}</span>
            <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 ${getStatusBadge(document.status)}`}>
              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
            </span>
            {category && (
              <span className="truncate" title={category.description}>
                {category.category_name}
              </span>
            )}
            {document.remarks && (
              <span className="italic truncate max-w-xs text-gray-400" title={document.remarks}>
                "{document.remarks}"
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="text-right text-sm text-gray-500">
          <div title={`Updated: ${document.updated_at}`}>
            {formatDate(document.updated_at)}
          </div>
          <div className="text-xs text-gray-400">
            {formatTime(document.updated_at)}
          </div>
        </div>
        <div className="relative">
          <button
            className="p-1 rounded-lg hover:bg-gray-100 flex-shrink-0"
            onClick={handleMenuClick}
            type="button"
            aria-label={`More options for ${document.title}`}
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {menuOpen && (
            <DocumentMenu
              onProperties={() => handleMenuAction('properties')}
              onEdit={() => handleMenuAction('edit')}
              onDelete={() => handleMenuAction('delete')}
            />
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={document}
      />
    </div>
  );
};

export default DocumentListItem;