import React from 'react';
import { Bot } from 'lucide-react';

interface SidebarFooterProps {
  onAllChatsClick: () => void;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ onAllChatsClick }) => {
  return (
    <div className="relative p-5">
      {/* Glass background */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/5 border-t border-white/10"></div>

      <button
        onClick={onAllChatsClick}
        className="relative w-full backdrop-blur-md bg-white/10 hover:bg-white/15 px-4 py-3 rounded-2xl transition-all border border-white/20 shadow-lg group"
      >
        {/* Inner highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

        <div className="relative flex items-center gap-3">
          <Bot className="w-5 h-5 text-white/90 group-hover:text-white group-hover:scale-110 transition-all" />
          <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors tracking-wide">ALL CHATS</span>
        </div>
      </button>
    </div>
  );
};