import React from 'react';

interface NewChatButtonProps {
  onClick: () => void;
}

export const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick }) => {
  return (
    <div className="px-4 pb-6">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
        <button
          onClick={onClick}
          className="relative w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-2xl transition-all font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 border border-green-600"
        >
          <div className="flex items-center justify-center space-x-3 min-w-0">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="truncate">New Chat</span>
          </div>
        </button>
      </div>
    </div>
  );
};