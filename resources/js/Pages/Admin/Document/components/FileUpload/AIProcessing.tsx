import React, { useState, useEffect } from 'react';
import { FileText, Folder, Tag, Calendar, Building, User, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { router } from '@inertiajs/react';

interface DocumentData {
  doc_id?: number;
  fileName?: string;
  title?: string;
  analysis?: string;
  suggestedLocation?: string;
  suggestedCategory?: string;
  createdBy?: string;
  createdAt?: string;
  status?: string;
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
  
  // Use real file data or fallback to sample data
  const [document] = useState<DocumentData>(documentData || {
    fileName: uploadedFile?.name || "Section I.10.33 of 'de Finibus Bonorum et Malorum me Erta Delos Erosa Nyo Linda.pdf'",
    analysis: "This is a contract for IT services between University and TechCorp, expires Dec 2024, involves IT Department.",
    suggestedLocation: "Contracts > IT Department > Active",
    suggestedCategory: "IT Services Contract",
    createdBy: "System AI",
    createdAt: new Date().toISOString().split('T')[0],
    status: "Pending Review"
  });

  // Flask AI Bridge Service URL
  const AI_BRIDGE_URL = 'http://127.0.0.1:5003';

  // Auto-analyze document when component loads
  useEffect(() => {
    console.log('AIProcessing - useEffect triggered', { 
      documentData, 
      hasDocId: !!documentData?.doc_id,
      hasAnalysisData: !!analysisData 
    });
    
    if (documentData?.doc_id && !analysisData) {
      console.log('AIProcessing - Starting analysis for doc_id:', documentData.doc_id);
      analyzeDocument();
    } else if (!documentData?.doc_id) {
      console.log('AIProcessing - No doc_id found in documentData:', documentData);
    }
  }, [documentData]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  const analyzeDocument = async () => {
    console.log('analyzeDocument called with:', { documentData, docId: documentData?.doc_id });
    
    if (!documentData?.doc_id) {
      console.error('analyzeDocument: No doc_id available');
      return;
    }
    
    setProcessingStatus('analyzing');
    try {
      const payload = { docId: documentData.doc_id };
      console.log('Sending to AI Bridge:', { url: `${AI_BRIDGE_URL}/api/documents/analyze`, payload });
      
      const response = await fetch(`${AI_BRIDGE_URL}/api/documents/analyze`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('AI Bridge response:', result);
      
      if (result.success) {
        setAnalysisData(result.analysis);
        setProcessingStatus('completed');
      } else {
        setErrorMessage(result.message || 'Analysis failed');
        setProcessingStatus('error');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      setErrorMessage('Failed to connect to AI service');
      setProcessingStatus('error');
    }
  };

  const handleAcceptAI = async () => {
    setIsProcessing(true);
    setProcessingStatus('processing');

    try {
      const response = await fetch(`${AI_BRIDGE_URL}/api/documents/process-ai`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          docId: documentData?.doc_id
        })
      });

      const result = await response.json();

      if (result.success) {
        setProcessingStatus('completed');
        setIsProcessing(false);

        // Show success toast (simple and clean)
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
      } else {
        setErrorMessage(result.message || 'AI processing failed');
        setProcessingStatus('error');
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error('Processing error:', error);
      setErrorMessage('Failed to connect to AI processing service');
      setProcessingStatus('error');
      setIsProcessing(false);
    }
  };

  const handleManualReview = () => {
    // Navigate to manual processing with document ID if available
    const docId = documentData?.doc_id;
    const url = docId ? `/manualy-processing?docId=${docId}` : '/manualy-processing';
    router.visit(url);
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
    suggested_title: document.fileName || "Legal Document",
    suggested_description: document.analysis || "Document uploaded for AI processing",
    ai_remarks: "Awaiting AI analysis...",
    suggested_category: null,
    suggested_folder: null,
    category_confidence: 0,
    folder_confidence: 0,
    analysis_summary: document.analysis || "Document ready for processing",
    word_count: 0,
    character_count: 0,
    processing_details: {
      model_used: 'legal-bert-base-uncased',
      text_extracted: false,
      categories_available: 0,
      folders_available: 0
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI DOCUMENT PROCESSING</h1>
          <div className="h-1 w-32 bg-blue-500 rounded-full"></div>
          
          {/* Status Indicator */}
          <div className="mt-4 flex items-center space-x-3">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
            {displayAnalysis.processing_details?.model_used && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {displayAnalysis.processing_details.model_used}
              </span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {processingStatus === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-700 font-medium">Processing Error</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
            <button 
              onClick={analyzeDocument}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Document Uploaded Section */}
          <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">DOCUMENT UPLOADED:</h2>
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <p className="text-gray-700 text-base leading-relaxed">
                "{document.fileName}"
              </p>
            </div>
          </div>

          {/* AI-Generated Fields Section */}
          <div className="px-8 py-6 border-b border-gray-200 bg-blue-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Brain className="w-5 h-5 text-blue-600 mr-2" />
              AI-GENERATED DOCUMENT DETAILS:
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* AI-Suggested Title */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Suggested Title:</h4>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="text-gray-800 font-medium">{displayAnalysis.suggested_title}</p>
                </div>
              </div>

              {/* AI-Generated Description */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Description:</h4>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="text-gray-700 text-sm">{displayAnalysis.suggested_description}</p>
                </div>
              </div>
            </div>

            {/* Document Statistics */}
            {displayAnalysis.word_count > 0 && (
              <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
                <span>Words: {displayAnalysis.word_count.toLocaleString()}</span>
                <span>Characters: {displayAnalysis.character_count.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* AI Analysis Section */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mr-3">
                AI Analysis Summary:
              </span>
            </h3>
            <p className="text-gray-700 text-base leading-relaxed bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              {displayAnalysis.analysis_summary}
            </p>
            
            {/* AI Remarks */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Processing Remarks:</h4>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-gray-700 text-sm">{displayAnalysis.ai_remarks}</p>
              </div>
            </div>
          </div>

          {/* Document Details */}
          <div className="px-8 py-6 space-y-6">

            {/* AI-Suggested Category */}
            <div>
              <h4 className="text-base font-bold text-gray-800 mb-3 flex items-center">
                <Tag className="w-5 h-5 text-gray-600 mr-2" />
                AI-SUGGESTED CATEGORY:
              </h4>
              <div className="bg-green-50 px-4 py-3 rounded-lg border border-green-200">
                {displayAnalysis.suggested_category ? (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-700 font-medium">{displayAnalysis.suggested_category.category_name}</p>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {displayAnalysis.category_confidence > 0 ? `${displayAnalysis.category_confidence}% match` : 'AI Selected'}
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Analyzing categories...</p>
                )}
              </div>
            </div>

            {/* AI-Suggested Folder */}
            <div>
              <h4 className="text-base font-bold text-gray-800 mb-3 flex items-center">
                <Folder className="w-5 h-5 text-gray-600 mr-2" />
                AI-SUGGESTED FOLDER:
              </h4>
              <div className="bg-yellow-50 px-4 py-3 rounded-lg border border-yellow-200">
                {displayAnalysis.suggested_folder ? (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-700 font-medium">{displayAnalysis.suggested_folder.folder_name}</p>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      {displayAnalysis.folder_confidence > 0 ? `${displayAnalysis.folder_confidence}% match` : 'AI Selected'}
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Analyzing folders...</p>
                )}
              </div>
            </div>

            {/* Processing Details */}
            {displayAnalysis.processing_details && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Processing Details:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Model Used:</span>
                    <span className="ml-2 font-medium">{displayAnalysis.processing_details.model_used}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Text Extracted:</span>
                    <span className="ml-2 font-medium">{displayAnalysis.processing_details.text_extracted ? 'Yes' : 'Pending'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Categories Available:</span>
                    <span className="ml-2 font-medium">{displayAnalysis.processing_details.categories_available}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Folders Available:</span>
                    <span className="ml-2 font-medium">{displayAnalysis.processing_details.folders_available}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Created by:</span>
                  <span className="text-sm font-medium text-gray-800">{document.createdBy}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm font-medium text-gray-800">{document.createdAt}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="text-sm font-medium text-yellow-600">{document.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 pb-8 space-y-4">
            <button
              onClick={handleAcceptAI}
              disabled={isProcessing || processingStatus === 'error'}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-300 text-white py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <Brain className="w-4 h-4 animate-spin" />
                  <span>PROCESSING WITH AI...</span>
                </div>
              ) : (
                'ACCEPT AI SUGGESTIONS'
              )}
            </button>
            
            <button
              onClick={handleManualReview}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 disabled:from-gray-100 disabled:to-gray-100 text-gray-700 py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              DO A MANUAL REVIEW
            </button>
            
            {/* Retry Analysis Button */}
            {processingStatus === 'error' && (
              <button
                onClick={analyzeDocument}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-200"
              >
                RETRY AI ANALYSIS
              </button>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {processingStatus === 'completed' 
              ? 'AI processing completed • Review AI suggestions before accepting'
              : processingStatus === 'analyzing'
              ? 'Analyzing document with Legal BERT model...'
              : 'AI analysis ready • Review suggestions before accepting'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIProcessing;