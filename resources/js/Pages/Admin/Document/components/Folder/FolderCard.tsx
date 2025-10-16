// FolderCard.tsx
import React, { useState, useEffect } from "react";
import { Folder, MoreVertical, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { FolderCardProps, Document } from "../../types/types";
import FolderMenu from "./FolderMenu";
import DocumentMenu from "../MainDoc/DocumentMenu";
import RenameFolderModal from "./RenameFolderModal";
import DeleteFolderDialog from "./DeleteFolderDialog";
import FolderPropertiesModal from "./FolderPropertiesModal";
import folderService from "../../services/folderService";
import realDocumentService from "../../services/realDocumentService";

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onFolderClick,
  documentCount,
  onFolderUpdated, // Add callback for when folder is updated
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDocMenuId, setOpenDocMenuId] = useState<number | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertiesModalOpen, setPropertiesModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Load documents for this folder - Optimized
  const loadFolderDocuments = async (): Promise<void> => {
    if (loadingDocs) return; // Prevent multiple simultaneous requests

    setLoadingDocs(true);
    try {
      const folderDocs = await realDocumentService.getDocumentsByFolder(folder.folder_id);
      setDocuments(folderDocs);
    } catch (error) {
      console.error('Error loading folder documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Handle expand/collapse toggle
  const handleExpandToggle = (event: React.MouseEvent): void => {
    event.stopPropagation(); // Prevent folder navigation
    if (!isExpanded && documents.length === 0) {
      loadFolderDocuments();
    }
    setIsExpanded(!isExpanded);
  };

  const handleCardClick = (): void => {
    onFolderClick(folder);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation(); // Prevent folder click when clicking menu
    setMenuOpen((prev) => !prev); // toggle menu
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle folder operations
  const handleRename = async (newName: string): Promise<void> => {
    try {
      await folderService.updateFolder(folder.folder_id, {
        folder_name: newName,
      });
      if (onFolderUpdated) {
        onFolderUpdated();
      }
    } catch (error) {
      throw new Error("Failed to rename folder. Please try again.");
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await folderService.deleteFolder(folder.folder_id);
      if (onFolderUpdated) {
        onFolderUpdated();
      }
    } catch (error) {
      throw new Error("Failed to delete folder. Please try again.");
    }
  };

  const handleMenuAction = (action: string): void => {
    setMenuOpen(false);

    switch (action) {
      case 'rename':
        setRenameModalOpen(true);
        break;
      case 'delete':
        setDeleteDialogOpen(true);
        break;
      case 'properties':
        setPropertiesModalOpen(true);
        break;
    }
  };

  const handleDocumentMenuClick = (e: React.MouseEvent, docId: number): void => {
    e.stopPropagation();
    setOpenDocMenuId(openDocMenuId === docId ? null : docId);
  };

  const handleDocumentMenuAction = (action: string, document: Document): void => {
    setOpenDocMenuId(null);

    switch (action) {
      case 'properties':
        console.log('Show properties for document:', document.title);
        // TODO: Open document properties modal
        break;
      case 'edit':
        console.log('Edit document:', document.title);
        // TODO: Open document edit modal
        break;
      case 'delete':
        console.log('Delete document:', document.title);
        // TODO: Open document delete confirmation
        break;
    }
  };

  return (
    <div
      className={`relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group ${
        isExpanded ? 'shadow-md' : ''
      }`}
    >
      {/* Folder Header - Click to navigate */}
      <div 
        className="cursor-pointer"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
              <Folder className="w-6 h-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate" title={folder.folder_name}>
                {folder.folder_name}
              </h3>
              <p className="text-sm text-gray-500 truncate" title={folder.folder_path}>
                {folder.folder_path}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Expand/Collapse Button */}
            {documentCount > 0 && (
              <button
                className="p-1 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleExpandToggle}
                type="button"
                aria-label={isExpanded ? "Collapse documents" : "Show documents"}
                title={isExpanded ? "Hide documents" : "Show documents"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
            )}
            {/* Menu Button */}
            <div className="relative">
              <button
                className="p-1 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleMenuClick}
                type="button"
                aria-label={`More options for ${folder.folder_name}`}
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              {menuOpen && (
                <FolderMenu
                  onRename={() => handleMenuAction('rename')}
                  onDelete={() => handleMenuAction('delete')}
                  onProperties={() => handleMenuAction('properties')}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
        <span>
          {documentCount} document{documentCount !== 1 ? "s" : ""}
        </span>
        <span title={`Last updated: ${folder.updated_at}`}>
          {formatDate(folder.updated_at)}
        </span>
      </div>

      {/* Expandable Documents Section */}
      {isExpanded && (
        <div className="border-t border-gray-100 mt-4 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents in this folder
          </h4>
          
          {loadingDocs ? (
            <div className="flex items-center justify-center py-3">
              <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
              <span className="ml-2 text-xs text-gray-500">Loading...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              No documents found in this folder
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto overflow-x-visible">
              {documents.map((document) => (
                <div
                  key={document.doc_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group/doc relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle document click - could open document or show preview
                    console.log('Document clicked:', document.title);
                  }}
                >
                  <div className="flex-shrink-0">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover/doc:text-blue-600 transition-colors">
                      {document.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded text-xs ${
                        document.status === 'active' ? 'bg-green-100 text-green-700' :
                        document.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        document.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {document.status}
                      </span>
                      <span>{formatDate(document.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                    <div className="relative">
                      <button
                        className="p-1 rounded hover:bg-gray-200"
                        onClick={(e) => handleDocumentMenuClick(e, document.doc_id)}
                        title="More options"
                        type="button"
                      >
                        <MoreVertical className="w-3 h-3 text-gray-500" />
                      </button>
                      {openDocMenuId === document.doc_id && (
                        <DocumentMenu
                          onProperties={() => handleDocumentMenuAction('properties', document)}
                          onEdit={() => handleDocumentMenuAction('edit', document)}
                          onDelete={() => handleDocumentMenuAction('delete', document)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <RenameFolderModal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        onRename={handleRename}
        folder={folder}
      />

      <DeleteFolderDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDelete={handleDelete}
        folder={folder}
      />

      <FolderPropertiesModal
        isOpen={propertiesModalOpen}
        onClose={() => setPropertiesModalOpen(false)}
        folder={folder}
        documentCount={documentCount}
      />
    </div>
  );
};

export default FolderCard;
