import React, { useState, useEffect } from 'react';
import { FileText, Folder, Calendar, User, Brain, CheckCircle, AlertCircle, ChevronDown, Eye } from 'lucide-react';
import { router } from '@inertiajs/react';
import UploadDocumentViewer from './UploadDocumentViewer';

interface DocumentData {
  doc_id?: number;
  fileName?: string;
  title?: string;
  description?: string;
  analysis?: string;
  suggestedLocation?: string;
  suggestedCategory?: string;
  createdBy?: string;
  createdAt?: string;
  status?: string;
  filePath?: string;
  physicalLocation?: string;
  folder_id?: number;
  remarks?: string;
}

interface UploadedFile {
  name?: string;
}

interface AnalysisData {
  suggested_title: string;
  suggested_description: string;
  ai_remarks: string;
  suggested_category: any;
  suggested_folder: any;
  category_confidence: number;
  folder_confidence: number;
  analysis_summary: string;
  word_count: number;
  character_count: number;
  processing_details: {
    model_used: string;
    text_extracted: boolean;
    categories_available: number;
    folders_available: number;
    analysis_time?: string;
  };
}

interface AIProcessingProps {
  documentData?: DocumentData | null;
  uploadedFile?: UploadedFile | null;
  onAccept?: () => void;
  onManualReview?: () => void;
}

interface Folder {
  folder_id: number;
  folder_name: string;
  folder_path: string;
  parent_folder_id?: number;
}

const AIProcessing: React.FC<AIProcessingProps> = ({
  documentData = null,
  uploadedFile = null,
  onAccept = () => {},
  onManualReview = () => {}
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'analyzing' | 'processing' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [physicalLocation, setPhysicalLocation] = useState<string>(documentData?.physicalLocation || '');

  // Folder management state
  const [availableFolders, setAvailableFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(documentData?.folder_id || null);
  const [aiSuggestedFolder, setAiSuggestedFolder] = useState<string>(documentData?.suggestedLocation || '');
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);

  // Use documentData from backend or fallback to sample data
  const document: DocumentData = documentData || {
    fileName: uploadedFile?.name || "Section I.10.33 of 'de Finibus Bonorum et Malorum me Erta Delos Erosa Nyo Linda.pdf'",
    analysis: "This is a contract for IT services between University and TechCorp, expires Dec 2024, involves IT Department.",
    suggestedLocation: "Contracts > IT Department > Active",
    suggestedCategory: "IT Services Contract",
    createdBy: "System AI",
    createdAt: new Date().toISOString().split('T')[0],
    status: "Pending Review"
  };

  // Fetch available folders on component mount
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const axios = (await import('axios')).default;
        const response = await axios.get('/api/manual-process/folders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });
        setAvailableFolders(response.data);

        // Check if AI-suggested folder exists in available folders
        if (aiSuggestedFolder && response.data.length > 0) {
          const matchedFolder = response.data.find((f: Folder) =>
            f.folder_name.toLowerCase() === aiSuggestedFolder.toLowerCase()
          );

          if (matchedFolder) {
            // Folder exists, auto-select it
            setSelectedFolderId(matchedFolder.folder_id);
          } else {
            // Folder doesn't exist, show warning dialog
            setNewFolderName(aiSuggestedFolder);
            setShowCreateFolderDialog(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch folders:', error);
      }
    };

    fetchFolders();
  }, [aiSuggestedFolder]);

  // Auto-analyze document when component loads
  useEffect(() => {
    console.log('AIProcessing - useEffect triggered', {
      documentData,
      hasDocId: !!documentData?.doc_id,
      hasAnalysisData: !!analysisData
    });

    // AI analysis is already done on the backend during upload
    // No need to call ai_bridge service again from frontend
    if (documentData?.doc_id && !analysisData) {
      console.log('AIProcessing - Document already analyzed on backend during upload');
      setProcessingStatus('completed');
    } else if (!documentData?.doc_id) {
      console.log('AIProcessing - No doc_id found in documentData:', documentData);
    }
  }, [documentData]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    setIsCreatingFolder(true);
    try {
      const axios = (await import('axios')).default;
      const response = await axios.post('/api/folders', {
        folder_name: newFolderName.trim(),
        folder_path: `d:/legal_office/${newFolderName.trim()}`,
        folder_type: 'General',
        parent_folder_id: null
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const newFolder = response.data.folder;
      setAvailableFolders([...availableFolders, newFolder]);
      setSelectedFolderId(newFolder.folder_id);
      setShowCreateFolderDialog(false);

      // Show success message
      const toast = window.document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50';
      toast.textContent = `Folder "${newFolderName}" created successfully!`;
      window.document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder. Please try again.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleAcceptAI = async () => {
    // Document is already processed with AI on the backend during upload
    // Save physical location and selected folder if provided, then redirect
    setIsProcessing(true);

    try {
      // Update document with physical location and selected folder if provided
      if (documentData?.doc_id && (physicalLocation || selectedFolderId)) {
        const axios = (await import('axios')).default;
        await axios.post('/api/manual-process/update', {
          doc_id: documentData.doc_id,
          title: documentData.title,
          folder_id: selectedFolderId || documentData.folder_id,
          description: documentData.description,
          remarks: documentData.remarks,
          physical_location: physicalLocation
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      }

      // Show success toast
      const successToast = window.document.createElement('div');
      successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-slide-in';
      successToast.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <div class="font-bold">File Uploaded Successfully!</div>
          <div class="text-sm opacity-90">Document has been processed and saved</div>
        </div>
      `;
      window.document.body.appendChild(successToast);

      // Remove toast after 3 seconds
      setTimeout(() => {
        successToast.remove();
      }, 3000);

      // Navigate back to document management page after a short delay
      setTimeout(() => {
        router.visit('/admin/documents');
      }, 1500);
    } catch (error) {
      console.error('Error saving physical location:', error);
      setIsProcessing(false);
      alert('Failed to save physical location, but continuing...');

      // Still navigate even if save failed
      setTimeout(() => {
        router.visit('/admin/documents');
      }, 1500);
    }
  };

  const handleManualReview = () => {
    // Navigate to manual processing with document ID if available
    const docId = documentData?.doc_id;
    const url = docId ? `/manualy-processing?docId=${docId}` : '/manualy-processing';
    router.visit(url);
  };

  const selectFolder = (folder: Folder) => {
    setSelectedFolderId(folder.folder_id);
    setDropdownOpen(false);
  };

  const getSelectedFolderName = () => {
    const selectedFolder = availableFolders.find(folder => folder.folder_id === selectedFolderId);
    return selectedFolder ? selectedFolder.folder_name : '';
  };

  const handleCancel = async () => {
    // Delete the document from database if it exists
    if (documentData?.doc_id) {
      const confirmDelete = window.confirm(
        'Are you sure you want to cancel? This will delete the uploaded document.'
      );

      if (!confirmDelete) {
        return;
      }

      setIsProcessing(true);
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
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-50';
        toast.textContent = 'Document deleted successfully';
        window.document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);

        // Navigate back after short delay
        setTimeout(() => {
          router.visit('/admin/documents');
        }, 1000);

      } catch (error) {
        console.error('Failed to delete document:', error);
        alert('Failed to delete document. Redirecting anyway...');
        router.visit('/admin/documents');
      }
    } else {
      // No document to delete, just navigate back
      router.visit('/admin/documents');
    }
  };

  const getStatusIcon = () => {
    switch (processingStatus) {
      case 'analyzing':
        return <Brain className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'processing':
        return <Brain className="w-5 h-5 text-orange-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Brain className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (processingStatus) {
      case 'analyzing':
        return 'Analyzing with Legal BERT...';
      case 'processing':
        return 'Processing with AI...';
      case 'completed':
        return 'AI Analysis Complete';
      case 'error':
        return 'Analysis Error';
      default:
        return 'Ready for Analysis';
    }
  };

  const displayAnalysis: AnalysisData = analysisData || {
    suggested_title: document.title || document.fileName || "Legal Document",
    suggested_description: document.description || "Document uploaded for AI processing",
    ai_remarks: document.remarks || "Processing complete",
    suggested_category: document.suggestedCategory ? { category_name: document.suggestedCategory } : null,
    suggested_folder: document.suggestedLocation ? { folder_name: document.suggestedLocation } : null,
    category_confidence: 0,
    folder_confidence: 0,
    analysis_summary: document.description || "Document ready for processing",
    word_count: 0,
    character_count: 0,
    processing_details: {
      model_used: 'AI Analysis Model',
      text_extracted: true,
      categories_available: 0,
      folders_available: 0
    }
  };

  return (
    <div className="min-h-screen p-4" style={{
      background: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)'
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">AI Document Processing</h1>
          <div className="h-1 w-32 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg"></div>

          {/* Status Indicator */}
          <div className="mt-5 flex items-center space-x-3">
            {getStatusIcon()}
            <span className="text-sm font-medium text-white/95 tracking-wide">{getStatusText()}</span>
            {displayAnalysis.processing_details?.model_used && (
              <span className="text-xs bg-green-500/20 text-green-200 px-3 py-1.5 rounded-full border border-green-400/30 font-medium">
                {displayAnalysis.processing_details.model_used}
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {processingStatus === 'error' && (
          <div className="mb-6 bg-red-500/20 border border-red-400/30 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-300 font-medium">Processing Error</p>
            </div>
            <p className="text-red-200 text-sm mt-1">{errorMessage}</p>
          </div>
        )}

        {/* Main Content Card */}
        <div className="rounded-2xl shadow-xl overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.25) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 10px 40px 0 rgba(100, 116, 139, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.3)'
        }}>
          {/* Document Uploaded Section */}
          <div className="px-8 py-6 border-b border-white/30" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white/90 uppercase tracking-wider">Document Uploaded</h2>
              {documentData?.doc_id && (
                <button
                  onClick={() => setViewerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 text-sm font-medium border border-white/30"
                >
                  <Eye className="w-4 h-4" />
                  View File
                </button>
              )}
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2.5 rounded-lg shadow-lg">
                <FileText className="w-5 h-5 text-white flex-shrink-0" />
              </div>
              <p className="text-white text-base leading-relaxed font-medium mt-0.5">
                "{document.fileName}"
              </p>
            </div>
          </div>

          {/* AI-Generated Fields Section */}
          <div className="px-8 py-6 border-b border-white/30" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)'
          }}>
            <h3 className="text-base font-bold text-white mb-5 flex items-center uppercase tracking-wider">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2.5 rounded-lg mr-3 shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              AI-Generated Details
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* AI-Suggested Title */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-2.5 uppercase tracking-wider">Suggested Title</label>
                <div className="bg-white/15 p-4 rounded-lg border border-green-500/40 backdrop-blur-sm shadow-sm">
                  <p className="text-white font-medium leading-relaxed">{displayAnalysis.suggested_title}</p>
                </div>
              </div>

              {/* AI-Generated Description */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-2.5 uppercase tracking-wider">AI Description</label>
                <div className="bg-white/15 p-4 rounded-lg border border-green-500/40 backdrop-blur-sm shadow-sm">
                  <p className="text-white/95 text-sm leading-relaxed">{displayAnalysis.suggested_description}</p>
                </div>
              </div>
            </div>

            {/* Document Statistics */}
            {displayAnalysis.word_count > 0 && (
              <div className="mt-5 flex items-center space-x-6 text-sm text-white/90 font-medium">
                <span className="tracking-wide">Words: {displayAnalysis.word_count.toLocaleString()}</span>
                <span className="tracking-wide">Characters: {displayAnalysis.character_count.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* AI Analysis Section */}
          <div className="px-8 py-6 border-b border-white/30">
            <div className="mb-4">
              <span className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                AI Analysis Summary
              </span>
            </div>
            <p className="text-white text-base leading-relaxed bg-green-500/10 p-5 rounded-lg border-l-4 border-green-500 font-normal">
              {displayAnalysis.analysis_summary}
            </p>

            {/* AI Remarks */}
            <div className="mt-6">
              <label className="block text-xs font-bold text-white/80 mb-2.5 uppercase tracking-wider">Processing Remarks</label>
              <div className="bg-white/10 p-4 rounded-lg border border-green-500/30 backdrop-blur-sm shadow-sm">
                <p className="text-white/95 text-sm leading-relaxed">{displayAnalysis.ai_remarks}</p>
              </div>
            </div>
          </div>

          {/* Document Details */}
          <div className={`px-8 py-6 space-y-6 transition-all duration-200 ${dropdownOpen ? 'pb-60' : ''}`}>

            {/* AI-Suggested Folder (Editable) */}
            <div className="relative z-50">
              <h4 className="text-xs font-bold text-white/80 mb-3 flex items-center uppercase tracking-wider">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-2.5 rounded-lg mr-2.5 shadow-lg">
                  <Folder className="w-4 h-4 text-white" />
                </div>
                AI-Suggested Folder
              </h4>

              {/* Show AI recommendation if it exists */}
              {aiSuggestedFolder && (
                <div className="mb-3 bg-blue-500/10 px-4 py-2.5 rounded-lg border border-blue-400/30 backdrop-blur-sm">
                  <p className="text-blue-200 text-xs">
                    <span className="font-semibold">AI Recommendation:</span> {aiSuggestedFolder}
                  </p>
                </div>
              )}

              {/* Folder Dropdown */}
              <div className="bg-white/15 p-4 rounded-lg border border-green-500/40 backdrop-blur-sm shadow-sm">
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full text-left flex items-center justify-between text-white font-medium focus:outline-none"
                  >
                    <span className={selectedFolderId ? 'text-white font-medium' : 'text-white/70'}>
                      {getSelectedFolderName() || 'Select a folder...'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute z-[999] w-full mt-1 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
                        backdropFilter: 'blur(40px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
                      }}>
                      {availableFolders.length === 0 ? (
                        <div className="px-4 py-3 text-gray-700 font-medium">No folders available</div>
                      ) : (
                        availableFolders.map((folder) => {
                          const isSubfolder = folder.parent_folder_id != null;

                          return (
                            <button
                              key={folder.folder_id}
                              onClick={() => selectFolder(folder)}
                              className="w-full px-4 py-3 text-left hover:bg-green-500/10 border-b border-gray-200/50 last:border-b-0 transition-all duration-200"
                              style={{ paddingLeft: isSubfolder ? '2rem' : '1rem' }}
                            >
                              <div className="font-semibold flex items-center gap-2 tracking-wide text-gray-900">
                                {isSubfolder && <span className="text-green-600">└─</span>}
                                {folder.folder_name}
                              </div>
                              <div className="text-xs text-gray-600 mt-1 tracking-wide">{folder.folder_path}</div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected folder display */}
              {selectedFolderId && (
                <div className="mt-2 text-xs text-green-300 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Folder selected
                </div>
              )}
            </div>

            {/* Processing Details */}
            {displayAnalysis.processing_details && (
              <div className="bg-white/10 p-5 rounded-lg backdrop-blur-sm border border-green-500/30 shadow-sm">
                <h4 className="text-xs font-bold text-white/80 mb-3 uppercase tracking-wider">Processing Details</h4>
                <div className="text-sm">
                  <span className="text-white/80 tracking-wide">Model Used</span>
                  <span className="ml-2 font-semibold text-white">{displayAnalysis.processing_details.model_used}</span>
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="space-y-3.5 pt-5 border-t border-white/20">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-white/80" />
                <span className="text-xs text-white/80 uppercase tracking-wider font-bold">Created by</span>
                <span className="text-sm font-semibold text-white">{document.createdBy}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-white/80" />
                <span className="text-xs text-white/80 uppercase tracking-wider font-bold">Date</span>
                <span className="text-sm font-semibold text-white">{document.createdAt}</span>
              </div>

              {/* Physical Location Input */}
              <div className="pt-3">
                <label className="block text-xs font-bold text-white/80 mb-2.5 uppercase tracking-wider">Physical Location (Optional)</label>
                <div className="bg-white/15 p-4 rounded-lg border border-green-500/40 backdrop-blur-sm shadow-sm">
                  <input
                    type="text"
                    value={physicalLocation}
                    onChange={(e) => setPhysicalLocation(e.target.value)}
                    placeholder="Enter physical location of document (e.g., Cabinet A, Shelf 3)..."
                    className="w-full text-white font-medium bg-transparent border-none focus:outline-none focus:ring-0 placeholder-white/60 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 pb-8 space-y-3.5">
            <button
              onClick={handleAcceptAI}
              disabled={isProcessing || processingStatus === 'error'}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-300 text-white py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <Brain className="w-4 h-4 animate-spin" />
                  <span>Processing with AI...</span>
                </div>
              ) : (
                'Accept AI Suggestions'
              )}
            </button>

            <button
              onClick={handleManualReview}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 disabled:from-gray-100 disabled:to-gray-100 text-gray-700 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              Manual Review
            </button>

            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-300 text-white py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white">
            {processingStatus === 'completed'
              ? 'AI processing completed • Review AI suggestions before accepting'
              : processingStatus === 'analyzing'
              ? 'Analyzing document with Legal BERT model...'
              : 'AI analysis ready • Review suggestions before accepting'
            }
          </p>
        </div>
      </div>

      {/* Create Folder Dialog */}
      {showCreateFolderDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start pt-20 justify-center z-[9999] p-4">
          <div className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.25) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
          }}>
            {/* Dialog Header */}
            <div className="px-6 py-5 border-b border-white/30" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)'
            }}>
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-2.5 rounded-lg mr-3 shadow-lg">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Folder Not Found</h3>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-white/90 text-sm leading-relaxed">
                The AI suggested folder <span className="font-bold text-green-300">"{aiSuggestedFolder}"</span> does not exist yet. Would you like to create it now?
              </p>

              {/* Folder Name Input */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wider">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-white/15 text-white px-4 py-3 rounded-lg border border-green-500/40 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-white/60"
                  placeholder="Enter folder name..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-300 text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateFolderDialog(false);
                    setNewFolderName('');
                  }}
                  disabled={isCreatingFolder}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Skip
                </button>
              </div>

              <p className="text-xs text-white/70 text-center">
                You can manually select a different folder from the dropdown above
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer */}
      <UploadDocumentViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        docId={documentData?.doc_id || null}
        fileName={document.fileName || 'Document'}
      />
    </div>
  );
};

export default AIProcessing;