import React from 'react';
import { Bot } from 'lucide-react';

interface SidebarFooterProps {
  onAllChatsClick: () => void;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ onAllChatsClick }) => {
  return (
    <div className="p-4 border-t border-green-500">
      <button 
        onClick={onAllChatsClick}
        className="flex items-center gap-2 text-sm text-green-200 hover:text-white transition-colors"
      >
        <Bot className="w-4 h-4" />
        ALL CHATS
      </button>
    </div>
  );
};