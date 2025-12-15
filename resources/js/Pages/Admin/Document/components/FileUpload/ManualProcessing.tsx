import React, { useState, useEffect } from 'react';
import { FileText, Folder, Save, X, ChevronDown, Calendar, User, CheckCircle } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

interface Folder {
  folder_id: number;
  folder_name: string;
  folder_path: string;
}

interface FormData {
  title: string;
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
  const [availableFolders, setAvailableFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: documentData?.title || '',
    selectedFolderId: documentData?.folder_id || null,
    remarks: documentData?.remarks || ''
  });

  const [dropdownStates, setDropdownStates] = useState({
    location: false
  });

  // Fetch folders from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch folders
        const foldersResponse = await axios.get('/api/manual-process/folders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });

        setAvailableFolders(foldersResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load folders');
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

  const selectFolder = (folder: Folder) => {
    handleInputChange('selectedFolderId', folder.folder_id);
    setDropdownStates(prev => ({
      ...prev,
      location: false
    }));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MANUAL DOCUMENT PROCESSING</h1>
          <div className="h-1 w-32 bg-orange-500 rounded-full"></div>

          {/* Status Indicator */}
          <div className="mt-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Manual Review Mode</span>
            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
              Human-Verified Entry
            </span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Document Uploaded Section */}
          <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">DOCUMENT UPLOADED:</h2>
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
              <p className="text-gray-700 text-base leading-relaxed">
                "{documentData?.fileName || 'No file selected'}"
              </p>
            </div>
          </div>

          {/* Manual Entry Fields Section */}
          <div className="px-8 py-6 border-b border-gray-200 bg-orange-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 text-orange-600 mr-2" />
              MANUAL DOCUMENT DETAILS:
            </h3>

            <div className="space-y-6">
              {/* Document Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Document Title:</label>
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter document title..."
                    className="w-full text-gray-800 font-medium bg-transparent border-none focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              {/* Description/Remarks */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description/Remarks:</label>
                <div className="bg-white p-3 rounded-lg border border-orange-200">
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    placeholder="Enter document description or remarks..."
                    rows={3}
                    className="w-full text-gray-700 text-sm bg-transparent border-none focus:outline-none focus:ring-0 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Folder Selection Section */}
          <div className="px-8 py-6 space-y-6">
            {/* Folder Selection */}
            <div>
              <h4 className="text-base font-bold text-gray-800 mb-3 flex items-center">
                <Folder className="w-5 h-5 text-gray-600 mr-2" />
                FOLDER LOCATION:
              </h4>
              <div className="bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('location')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-orange-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  >
                    <span className={formData.selectedFolderId ? 'text-gray-900 font-medium' : 'text-gray-500'}>
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
            </div>

            {/* Additional Details */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Created by:</span>
                  <span className="text-sm font-medium text-gray-800">{documentData?.createdBy || 'Current User'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm font-medium text-gray-800">{documentData?.createdAt || new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 pb-8 space-y-4">
            <button
              onClick={handleSave}
              disabled={saving || !documentData?.doc_id}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-300 text-white py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {saving ? (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4 animate-spin" />
                  <span>SAVING MANUAL ENTRY...</span>
                </div>
              ) : (
                'SAVE MANUAL ENTRY'
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={saving}
              className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 disabled:from-gray-100 disabled:to-gray-100 text-gray-700 py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              CANCEL
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Manual processing mode • Review and update document details before saving
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManualProcessing;