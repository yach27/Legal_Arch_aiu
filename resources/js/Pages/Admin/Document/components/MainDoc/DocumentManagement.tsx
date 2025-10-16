// DocumentManagement.tsx - Fixed to use folderService for folders
import React, { useState, useEffect, JSX } from 'react';
import { Plus, FileText, FolderPlus } from 'lucide-react';

// Import components
import SearchBar from '../SearhBar/SearchBar';
import FolderCard from '../Folder/FolderCard';
import DocumentListItem from './DocumentListItem';
import BreadcrumbNav from './BreadcrumbNav';
import AddFolderModal from '../Folder/AddFolderModal';
import FileUploadUI from '../FileUpload/FileUploadUI';
import FilterModal from '../Filter/FilterModal';

// Import services and types - FIXED: Correct paths for Laravel Inertia
import realDocumentService from '../../services/realDocumentService';
import folderService from '../../services/folderService';
import { categoryService } from '../../services/categoryService';
import { Folder, Document, Category, DocumentFilters } from '../../types/types';

type ViewMode = 'folders' | 'documents';

interface DocumentManagementState {
  searchTerm: string;
  currentFolder: Folder | null;
  viewMode: ViewMode;
  folders: Folder[];
  documents: Document[];
  categories: Category[];
  loading: boolean;
  filters: DocumentFilters;
}

const DocumentManagement: React.FC = () => {
  // State management with TypeScript
  const [state, setState] = useState<DocumentManagementState>({
    searchTerm: '',
    currentFolder: null,
    viewMode: 'folders',
    folders: [],
    documents: [],
    categories: [],
    loading: false,
    filters: {}
  });

  const [initialLoading, setInitialLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const handleCreate = async (folderName: string, categoryId: number) => {
    // This callback is called after the modal successfully creates the folder
    // We need to refresh both the folders list and counts
    try {
      console.log('Folder created, refreshing list...');
      await loadFolders(); // Reload folders to show the new one
      await refreshCounts(); // Refresh counts as well
    } catch (error) {
      console.error('Error refreshing folders:', error);
      // Still refresh the page to show the new folder
      window.location.reload();
    }
  };

  // Destructure state for easier access
  const {
    searchTerm,
    currentFolder,
    viewMode,
    folders,
    documents,
    categories,
    loading,
    filters
  } = state;

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Check for folder query parameter and navigate to that folder
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const folderId = urlParams.get('folder');

    if (folderId && folders.length > 0) {
      const targetFolder = folders.find(f => f.folder_id === parseInt(folderId));
      if (targetFolder) {
        handleFolderClick(targetFolder);
      }
    }
  }, [folders]);

  // Load data when search term or filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setState(prev => ({ ...prev, loading: true }));
      if (viewMode === 'folders') {
        loadFolders();
      } else if (searchTerm || Object.keys(filters).length > 0) {
        // Only use useEffect for search/filter, handleFolderClick handles initial load
        loadDocuments();
      }
    }, 200); // Debounce for search/filters

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  // Data loading functions - Optimized
  const loadInitialData = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      // Load categories from database
      const categoriesData = await loadCategories();
      setState(prev => ({ ...prev, categories: categoriesData, loading: false }));

      // Load folders in background without blocking UI
      loadFolders();
    } catch (error) {
      console.error('Error loading initial data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // Load categories from API
  const loadCategories = async (): Promise<Category[]> => {
    try {
      const categories = await realDocumentService.getCategories();
      return categories;
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to mock data if API fails
      return categoryService.getAllCategories();
    }
  };

  // Upload Handlers
  const handleUploadSuccess = async (file: File): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder_id', currentFolder?.folder_id?.toString() || '');
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

      const response = await fetch('/admin/documents', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': window.document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });

      const result = await response.json();

      if (result.success) {
        setIsUploadModalOpen(false);
        await loadDocuments();
        console.log('Document uploaded successfully:', result.document);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      handleUploadError(error as Error);
    }
  };

  const handleUploadError = (error: Error): void => {
    console.error('Upload failed:', error);
    alert('Upload failed: ' + error.message);
  };

  // Load folders - Optimized for speed
  const loadFolders = async (): Promise<void> => {
    try {
      let foldersData: Folder[];

      if (searchTerm) {
        foldersData = await folderService.searchFolders(searchTerm);
      } else if (currentFolder) {
        foldersData = await folderService.getFoldersByParent(currentFolder.folder_id);
      } else {
        foldersData = await folderService.getFoldersByParent(null);
      }

      // Sort and display folders immediately
      foldersData = folderService.sortFolders(foldersData, 'updated_at', 'desc');
      setState(prev => ({ ...prev, folders: foldersData, loading: false }));
      setInitialLoading(false);

      // Load document counts in background
      if (foldersData.length > 0) {
        loadFolderDocumentCounts(foldersData);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      setState(prev => ({ ...prev, loading: false }));
      setInitialLoading(false);
    }
  };

  const loadDocuments = async (): Promise<void> => {
    try {
      // Don't set loading here - it's already set by handleFolderClick or useEffect
      let documentsData: Document[];

      if (searchTerm || Object.keys(filters).length > 0) {
        documentsData = await realDocumentService.getFilteredDocuments(filters, searchTerm);
      } else {
        documentsData = await realDocumentService.getAllDocuments(currentFolder?.folder_id);
      }

      setState(prev => ({ ...prev, documents: documentsData, loading: false }));
    } catch (error) {
      console.error('Error loading documents:', error);
      setState(prev => ({ ...prev, documents: [], loading: false }));
    }
  };

  // Event handlers
  const handleSearchChange = (term: string): void => {
    setState(prev => ({ ...prev, searchTerm: term }));
  };

  const handleFolderClick = async (folder: Folder): Promise<void> => {
    setState(prev => ({
      ...prev,
      currentFolder: folder,
      viewMode: 'documents',
      searchTerm: '',
      loading: true,
      documents: [] // Clear documents to prevent showing old data
    }));

    // Load documents immediately, don't wait for useEffect
    try {
      const documentsData = await realDocumentService.getAllDocuments(folder.folder_id);
      setState(prev => ({ ...prev, documents: documentsData, loading: false }));
    } catch (error) {
      console.error('Error loading documents:', error);
      setState(prev => ({ ...prev, documents: [], loading: false }));
    }
  };

  const handleBackToFolders = (): void => {
    setState(prev => ({
      ...prev,
      currentFolder: null,
      viewMode: 'folders',
      searchTerm: ''
    }));
  };

  const handleFilterClick = (): void => {
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = (newFilters: DocumentFilters): void => {
    setState(prev => ({ ...prev, filters: newFilters }));
    setIsFilterModalOpen(false);
  };

  const handleAddFolder = (): void => {
    setIsModalOpen(true);
    console.log('Add folder clicked');
  };

  const handleAddDocument = (): void => {
    setIsUploadModalOpen(true);
  };

  // Helper functions - FIXED: Use real document service for folder operations
  const [folderDocumentCounts, setFolderDocumentCounts] = useState<Record<number, number>>({});

  const getFolderDocumentCount = (folderId: number): number => {
    return folderDocumentCounts[folderId] || 0;
  };

  // Load document counts for all folders (optimized)
  const loadFolderDocumentCounts = async (foldersList: Folder[]): Promise<void> => {
    if (foldersList.length === 0) return;

    try {
      const folderIds = foldersList.map(f => f.folder_id);

      // Try bulk loading first (if backend supports it)
      try {
        const bulkCounts = await realDocumentService.getBulkFolderCounts?.(folderIds);
        if (bulkCounts) {
          setFolderDocumentCounts(bulkCounts);
          return;
        }
      } catch (error) {
        console.log('Bulk loading not available, using individual calls');
      }

      // Fallback to parallel individual calls
      const counts: Record<number, number> = {};
      const countPromises = folderIds.map(async (folderId) => {
        try {
          const count = await realDocumentService.getFolderDocumentCount(folderId);
          counts[folderId] = count;
        } catch (error) {
          counts[folderId] = 0;
        }
      });

      await Promise.all(countPromises);
      setFolderDocumentCounts(counts);
    } catch (error) {
      console.error('Error loading folder document counts:', error);
    }
  };

  const getCategoryById = (categoryId: number): Category | undefined => {
    return categoryService.getCategoryById(categoryId);
  };

  // FIXED: Make this async since folderService methods are now async
  const buildBreadcrumbPath = async (): Promise<Folder[]> => {
    if (!currentFolder) return [];
    return await folderService.buildBreadcrumbPath(currentFolder.folder_id);
  };

  // FIXED: Make this async to handle folderService async methods
  const getTotalFoldersCount = async (): Promise<number> => {
    try {
      return await folderService.getTotalFoldersCount();
    } catch (error) {
      console.error('Error getting folder count:', error);
      return 0;
    }
  };

  const renderEmptyFolderState = (): JSX.Element => (
    <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
      <div className="text-6xl mb-4">📁</div>
      <h3 className="text-lg font-medium mb-2">No folders found</h3>
      <p className="text-sm text-center max-w-md">
        {searchTerm
          ? `No folders match "${searchTerm}". Try adjusting your search terms.`
          : 'Create your first folder to get started organizing your documents.'}
      </p>
      {!searchTerm && (
        <button
          onClick={handleAddFolder}
          className="mt-4 flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900 transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Create First Folder</span>
        </button>
      )}
    </div>
  );

  const renderEmptyDocumentState = (): JSX.Element => (
    <div className="p-8 text-center text-gray-500">
      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium mb-2">No documents found</h3>
      <p className="text-sm max-w-md mx-auto">
        {searchTerm
          ? `No documents match "${searchTerm}" in this folder. Try adjusting your search terms.`
          : currentFolder
          ? 'This folder is empty. Upload your first document to get started.'
          : 'No documents available'}
      </p>
      {currentFolder && !searchTerm && (
        <button
          onClick={handleAddDocument}
          className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      )}
    </div>
  );

  const getDocumentCountText = (): string => {
    const count = documents.length;
    const documentText = count !== 1 ? 'documents' : 'document';
    const searchText = searchTerm ? ` matching "${searchTerm}"` : '';
    return `${count} ${documentText}${searchText}`;
  };

  // FIXED: Create states for real counts display
  const [folderCount, setFolderCount] = useState<number>(0);
  const [documentCount, setDocumentCount] = useState<number>(0);
  
  // Helper function to refresh counts
  const refreshCounts = async () => {
    try {
      const [folderTotal, documentTotal] = await Promise.all([
        getTotalFoldersCount(),
        realDocumentService.getTotalDocumentsCount()
      ]);
      setFolderCount(folderTotal);
      setDocumentCount(documentTotal);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, [folders]); // Update when folders change

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">DOCUMENTS</h1>
            <p className="text-gray-600 mt-1">
             Hi
            </p>
            {/* Statistics - FIXED: Use real database counts */}
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
              <span>{folderCount} folders</span>
              <span>{documentCount} documents</span>
              {currentFolder && (
                <span>
                  {getFolderDocumentCount(currentFolder.folder_id)} documents in current folder
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddFolder}
              className="flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
              type="button"
            >
              <FolderPlus className="w-5 h-5" />
              <span>Add Folder</span>
            </button>

            <button
              onClick={handleAddDocument}
              className="flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors"
              type="button"
            >
              <Plus className="w-5 h-5" />
              <span>Add Document</span>
            </button>
          </div>

          <AddFolderModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onCreate={handleCreate}
          />
        </div>

        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onFilterClick={handleFilterClick}
        />

        {/* Navigation */}
        {viewMode === 'documents' && (
          <BreadcrumbNav
            currentFolder={currentFolder}
            onNavigate={handleBackToFolders}
            breadcrumbPath={[]} // We'll fix this separately since it needs to be async
          />
        )}

        {/* Loading State - Skeleton */}
        {initialLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-gray-100 rounded w-20"></div>
                  <div className="h-3 bg-gray-100 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Loading Indicator for Updates */}
        {loading && !initialLoading && (
          <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2 border z-50">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border border-blue-600 border-t-transparent"></div>
              <span className="text-sm text-gray-600">Updating...</span>
            </div>
          </div>
        )}

        {/* Content Area */}
        {!initialLoading && (
          <>
            {viewMode === 'folders' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {folders.length > 0 ? (
                  folders.map((folder) => (
                    <FolderCard
                      key={folder.folder_id}
                      folder={folder}
                      onFolderClick={handleFolderClick}
                      documentCount={getFolderDocumentCount(folder.folder_id)}
                      onFolderUpdated={async () => {
                        await loadFolders();
                        await refreshCounts();
                      }}
                    />
                  ))
                ) : (
                  renderEmptyFolderState()
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Documents in {currentFolder?.folder_name || 'All Documents'}
                      </h2>
                      <p className="text-sm text-gray-500">{getDocumentCountText()}</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
                      <p className="text-sm">Loading documents...</p>
                    </div>
                  ) : documents.length > 0 ? (
                    documents.map((document) => (
                      <DocumentListItem
                        key={document.doc_id}
                        document={document}
                        category={getCategoryById(document.category_id)}
                      />
                    ))
                  ) : (
                    renderEmptyDocumentState()
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl mx-4 ml-64" style={{ marginLeft: '16rem' }}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Upload Document</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <FileUploadUI
                maxFileSize={10 * 1024 * 1024} // 10MB limit
                acceptedFileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onUploadSuccess={async (file) => {
                  // Navigate to AI processing page for metadata entry
                  setIsUploadModalOpen(false);
                  // Pass uploaded file info and document ID to AI processing page
                  window.location.href = `/ai-processing?fileName=${encodeURIComponent(file.name)}&title=${encodeURIComponent(file.name)}`;
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                  // Keep modal open to show error and allow retry
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        categories={categories}
      />
    </div>
  );
};
export default DocumentManagement;