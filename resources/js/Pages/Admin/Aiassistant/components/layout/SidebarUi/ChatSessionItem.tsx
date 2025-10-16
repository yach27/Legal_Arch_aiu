import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { ChatSessionDropdown } from './ChatSessionDropdown';

interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
}

interface ChatSessionItemProps {
  session: ChatSession;
  isSelected: boolean;
  isStarred: boolean;
  onSelect: () => void;
  onStar?: () => void;
  onUnstar?: () => void;
  onDelete: () => void;
}

export const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
  session,
  isSelected,
  isStarred,
  onSelect,
  onStar,
  onUnstar,
  onDelete,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div
      className={`relative mb-2 rounded-lg cursor-pointer transition-all duration-200 border-b border-green-600/30 ${
        isSelected
          ? "bg-green-700 shadow-lg border-l-4 border-l-green-400"
          : "bg-green-800/30 hover:bg-green-700/50 hover:shadow-md hover:border-l-4 hover:border-l-green-500"
      }`}
      onClick={onSelect}
    >
      <div className="p-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Title with icon indicator */}
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isSelected ? "bg-green-300 animate-pulse" : "bg-green-500/50"
            }`} />
            <p className="text-sm font-semibold text-white leading-tight truncate">
              {session.title}
            </p>
          </div>

          {/* Last message preview */}
          {session.lastMessage && (
            <p className="text-xs text-green-100/70 mt-1.5 truncate pl-4 italic">
              {session.lastMessage}
            </p>
          )}
        </div>

        {/* More options button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="p-1.5 hover:bg-green-600 rounded-full transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4 text-white" />
          </button>

          {showDropdown && (
            <ChatSessionDropdown
              isStarred={isStarred}
              onStar={onStar}
              onUnstar={onUnstar}
              onDelete={onDelete}
              onClose={() => setShowDropdown(false)}
            />
          )}
        </div>
      </div>

      {/* Bottom border with gradient */}
      {!isSelected && (
        <div className="h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />
      )}
    </div>
  );
};