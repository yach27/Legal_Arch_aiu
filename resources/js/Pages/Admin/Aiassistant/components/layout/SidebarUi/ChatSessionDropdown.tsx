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
    <div className="absolute right-0 top-8 bg-green-600 rounded shadow-lg z-10 min-w-[100px]">
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
        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-green-500 rounded-t transition-colors"
      >
        {isStarred ? 'UNSTAR' : 'STAR'}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-green-500 rounded-b transition-colors"
      >
        DELETE
      </button>
    </div>
  );
};