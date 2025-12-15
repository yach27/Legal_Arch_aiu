import React from "react";
import { Folder, FolderOpen, Calendar, User, Hash } from "lucide-react";
import { Folder as FolderType } from "../../types/types";

interface FolderPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: FolderType | null;
  documentCount?: number;
}

const FolderPropertiesModal: React.FC<FolderPropertiesModalProps> = ({
  isOpen,
  onClose,
  folder,
  documentCount = 0,
}) => {
  if (!isOpen || !folder) return null;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-white rounded-2xl shadow-lg w-full max-w-4xl mx-4 p-6 max-h-[90vh] overflow-y-auto ml-64"
        onClick={(e) => e.stopPropagation()}
        style={{ marginLeft: '16rem' }}
      >
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Folder className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Folder Properties</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 text-lg">
              
                Basic Information
              </h3>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 space-y-4 hover:from-green-100 hover:to-green-200 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Name</label>
                    <p className="text-base text-gray-900 font-semibold">{folder.folder_name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Folder ID</label>
                    <p className="text-base text-gray-900">#{folder.folder_id}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Path</label>
                  <p className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border break-all">
                    {folder.folder_path}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Type</label>
                  <p className="text-base text-gray-900 capitalize">{folder.folder_type}</p>
                </div>
              </div>
            </div>

            {/* Content Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 text-lg">
                <FolderOpen className="w-5 h-5" />
                Content & Structure
              </h3>
              
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-5 hover:from-green-200 hover:to-green-300 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-700 mb-1">{documentCount}</div>
                    <label className="block text-sm font-medium text-gray-600">Documents</label>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {folder.parent_folder_id ? `#${folder.parent_folder_id}` : "Root"}
                    </div>
                    <label className="block text-sm font-medium text-gray-600">Parent Folder</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Timestamps */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5" />
                Timeline
              </h3>
              
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-5 space-y-4 hover:from-green-200 hover:to-green-300 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]">
                <div className="border-l-4 border-green-500 pl-4">
                  <label className="block text-sm font-medium text-gray-600">Created</label>
                  <p className="text-base text-gray-900 font-medium">{formatDate(folder.created_at)}</p>
                </div>
                
                <div className="border-l-4 border-green-700 pl-4">
                  <label className="block text-sm font-medium text-gray-600">Last Modified</label>
                  <p className="text-base text-gray-900 font-medium">{formatDate(folder.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Creator Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Creator
              </h3>
              
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-5 hover:from-green-200 hover:to-green-300 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]">
                <div className="text-center">
                  {folder.creator ? (
                    <>
                      <div className="text-xl font-bold text-green-700 mb-1">
                        {folder.creator.firstname} {folder.creator.middle_name ? folder.creator.middle_name + ' ' : ''}{folder.creator.lastname}
                      </div>
                      <label className="block text-sm font-medium text-gray-600">
                        {folder.creator.email}
                      </label>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-700 mb-1">#{folder.created_by}</div>
                      <label className="block text-sm font-medium text-gray-600">User ID</label>
                      <label className="block text-xs text-gray-500 mt-1">Creator details not loaded</label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2 text-lg">
                <Hash className="w-5 h-5" />
                Quick Stats
              </h3>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 hover:from-green-100 hover:to-green-200 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02]">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Path Length:</span>
                    <span className="font-medium text-gray-900">{folder.folder_path.length} characters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Depth Level:</span>
                    <span className="font-medium text-gray-900">{folder.folder_path.split('/').length - 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Has Parent:</span>
                    <span className="font-medium text-gray-900">{folder.parent_folder_id ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderPropertiesModal;