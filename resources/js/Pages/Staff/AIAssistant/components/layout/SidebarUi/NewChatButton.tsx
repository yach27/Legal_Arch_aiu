import React from 'react';

interface NewChatButtonProps {
  onClick: () => void;
}

export const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick }) => {
  return (
    <div className="px-5 pb-6 pt-2">
      <div className="relative group">
        {/* Animated glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-green-300 via-emerald-400 to-teal-400 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition-all duration-300 animate-pulse"></div>

        <button
          onClick={onClick}
          className="relative w-full backdrop-blur-xl bg-gradient-to-r from-green-500/70 to-emerald-600/70 hover:from-green-500/80 hover:to-emerald-600/80 text-white py-4 px-6 rounded-3xl transition-all font-bold text-lg shadow-2xl transform hover:scale-105 border-2 border-white/30"
        >
          {/* Inner shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl pointer-events-none"></div>

          <div className="relative flex items-center justify-center space-x-3 min-w-0">
            <svg className="w-7 h-7 flex-shrink-0 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="truncate drop-shadow-md">New Chat</span>
          </div>
        </button>
      </div>
    </div>
  );
};