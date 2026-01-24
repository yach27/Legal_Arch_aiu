import React, { useState, useEffect, JSX } from 'react';
import { flushSync } from 'react-dom';
import { createPortal } from 'react-dom';
import { Plus, FileText, FolderPlus, Folder as FolderIcon, Archive, ScanLine, Lock, ArrowUpDown } from 'lucide-react';


import SearchBar from '../SearhBar/SearchBar';
import FolderCard from '../Folder/FolderCard';
import DocumentListItem from './DocumentListItem';
import BreadcrumbNav from './BreadcrumbNav';
import AddFolderModal from '../Folder/AddFolderModal';
import MultiFileUploadUI from '../FileUpload/MultiFileUploadUI';
import FilterModal from '../Filter/FilterModal';
import ScanDocumentModal from '../ScanDocument/ScanDocumentModal';
import DocumentSidebar from '../DocumentSidebar/DocumentSidebar';

import realDocumentService from '../../services/realDocumentService';
import folderService from '../../services/folderService';
import { Folder, Document, DocumentFilters } from '../../types/types';

interface UserPermissions {
  can_view: boolean;
  can_upload: boolean;
  can_delete: boolean;
  can_edit: boolean;
  can_archive: boolean;
}

type ViewMode = 'folders' | 'documents';

interface DocumentManagementState {
  searchTerm: string;
  currentFolder: Folder | null;
  viewMode: ViewMode;
  folders: Folder[]; // Root folders for grid view
  subfolders: Folder[]; // Subfolders for document view
  documents: Document[];
  loading: boolean;
  filters: DocumentFilters;
  sortField: 'name' | 'date';
  sortOrder: 'asc' | 'desc';
}


const DocumentManagement: React.FC = () => {
  // State management with TypeScript
  const [state, setState] = useState<DocumentManagementState>({
    searchTerm: '',
    currentFolder: null,
    viewMode: 'folders',
    folders: [],
    subfolders: [],
    documents: [],
    loading: false,
    filters: {},
    sortField: 'date',
    sortOrder: 'desc'
  });


  const [initialLoading, setInitialLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // User permissions state
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    can_view: false,
    can_upload: false,
    can_delete: false,
    can_edit: false,
    can_archive: false,
  });

  // Fetch user permissions on mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const user = await response.json();
          setUserPermissions({
            can_view: user.can_view ?? false,
            can_upload: user.can_upload ?? false,
            can_delete: user.can_delete ?? false,
            can_edit: user.can_edit ?? false,
            can_archive: user.can_archive ?? false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch user permissions:', error);
      }
    };
    fetchPermissions();
  }, []);

  const handleCreate = async () => {
    try {
      await loadFolders(currentFolder?.folder_id ?? null);
      await refreshCounts();
    } catch (error) {
      console.error('Error refreshing folders:', error);
      window.location.reload();
    }
  };

  // Destructure state for easier access
  const {
    searchTerm,
    currentFolder,
    viewMode,
    folders,
    subfolders,
    documents,
    loading,
    filters,
    sortField,
    sortOrder
  } = state;


  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Check for folder query parameter and navigate to that folder (only once on initial load)
  const hasNavigatedFromUrl = React.useRef(false);
  useEffect(() => {
    if (hasNavigatedFromUrl.current || folders.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const folderId = urlParams.get('folder');

    if (folderId) {
      const targetFolder = folders.find(f => f.folder_id === parseInt(folderId));
      if (targetFolder) {
        hasNavigatedFromUrl.current = true;
        handleFolderClick(targetFolder);
      }
    }
  }, [folders]);

  // Track if we just opened a folder to prevent double loading
  const justOpenedFolder = React.useRef(false);

  // Check if any document-level filters are active (year, status)
  const hasDocumentFilters = filters.status === 'archived' || filters.year !== undefined;

  // Load data when search term or filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (viewMode === 'folders') {
        setState(prev => ({ ...prev, loading: true }));
        // Show documents when document-level filters are active (archived, year)
        if (hasDocumentFilters) {
          loadDocuments(); // Load documents when year or archived filter is active
        } else {
          loadFolders(); // Load folders by default
        }
      } else if (currentFolder && !justOpenedFolder.current) {
        // Reload documents when search/filters change
        setState(prev => ({ ...prev, loading: true }));
        loadDocuments();
      }
      // Reset the flag after the effect runs
      justOpenedFolder.current = false;
    }, 200); // Debounce for search/filters

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  const loadInitialData = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await loadFolders(); // Load folders by default on initial load
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Error loading initial data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadFolders = async (parentId: number | null = null): Promise<void> => {
    try {
      let foldersData: Folder[];

      if (searchTerm) {
        foldersData = await folderService.searchFolders(searchTerm);
      } else {
        foldersData = await folderService.getFoldersByParent(parentId);
      }

      foldersData = folderService.sortFolders(foldersData, 'updated_at', 'desc');
      setState(prev => ({ ...prev, folders: foldersData, loading: false }));
      setInitialLoading(false);

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
      let documentsData: Document[];

      // Handle status filter
      if (filters.status === 'archived') {
        documentsData = await realDocumentService.getArchivedDocuments(currentFolder?.folder_id);
      } else if (searchTerm || Object.keys(filters).length > 0) {
        const mergedFilters = {
          ...filters,
          ...(currentFolder && { folder_id: currentFolder.folder_id })
        };
        documentsData = await realDocumentService.getFilteredDocuments(mergedFilters, searchTerm);
      } else {
        documentsData = await realDocumentService.getAllDocuments(currentFolder?.folder_id);
      }

      setState(prev => ({ ...prev, documents: documentsData, loading: false }));
    } catch (error) {
      console.error('Error loading documents:', error);
      setState(prev => ({ ...prev, documents: [], loading: false }));
    }
  };

  const handleSearchChange = (term: string): void => {
    setState(prev => ({ ...prev, searchTerm: term }));
  };

  const handleFolderClick = async (folder: Folder): Promise<void> => {
    justOpenedFolder.current = true;

    // Update state synchronously - React 18 batches automatically
    setIsTransitioning(true);
    setState(prev => ({
      ...prev,
      currentFolder: folder,
      viewMode: 'documents',
      searchTerm: '',
      filters: {},
      loading: true,
      documents: [],
      subfolders: []
    }));

    try {
      // Start both requests in parallel but don't wait for both
      const documentsPromise = realDocumentService.getAllDocuments(folder.folder_id);
      const subfoldersPromise = folderService.getFoldersByParent(folder.folder_id);

      // Wait for subfolders first (usually faster) and show them immediately
      const subfoldersData = await subfoldersPromise;

      // CRITICAL: Filter subfolders - exclude parent and grandparent
      const filteredSubfolders = subfoldersData.filter(f =>
        f.folder_id !== folder.folder_id &&
        f.folder_id !== folder.parent_folder_id
      );

      // Show subfolders ASAP while documents are still loading
      flushSync(() => {
        setState(prev => {
          if (prev.currentFolder?.folder_id === folder.folder_id) {
            return {
              ...prev,
              subfolders: filteredSubfolders,
              loading: true // Keep loading true for documents
            };
          }
          return prev;
        });
        setIsTransitioning(false); // Allow render of subfolders
      });

      // Now wait for documents
      const documentsData = await documentsPromise;

      // Update with documents
      flushSync(() => {
        setState(prev => {
          if (prev.currentFolder?.folder_id === folder.folder_id) {
            return {
              ...prev,
              documents: documentsData,
              loading: false
            };
          }
          return prev;
        });
      });

      // Load counts in background without blocking
      if (filteredSubfolders.length > 0) {
        loadFolderDocumentCounts(filteredSubfolders);
      }
    } catch (error) {
      console.error('Error loading folder contents:', error);
      flushSync(() => {
        setState(prev => ({ ...prev, documents: [], subfolders: [], loading: false }));
        setIsTransitioning(false);
      });
    }
  };

  const handleBackToFolders = async (): Promise<void> => {
    justOpenedFolder.current = false;

    if (currentFolder?.parent_folder_id) {
      const parentFolder = await folderService.getFolderById(currentFolder.parent_folder_id);
      handleFolderClick(parentFolder);
    } else {
      setState({
        searchTerm: '',
        currentFolder: null,
        viewMode: 'folders',
        folders: [],
        subfolders: [],
        documents: [],
        loading: true,
        filters: {},
        sortField: 'date',
        sortOrder: 'desc'
      });


      await loadFolders(null);
    }
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
  };

  const handleAddDocument = (): void => {
    setIsUploadModalOpen(true);
  };

  const handleScanDocument = (): void => {
    setIsScanModalOpen(true);
  };

  const [folderDocumentCounts, setFolderDocumentCounts] = useState<Record<number, number>>({});

  const getFolderDocumentCount = (folderId: number): number => {
    return folderDocumentCounts[folderId] || 0;
  };

  const loadFolderDocumentCounts = async (foldersList: Folder[]): Promise<void> => {
    if (foldersList.length === 0) return;

    try {
      const folderIds = foldersList.map(f => f.folder_id);

      try {
        const bulkCounts = await realDocumentService.getBulkFolderCounts?.(folderIds);
        if (bulkCounts) {
          setFolderDocumentCounts(bulkCounts);
          return;
        }
      } catch (error) {
        console.log('Bulk loading not available, using individual calls');
      }

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
      <h3 className="text-lg font-semibold mb-2 text-gray-700">No folders found</h3>
      <p className="text-sm text-center max-w-md font-normal text-gray-600">
        {searchTerm
          ? `No folders match "${searchTerm}". Try adjusting your search terms.`
          : 'Create your first folder to get started organizing your documents.'}
      </p>
      {!searchTerm && (
        <button
          onClick={handleAddFolder}
          className="mt-4 flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Create First Folder</span>
        </button>
      )}
    </div>
  );

  const renderEmptyDocumentState = (): JSX.Element => (
    <div className="p-8 text-center text-gray-500">
      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-semibold mb-2 text-gray-700">No documents found</h3>
      <p className="text-sm max-w-md mx-auto font-normal text-gray-600">
        {searchTerm
          ? `No documents match "${searchTerm}" in this folder. Try adjusting your search terms.`
          : currentFolder
            ? userPermissions.can_upload
              ? 'This folder is empty. Upload your first document to get started.'
              : 'This folder is empty.'
            : 'No documents available'}
      </p>
      {currentFolder && !searchTerm && userPermissions.can_upload && (
        <button
          onClick={handleAddDocument}
          className="mt-4 flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md mx-auto font-medium"
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

  const [folderCount, setFolderCount] = useState<number>(0);
  const [documentCount, setDocumentCount] = useState<number>(0);

  const handleSortSelection = (field: 'name' | 'date', order: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortField: field, sortOrder: order }));
    setIsSortMenuOpen(false);
  };

  const getSortedItems = (items: any[]): any[] => {
    return [...items].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'name') {
        aValue = a.folder_name || a.title || '';
        bValue = b.folder_name || b.title || '';
      } else {
        aValue = new Date(a.updated_at).getTime();
        bValue = new Date(b.updated_at).getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const sortedSubfolders = getSortedItems(subfolders) as Folder[];
  const sortedDocuments = getSortedItems(documents) as Document[];
  const sortedFolders = getSortedItems(folders) as Folder[];


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
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <DocumentSidebar
        currentFolder={state.currentFolder}
        onFolderSelect={(folder) => {
          if (folder) {
            handleFolderClick(folder);
          } else {
            setState(prev => ({
              ...prev,
              currentFolder: null,
              viewMode: 'folders',
              searchTerm: '',
              filters: {},
              documents: [],
              subfolders: []
            }));
            loadFolders(null);
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-72'}`}>
        <div className="flex-1 overflow-y-auto p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="max-w-7xl mx-auto">
            {/* Header - Forest Green Design */}
            <div className="rounded-xl shadow-sm border border-green-100/50 p-6 mb-6" style={{ backgroundColor: '#1b5e20' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">DOCUMENTS</h1>
                  <p className="text-gray-200 mt-1 font-normal">
                    Manage your legal documents and folders
                  </p>
                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-300 font-normal">
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
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                    type="button"
                  >
                    <FolderPlus className="w-5 h-5" />
                    <span>Add Folder</span>
                  </button>

                  {userPermissions.can_upload ? (
                    <button
                      onClick={handleAddDocument}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                      type="button"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add Document</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 bg-gray-300 text-gray-500 px-5 py-2.5 rounded-lg font-semibold cursor-not-allowed"
                      type="button"
                      title="You don't have permission to upload documents"
                    >
                      <Lock className="w-5 h-5" />
                      <span>Add Document</span>
                    </button>
                  )}

                  {userPermissions.can_upload ? (
                    <button
                      onClick={handleScanDocument}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                      type="button"
                    >
                      <ScanLine className="w-5 h-5" />
                      <span>Scan Document</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 bg-gray-300 text-gray-500 px-5 py-2.5 rounded-lg font-semibold cursor-not-allowed"
                      type="button"
                      title="You don't have permission to upload documents"
                    >
                      <Lock className="w-5 h-5" />
                      <span>Scan Document</span>
                    </button>
                  )}
                  <div className="relative" ref={sortMenuRef}>
                    <button
                      onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm backdrop-blur-sm"
                      type="button"
                    >
                      <ArrowUpDown className="w-5 h-5" />
                      <span>{sortField === 'name' ? 'Name' : 'Date'}</span>
                    </button>

                    {isSortMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-4 py-2 border-b border-gray-50 mb-1">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort By</span>
                        </div>

                        <button
                          onClick={() => handleSortSelection('name', 'asc')}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-green-50 hover:text-green-700 transition-colors ${sortField === 'name' && sortOrder === 'asc' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}
                        >
                          <span>Name (A-Z)</span>
                          {sortField === 'name' && sortOrder === 'asc' && <span className="text-green-600">✓</span>}
                        </button>

                        <button
                          onClick={() => handleSortSelection('name', 'desc')}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-green-50 hover:text-green-700 transition-colors ${sortField === 'name' && sortOrder === 'desc' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}
                        >
                          <span>Name (Z-A)</span>
                          {sortField === 'name' && sortOrder === 'desc' && <span className="text-green-600">✓</span>}
                        </button>

                        <div className="my-1 border-t border-gray-50"></div>

                        <button
                          onClick={() => handleSortSelection('date', 'desc')}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-green-50 hover:text-green-700 transition-colors ${sortField === 'date' && sortOrder === 'desc' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}
                        >
                          <span>Date (Newest First)</span>
                          {sortField === 'date' && sortOrder === 'desc' && <span className="text-green-600">✓</span>}
                        </button>

                        <button
                          onClick={() => handleSortSelection('date', 'asc')}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-green-50 hover:text-green-700 transition-colors ${sortField === 'date' && sortOrder === 'asc' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}
                        >
                          <span>Date (Oldest First)</span>
                          {sortField === 'date' && sortOrder === 'asc' && <span className="text-green-600">✓</span>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <AddFolderModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onCreate={handleCreate}
                  parentFolderId={viewMode === 'documents' ? currentFolder?.folder_id : null}
                />
              </div>
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
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
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
              <div className="fixed top-4 right-4 bg-white rounded-lg px-4 py-2 z-50 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                  <span className="text-sm text-gray-700 font-medium">Updating...</span>
                </div>
              </div>
            )}

            {/* Content Area */}
            {!initialLoading && (
              <>
                {viewMode === 'folders' && !currentFolder ? (
                  <>
                    {/* Show folders grid when no document-level filters are active */}
                    {!hasDocumentFilters ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" style={{ willChange: 'transform' }}>
                        {loading ? (
                          // Show loading skeleton when loading folders
                          [...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
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
                          ))
                        ) : sortedFolders.length > 0 ? (
                          sortedFolders.map((folder) => (

                            <FolderCard
                              key={folder.folder_id}
                              folder={folder}
                              onFolderClick={handleFolderClick}
                              documentCount={getFolderDocumentCount(folder.folder_id)}
                              onFolderUpdated={async () => {
                                await loadFolders(null);
                                await refreshCounts();
                              }}
                            />
                          ))
                        ) : (
                          renderEmptyFolderState()
                        )}
                      </div>
                    ) : (
                      // Show filtered documents list when document-level filters are active
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">
                                {filters.status === 'archived' ? 'Archived Documents' :
                                  filters.year ? `Documents from ${filters.year}` : 'Filtered Documents'}
                              </h2>
                              <p className="text-sm text-gray-600 font-normal mt-1">
                                {loading ? 'Loading...' : `${documents.length} document${documents.length !== 1 ? 's' : ''}`}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                          {loading ? (
                            <div className="p-8 text-center text-gray-500">
                              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto mb-4"></div>
                              <p className="text-sm font-normal text-gray-600">Loading archived documents...</p>
                            </div>
                          ) : sortedDocuments.length > 0 ? (
                            sortedDocuments.map((document) => (

                              <DocumentListItem
                                key={document.doc_id}
                                document={document}
                                onDocumentUpdated={async () => {
                                  await loadDocuments();
                                }}
                              />
                            ))
                          ) : (
                            <div className="p-12 text-center">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                {filters.status === 'archived' ? (
                                  <Archive className="w-8 h-8 text-gray-400" />
                                ) : (
                                  <FileText className="w-8 h-8 text-gray-400" />
                                )}
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {filters.status === 'archived' ? 'No Archived Documents' :
                                  filters.year ? `No Documents from ${filters.year}` : 'No Documents Found'}
                              </h3>
                              <p className="text-gray-600 font-normal">
                                {filters.status === 'archived' ? 'There are no archived documents at this time.' :
                                  filters.year ? `There are no documents created in ${filters.year}.` : 'No documents match your filter criteria.'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Unified File Manager View - Folders and Documents - Clean White */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">
                              {currentFolder?.folder_name || 'All Documents'}
                            </h2>
                            <p className="text-sm text-gray-600 font-normal mt-1">
                              {loading ? 'Loading...' : `${subfolders.length} folder${subfolders.length !== 1 ? 's' : ''}, ${getDocumentCountText()}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {isTransitioning ? (
                          <div className="p-8 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-sm font-normal text-gray-600">Loading...</p>
                          </div>
                        ) : (
                          <>
                            {/* Subfolders */}
                            {sortedSubfolders.map((folder) => (

                              <div
                                key={`folder-${folder.folder_id}`}
                                className="p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer flex items-center gap-4 group"
                                onClick={() => handleFolderClick(folder)}
                              >
                                <div className="flex-shrink-0">
                                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-all">
                                    <FolderIcon className="w-6 h-6 text-blue-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-green-600 transition-colors">
                                    {folder.folder_name}
                                  </h3>
                                  <p className="text-sm text-gray-600 truncate font-normal">
                                    {folder.folder_path}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 text-sm text-gray-500 font-normal">
                                  {getFolderDocumentCount(folder.folder_id)} items
                                </div>
                              </div>
                            ))}

                            {/* Documents */}
                            {loading && documents.length === 0 ? (
                              <div className="p-4 text-center text-gray-500 text-sm font-normal">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                                <span className="text-gray-600">Loading documents...</span>
                              </div>
                            ) : (
                              sortedDocuments.map((document) => (

                                <DocumentListItem
                                  key={`doc-${document.doc_id}`}
                                  document={document}
                                  folders={folders.map(f => ({ folder_id: f.folder_id, folder_name: f.folder_name }))}
                                  onDocumentUpdated={async () => {
                                    await loadDocuments();
                                    await refreshCounts();
                                  }}
                                />
                              ))
                            )}

                            {/* Empty State - Only show when truly empty */}
                            {!loading && subfolders.length === 0 && documents.length === 0 && (
                              renderEmptyDocumentState()
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 backdrop-blur-sm"
          style={{ margin: 0, padding: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-2xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
                <p className="text-sm text-gray-500 mt-1">You can upload up to 5 documents at a time</p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-lg transition-all text-xl"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <MultiFileUploadUI
                maxFileSize={50 * 1024 * 1024}
                acceptedFileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                minFiles={1}
                maxFiles={5}
                onUploadSuccess={() => {
                  setIsUploadModalOpen(false);
                  loadDocuments();
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        folders={folders}
      />

      {/* Scan Document Modal */}
      <ScanDocumentModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />
    </div>
  );
};
export default DocumentManagement;