import React, { useState, useEffect } from 'react';
import { FileText, Folder, Save, X, ChevronDown, Calendar, User, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import DocumentQueueNavigation from './DocumentQueueNavigation';
import { useDocumentQueue } from '../../hooks/useDocumentQueue';
import UploadDocumentViewer from './UploadDocumentViewer';

interface Folder {
  folder_id: number;
  folder_name: string;
  folder_path: string;
  parent_folder_id: number | null;
}

interface FormData {
  title: string;
  selectedFolderId: number | null;
  description: string;
  remarks: string;
  physicalLocation: string;
  documentRefId: string;
}

const ManualProcessing = ({
  documentData = null,
  uploadedFile = null,
  onSave = (formData: FormData) => { },
  onCancel = () => { }
}) => {
  // State for real database data
  const [availableFolders, setAvailableFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: documentData?.title || '',
    selectedFolderId: documentData?.folder_id || null,
    description: documentData?.description || documentData?.analysis || '',
    remarks: documentData?.remarks || '',
    physicalLocation: documentData?.physical_location || '',
    documentRefId: documentData?.document_ref_id || ''
  });

  const [dropdownStates, setDropdownStates] = useState({
    location: false
  });

  const [errors, setErrors] = useState({
    documentRefId: '',
    title: ''
  });

  const docRefIdInputRef = React.useRef<HTMLInputElement>(null);

  // Update form data when documentData changes
  useEffect(() => {
    if (documentData) {
      console.log('ManualProcessing - documentData:', documentData);

      // Update formData
      setFormData({
        title: documentData.title || '',
        selectedFolderId: documentData.folder_id || null,
        description: documentData.description || documentData.analysis || (documentData as any).suggested_description || '',
        remarks: documentData.remarks || (documentData as any).ai_remarks || '',
        physicalLocation: documentData.physical_location || '',
        documentRefId: documentData.document_ref_id || ''
      });

      // Also update selectedFolderId directly if folder_id exists in documentData
      // This ensures the folder dropdown shows the correct selection
      const folderId = documentData.folder_id || (documentData as any).ai_suggested_folder_id;
      if (folderId) {
        setFormData(prev => ({
          ...prev,
          selectedFolderId: folderId
        }));
      }
    }
  }, [documentData]);

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

    // Clear error when user types
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };


  // Custom Cancel Modal State
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Document queue management for multi-document upload flow
  const {
    hasQueue,
    isFirstDocument,
    isLastDocument,
    remainingCount,
    currentPosition,
    totalDocuments,
    goToNextDocument,
    goToPreviousDocument,
    removeCurrentAndContinue,
    clearQueue
  } = useDocumentQueue(documentData?.doc_id);

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = async () => {
    // Delete the document from database if it exists
    if (documentData?.doc_id) {
      setSaving(true);
      setShowCancelDialog(false);

      try {
        const axios = (await import('axios')).default;
        await axios.delete(`/api/documents/${documentData.doc_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });

        // Show success message
        const toast = window.document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-50';
        toast.textContent = hasQueue && !isLastDocument
          ? `Document deleted. Moving to next (${remainingCount} remaining)...`
          : 'Document deleted successfully';
        window.document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);

        // Navigate to next document or back to document list
        setTimeout(() => {
          if (hasQueue && !isLastDocument) {
            removeCurrentAndContinue();
          } else {
            clearQueue();
            router.visit('/admin/documents');
          }
        }, 1000);

      } catch (error) {
        console.error('Failed to delete document:', error);
        alert('Failed to delete document. Redirecting anyway...');
        clearQueue();
        router.visit('/admin/documents');
      } finally {
        setSaving(false);
      }
    } else {
      clearQueue();
      router.visit('/admin/documents');
    }
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
    let isValid = true;
    const newErrors = {
      documentRefId: '',
      title: ''
    };

    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a document title';
      isValid = false;
    }

    if (!formData.documentRefId.trim()) {
      newErrors.documentRefId = 'Please enter a Document ID';
      if (docRefIdInputRef.current) {
        docRefIdInputRef.current.focus();
      }
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
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
        description: formData.description,
        remarks: formData.remarks,
        physical_location: formData.physicalLocation,
        document_ref_id: formData.documentRefId
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
        // Show success toast
        const toast = window.document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50';
        const hasMoreDocs = hasQueue && !isLastDocument;
        toast.textContent = hasMoreDocs
          ? `Document ${currentPosition}/${totalDocuments} saved! Moving to next...`
          : 'Document saved successfully!';
        window.document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);

        onSave(formData);

        // Navigate to next document or back to document list
        setTimeout(() => {
          if (hasMoreDocs) {
            goToNextDocument();
          } else {
            clearQueue();
            router.visit('/admin/documents');
          }
        }, 1000);
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
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Manual Document Processing</h1>
          <div className="h-1 w-32 rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}></div>

          {/* Status Indicator */}
          <div className="mt-5 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-[#228B22]" />
            <span className="text-sm font-medium text-gray-700 tracking-wide">Manual Review Mode</span>
            <span className="text-xs bg-green-100 text-[#228B22] px-3 py-1.5 rounded-full border border-green-200 font-medium">
              Human-Verified Entry
            </span>
          </div>
        </div>

        {/* Document Queue Navigation - shows when multiple documents uploaded */}
        {hasQueue && (
          <DocumentQueueNavigation
            currentPosition={currentPosition}
            totalDocuments={totalDocuments}
            isFirstDocument={isFirstDocument}
            isLastDocument={isLastDocument}
            onPrevious={goToPreviousDocument}
            onNext={goToNextDocument}
          />
        )}

        {/* Main Content Card */}
        <div className="rounded-2xl shadow-xl overflow-hidden bg-white border border-gray-100">
          {/* Document Uploaded Section */}
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-wider">Document Uploaded</h2>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-2.5 rounded-lg shadow-md" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
                  <FileText className="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p className="text-gray-900 text-base leading-relaxed font-medium mt-0.5">
                  "{documentData?.fileName || 'No file selected'}"
                </p>
              </div>

              {documentData?.doc_id && (
                <button
                  onClick={() => setIsViewerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors border border-blue-200"
                >
                  <Eye className="w-4 h-4" />
                  View File
                </button>
              )}
            </div>
          </div>

          {/* Manual Entry Fields Section */}
          <div className="px-8 py-6 border-b border-gray-100 bg-green-50/10">
            <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center uppercase tracking-wider">
              <div className="p-2.5 rounded-lg mr-3 shadow-md" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
                <User className="w-5 h-5 text-white" />
              </div>
              Manual Document Details
            </h3>

            <div className="space-y-5">
              {/* Document ID - Moved to Top & Required */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">Document ID</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <input
                    ref={docRefIdInputRef}
                    type="text"
                    value={formData.documentRefId}
                    onChange={(e) => handleInputChange('documentRefId', e.target.value)}
                    placeholder="Enter document reference ID (e.g., DOC-2024-001)..."
                    className={`w-full font-medium bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 leading-relaxed ${errors.documentRefId ? 'text-red-900' : 'text-gray-900'}`}
                  />
                </div>
                {errors.documentRefId && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center animate-pulse">
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    {errors.documentRefId}
                  </p>
                )}
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">Document Title</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter document title..."
                    className={`w-full font-medium bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 leading-relaxed ${errors.title ? 'text-red-900' : 'text-gray-900'}`}
                  />
                </div>
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center animate-pulse">
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">Description</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter document description..."
                    rows={3}
                    className="w-full text-gray-700 text-sm bg-transparent border-none focus:outline-none focus:ring-0 resize-none placeholder-gray-400 leading-relaxed"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">Remarks</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    placeholder="Enter additional remarks or notes..."
                    rows={3}
                    className="w-full text-gray-700 text-sm bg-transparent border-none focus:outline-none focus:ring-0 resize-none placeholder-gray-400 leading-relaxed"
                  />
                </div>
              </div>

              {/* Physical Location */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">Physical Location (Optional)</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <input
                    type="text"
                    value={formData.physicalLocation}
                    onChange={(e) => handleInputChange('physicalLocation', e.target.value)}
                    placeholder="Enter physical location of document (e.g., Cabinet A, Shelf 3)..."
                    className="w-full text-gray-900 font-medium bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Folder Selection Section */}
        <div className={`px-8 py-6 space-y-6 transition-all duration-200 ${dropdownStates.location ? 'pb-60' : ''}`}>
          {/* Folder Selection */}
          <div className="relative z-50">
            <h4 className="text-xs font-bold text-gray-500 mb-3 flex items-center uppercase tracking-wider">
              <div className="p-2.5 rounded-lg mr-2.5 shadow-md" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
                <Folder className="w-4 h-4 text-white" />
              </div>
              Folder Location
            </h4>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('location')}
                  className="w-full text-left flex items-center justify-between p-4 text-gray-900 font-medium focus:outline-none"
                >
                  <span className={formData.selectedFolderId ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                    {getSelectedFolderName() || 'Select a folder...'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownStates.location ? 'rotate-180' : ''}`} />
                </button>

                {dropdownStates.location && (
                  <div
                    className="absolute z-[999] w-full mt-1 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar bg-white border border-gray-100"
                  >
                    {loading ? (
                      <div className="px-4 py-3 text-gray-500 font-medium">Loading folders...</div>
                    ) : error ? (
                      <div className="px-4 py-3 text-red-600 font-medium">Error loading folders</div>
                    ) : availableFolders.length === 0 ? (
                      <div className="px-4 py-3 text-gray-500 font-medium">No folders available</div>
                    ) : (
                      availableFolders.map((folder) => {
                        // Determine if this is a subfolder by checking parent_folder_id
                        const isSubfolder = folder.parent_folder_id != null;

                        return (
                          <button
                            key={folder.folder_id}
                            onClick={() => selectFolder(folder)}
                            className="w-full px-4 py-3 text-left hover:bg-green-50 border-b border-gray-50 last:border-b-0 transition-all duration-200"
                            style={{ paddingLeft: isSubfolder ? '2rem' : '1rem' }}
                          >
                            <div className="font-semibold flex items-center gap-2 tracking-wide text-gray-900">
                              {isSubfolder && <span className="text-[#228B22]">└─</span>}
                              {folder.folder_name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 tracking-wide">{folder.folder_path}</div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid md:grid-cols-2 gap-6 pt-5 border-t border-gray-200">
            <div className="space-y-3.5">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Created by</span>
                <span className="text-sm font-semibold text-gray-900">{documentData?.createdBy || 'Current User'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Date</span>
                <span className="text-sm font-semibold text-gray-900">{documentData?.createdAt || new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-8 pb-8 space-y-3.5">
          <button
            onClick={handleSave}
            disabled={saving || !documentData?.doc_id}
            className="w-full text-white py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}
          >
            {saving ? (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 animate-spin" />
                <span>Saving Manual Entry...</span>
              </div>
            ) : (
              'Save Manual Entry'
            )}
          </button>

          <button
            onClick={() => {
              const docId = documentData?.doc_id;
              const url = docId ? `/ai-processing?docId=${docId}` : '/ai-processing';
              router.visit(url);
            }}
            disabled={saving}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none"
          >
            Back to AI Processing
          </button>

          <button
            onClick={handleCancel}
            disabled={saving}
            className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-600 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Manual processing mode • Review and update document details before saving
        </p>
      </div>

      {/* Cancel Confirmation Dialog */}
      {
        showCancelDialog && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-end justify-center z-[9999] p-4 pb-10">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden mb-60">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center">
                  <div className="bg-red-100 p-2.5 rounded-lg mr-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Cancel Processing?</h3>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                  Are you sure you want to cancel? This will <span className="font-bold text-red-600">delete the uploaded document</span> and all manually entered data.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={confirmCancel}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Yes, Cancel & Delete
                  </button>
                  <button
                    onClick={() => setShowCancelDialog(false)}
                    className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      <UploadDocumentViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        docId={documentData?.doc_id || null}
        fileName={documentData?.fileName || documentData?.title || 'Document'}
      />
    </div >
  );
};

export default ManualProcessing;