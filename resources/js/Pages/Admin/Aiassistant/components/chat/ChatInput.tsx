import React, { useState } from 'react';
import { DocumentSelectionModal } from '../document/DocumentSelectionModal';
import { Document } from '../../types';

interface ChatInputProps {
  onSendMessage: (message: string, attachedDocuments?: Document[]) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [attachedDocuments, setAttachedDocuments] = useState<Document[]>([]);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message, attachedDocuments.length > 0 ? attachedDocuments : undefined);
      setMessage('');
      setAttachedDocuments([]); // Clear attached documents display after sending
    }
  };

  const handleDocumentSelect = (documents: Document[]) => {
    setAttachedDocuments(documents);
  };

  const removeAttachedDocument = (documentId: number) => {
    setAttachedDocuments(prev => prev.filter(doc => (doc.doc_id || doc.id) !== documentId));
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Attached Documents Display */}
        {attachedDocuments.length > 0 && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-green-800">
                Attached Documents ({attachedDocuments.length})
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {attachedDocuments.map((doc) => (
                <div
                  key={doc.doc_id || doc.id}
                  className="flex items-center bg-white border border-green-300 rounded-lg px-3 py-1 text-sm"
                >
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-green-800 mr-2 max-w-[150px] truncate">{doc.title}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachedDocument(doc.doc_id || doc.id)}
                    className="text-green-600 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center space-x-4">
          {/* Enhanced Input Field */}
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white rounded-2xl shadow-xl border-2 border-gray-200 focus-within:border-green-700 transition-all">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything about your documents..."
                disabled={disabled}
                className="w-full px-6 py-4 pr-16 bg-transparent border-none rounded-2xl focus:outline-none text-gray-800 placeholder-gray-400 text-lg"
              />
              
              {/* Attach Button */}
              <button
                type="button"
                onClick={() => setIsDocumentModalOpen(true)}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all ${
                  attachedDocuments.length > 0
                    ? 'text-green-700 bg-green-50'
                    : 'text-gray-400 hover:text-green-700 hover:bg-green-50'
                }`}
                title="Attach documents"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </div>
          </div>

          {/* Enhanced Send Button */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-green-800 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <button
              type="submit"
              disabled={disabled || !message.trim()}
              className="relative bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-4 rounded-2xl transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-xl disabled:shadow-none"
              title="Send message"
            >
              {disabled ? (
                <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>

        {/* Document Selection Modal */}
        <DocumentSelectionModal
          isOpen={isDocumentModalOpen}
          onClose={() => setIsDocumentModalOpen(false)}
          onSelectDocuments={handleDocumentSelect}
        />
      </div>
    </div>
  );
};