import React from 'react';

interface HeaderProps {
  currentSessionTitle?: string;
  onUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentSessionTitle, onUpload }) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-5">
            {/* Icon Container */}
            <div className="w-12 h-12 bg-gradient-to-br from-[#228B22] to-[#1a6b1a] rounded-2xl flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 truncate max-w-md">
                {currentSessionTitle || 'AI Assistant'}
              </h1>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="bg-gray-50 px-4 py-2 rounded-full border border-gray-200 flex items-center space-x-2">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-[#228B22] rounded-full"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 bg-[#228B22] rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};