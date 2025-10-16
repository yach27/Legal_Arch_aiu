import React, { useState, useEffect } from 'react';
import { FileText, Folder, Tag, Save, X, ChevronDown, Calendar, User } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface Category {
  category_id: number;
  category_name: string;
}

interface Folder {
  folder_id: number;
  folder_name: string;
  folder_path: string;
}

interface FormData {
  title: string;
  selectedCategoryId: number | null;
  selectedFolderId: number | null;
  remarks: string;
}

const ManualProcessing = ({ 
  documentData = null, 
  uploadedFile = null,
  onSave = (formData: FormData) => {}, 
  onCancel = () => {} 
}) => {
  // State for real database data
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableFolders, setAvailableFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: documentData?.title || '',
    selectedCategoryId: documentData?.category_id || null,
    selectedFolderId: documentData?.folder_id || null,
    remarks: documentData?.remarks || ''
  });

  const [dropdownStates, setDropdownStates] = useState({
    category: false,
    location: false
  });

  // Fetch categories and folders from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesResponse = await axios.get('/api/manual-process/categories', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });
        
        // Fetch folders
        const foldersResponse = await axios.get('/api/manual-process/folders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });
        
        setAvailableCategories(categoriesResponse.data);
        setAvailableFolders(foldersResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load categories and folders');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    router.visit("/ai-processing"); // ⬅️ navigate back
  };

  const toggleDropdown = (dropdown) => {
    setDropdownStates(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const selectCategory = (category: Category) => {
    handleInputChange('selectedCategoryId', category.category_id);
    setDropdownStates(prev => ({
      ...prev,
      category: false
    }));
  };
  
  const selectFolder = (folder: Folder) => {
    handleInputChange('selectedFolderId', folder.folder_id);
    setDropdownStates(prev => ({
      ...prev,
      location: false
    }));
  };
  
  // Helper function to get selected category name
  const getSelectedCategoryName = () => {
    const selectedCategory = availableCategories.find(cat => cat.category_id === formData.selectedCategoryId);
    return selectedCategory ? selectedCategory.category_name : '';
  };
  
  // Helper function to get selected folder name with path
  const getSelectedFolderName = () => {
    const selectedFolder = availableFolders.find(folder => folder.folder_id === formData.selectedFolderId);
    return selectedFolder ? selectedFolder.folder_name : '';
  };

  // Handle form validation
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      alert('Please enter a document title');
      return false;
    }
    
    if (!formData.selectedCategoryId) {
      alert('Please select a category');
      return false;
    }
    
    return true;
  };

  // Handle save document - Edit existing uploaded document metadata
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      if (!documentData?.doc_id) {
        alert('Error: No document found. Please upload a file first, then navigate from the AI processing page.');
        setSaving(false);
        return;
      }

      // Update existing uploaded document metadata
      const dataToSend = {
        doc_id: documentData.doc_id,
        title: formData.title,
        category_id: formData.selectedCategoryId,
        folder_id: formData.selectedFolderId,
        remarks: formData.remarks
      };

      console.log('Updating document metadata:', dataToSend);

      const response = await axios.post('/api/manual-process/update', dataToSend, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Document updated successfully!');
        onSave(formData);
        router.visit('/admin/documents');
      } else {
        alert('Failed to update document: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert('Error saving document: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {documentData?.doc_id ? 'EDIT DOCUMENT' : 'MANUAL DOCUMENT PROCESSING'}
          </h1>
          <p className="text-gray-600 mb-4">
            {documentData?.doc_id 
              ? 'Edit the metadata for your uploaded document'
              : 'Create a document entry with metadata only (no file upload)'
            }
          </p>
          <div className="h-1 w-40 bg-orange-500 rounded-full"></div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Document Info Section */}
          <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {documentData?.doc_id ? 'RECENTLY ADDED:' : 'MANUAL DOCUMENT ENTRY:'}
            </h2>
            
            {/* Document Information */}
            <div className="flex items-start space-x-3 mb-4">
              <FileText className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                {!documentData?.doc_id ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm font-medium mb-2">
                      ⚠️ No document found
                    </p>
                    <p className="text-yellow-700 text-sm">
                      Please upload a file first, then navigate from the AI processing page to edit document metadata.
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-700 text-base leading-relaxed">
                    "{documentData.fileName}"
                  </p>
                )}
                {formData.selectedFolderId && getSelectedFolderName() && (
                  <p className="text-blue-600 text-sm mt-2">
                    <Folder className="w-4 h-4 inline mr-1" />
                    <strong>Will be saved to:</strong> {getSelectedFolderName()}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{documentData?.doc_id ? 'Uploaded' : 'Created'} by: {documentData?.createdBy || 'Current User'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Date: {documentData?.createdAt || new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-6 space-y-6">
            {/* Document Title */}
            <div>
              <label className="block text-base font-bold text-gray-800 mb-3">
                DOCUMENT TITLE:
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter document title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-base font-bold text-gray-800 mb-3  items-center">
                <Tag className="w-5 h-5 text-gray-600 mr-2" />
                SELECT CATEGORY:
              </label>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('category')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-orange-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  <span className={formData.selectedCategoryId ? 'text-gray-900' : 'text-gray-500'}>
                    {getSelectedCategoryName() || 'Choose a category...'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownStates.category ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownStates.category && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {loading ? (
                      <div className="px-4 py-3 text-gray-500">Loading categories...</div>
                    ) : error ? (
                      <div className="px-4 py-3 text-red-500">Error loading categories</div>
                    ) : availableCategories.length === 0 ? (
                      <div className="px-4 py-3 text-gray-500">No categories available</div>
                    ) : (
                      availableCategories.map((category) => (
                        <button
                          key={category.category_id}
                          onClick={() => selectCategory(category)}
                          className="w-full px-4 py-3 text-left hover:bg-orange-50 text-gray-700 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          {category.category_name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Location Selection */}
            <div>
              <label className=" text-base font-bold text-gray-800 mb-3 flex items-center">
                <Folder className="w-5 h-5 text-gray-600 mr-2" />
                SELECT LOCATION:
              </label>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('location')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-orange-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  <span className={formData.selectedFolderId ? 'text-gray-900' : 'text-gray-500'}>
                    {getSelectedFolderName() || 'Choose a folder...'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${dropdownStates.location ? 'rotate-180' : ''}`} />
                </button>
                
                {dropdownStates.location && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {loading ? (
                      <div className="px-4 py-3 text-gray-500">Loading folders...</div>
                    ) : error ? (
                      <div className="px-4 py-3 text-red-500">Error loading folders</div>
                    ) : availableFolders.length === 0 ? (
                      <div className="px-4 py-3 text-gray-500">No folders available</div>
                    ) : (
                      availableFolders.map((folder) => (
                        <button
                          key={folder.folder_id}
                          onClick={() => selectFolder(folder)}
                          className="w-full px-4 py-3 text-left hover:bg-orange-50 text-gray-700 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium">{folder.folder_name}</div>
                          <div className="text-xs text-gray-500 mt-1">{folder.folder_path}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-base font-bold text-gray-800 mb-3">
                REMARKS (OPTIONAL):
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                placeholder="Add any additional notes or remarks..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 pb-8 space-y-4">
            <button
              onClick={handleSave}
              disabled={saving || !documentData?.doc_id}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {!documentData?.doc_id 
                  ? 'NO DOCUMENT TO UPDATE'
                  : saving 
                    ? 'UPDATING...'
                    : 'UPDATE DOCUMENT'
                }
              </span>
            </button>
            
            <button
              onClick={handleCancel}
              className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>CANCEL</span>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {documentData?.doc_id 
              ? 'Update the document information and save your changes'
              : 'Fill in the required information to create a metadata-only document entry'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManualProcessing;