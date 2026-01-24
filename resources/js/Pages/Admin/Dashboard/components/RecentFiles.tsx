// components/RecentFiles.tsx
import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { RecentFile } from '../types/dashboard';
import UploadDocumentViewer from '../../Document/components/FileUpload/UploadDocumentViewer';

interface RecentFilesProps {
  files: RecentFile[];
}

export default function RecentFiles({ files }: RecentFilesProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const handleViewDocument = (file: RecentFile) => {
    if (typeof file.id === 'number') {
      setSelectedDocId(file.id);
      setSelectedFileName(file.title);
      setViewerOpen(true);
    }
  };

  return (
    <div className="rounded-3xl shadow-lg border border-green-100/50 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">RECENT ADDED FILES</h2>
          <span className="text-sm text-gray-200 font-normal">{files.length} files</span>
        </div>

        <div className={`space-y-4 ${files.length > 2 ? 'max-h-[280px] overflow-y-auto custom-scrollbar pr-2' : ''}`}>
          {files.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-3">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-gray-200 font-semibold mb-1">No files added today</h3>
              <p className="text-sm text-gray-300 font-normal">Files added today will appear here</p>
            </div>
          ) : (
            files.map((file) => (
              <div key={file.id} className="group hover:bg-green-900/20 p-4 rounded-lg transition-all duration-200 cursor-pointer border border-green-700/30 hover:border-green-500/50 hover:shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-green-300 transition-colors leading-tight">
                      {file.title}
                    </h3>
                    <div className="flex items-center flex-wrap gap-2 text-sm">
                      <span className="bg-green-900/50 text-green-200 px-2.5 py-1 rounded-full text-xs font-medium">
                        PDF
                      </span>
                      <span className="text-gray-300 font-normal">{file.timestamp}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400 font-light">{file.date}</span>
                    </div>
                  </div>
                  <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDocument(file);
                      }}
                      className="text-gray-400 hover:text-green-300 p-2 rounded-full hover:bg-green-900/30 transition-all"
                      title="View document"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-green-700/30">
          <Link href="/admin/documents" className="text-green-300 hover:text-green-200 text-sm font-medium inline-block">
            View all files →
          </Link>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <UploadDocumentViewer
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setSelectedDocId(null);
          setSelectedFileName('');
        }}
        docId={selectedDocId}
        fileName={selectedFileName}
      />
    </div>
  );
}