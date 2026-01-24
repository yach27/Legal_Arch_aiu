import React from 'react';

interface ChatSessionDropdownProps {
  isStarred: boolean;
  onStar?: () => void;
  onUnstar?: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const ChatSessionDropdown: React.FC<ChatSessionDropdownProps> = ({
  isStarred,
  onStar,
  onUnstar,
  onDelete,
  onClose,
}) => {
  return (
    <div className="backdrop-blur-xl bg-gray-900/95 rounded-xl shadow-2xl min-w-[120px] border-2 border-white/20 overflow-hidden">
      {/* Inner glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isStarred && onUnstar) {
            onUnstar();
          } else if (!isStarred && onStar) {
            onStar();
          }
          onClose();
        }}
        className="relative w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all border-b border-white/10"
      >
        {isStarred ? 'UNSTAR' : 'STAR'}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="relative w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-red-500/30 hover:text-white transition-all"
      >
        DELETE
      </button>
    </div>
  );
};