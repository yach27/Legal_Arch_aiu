// BreadcrumbNav.tsx - Navigation breadcrumb component with TypeScript
import React from 'react';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { BreadcrumbNavProps, Folder } from '../../types/types';

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ 
  currentFolder, 
  onNavigate, 
  breadcrumbPath = [] 
}) => {
  const handleBackClick = (): void => {
    onNavigate(null);
  };

  const handleBreadcrumbClick = (folder: Folder): void => {
    onNavigate(folder);
  };

  const handleHomeClick = (): void => {
    onNavigate(null);
  };

  return (
    <div className="flex items-center gap-2 mb-4 p-4 bg-white rounded-lg border border-gray-200">
      {/* Back Button */}
      <button 
        onClick={handleBackClick}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50"
        type="button"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to folders</span>
        <span className="sm:hidden">Back</span>
      </button>
      
      {/* Separator */}
      <div className="w-px h-6 bg-gray-300 mx-2" />
      
      {/* Breadcrumb Trail */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Home/Root */}
        <button
          onClick={handleHomeClick}
          className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
          type="button"
          title="Go to root directory"
        >
          <Home className="w-4 h-4" />
          <span className="hidden md:inline text-sm">Root</span>
        </button>
        
        {/* Breadcrumb Path */}
        {breadcrumbPath.length > 0 && (
          <>
            {breadcrumbPath.map((folder, index) => (
              <React.Fragment key={folder.folder_id}>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button
                  onClick={() => handleBreadcrumbClick(folder)}
                  className="text-gray-600 hover:text-blue-600 transition-colors text-sm px-2 py-1 rounded-lg hover:bg-gray-50 truncate max-w-32"
                  type="button"
                  title={folder.folder_path}
                >
                  {folder.folder_name}
                </button>
              </React.Fragment>
            ))}
          </>
        )}
        
        {/* Current Folder */}
        {currentFolder && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span 
              className="font-medium text-gray-900 text-sm truncate max-w-40"
              title={currentFolder.folder_path}
            >
              {currentFolder.folder_name}
            </span>
          </>
        )}
      </div>

      {/* Folder Info */}
      {currentFolder && (
        <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
          <span>Type: {currentFolder.category?.category_name || 'Uncategorized'}</span>
          <span>•</span>
          <span title={currentFolder.updated_at}>
            Updated {new Date(currentFolder.updated_at).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default BreadcrumbNav;