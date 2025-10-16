import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SidebarHeaderProps {
  onBack?: () => void;
  onCollapse: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onBack, onCollapse }) => {
  return (
    <div className="px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
             onClick={onBack || (() => window.history.back())}
          className="p-1 hover:bg-green-500 rounded transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-xl font-bold truncate">HISTORY</h2>
      </div>
      <button
        onClick={onCollapse}
        className="p-1 hover:bg-green-500 rounded transition-colors"
      >
        <span className="text-white font-bold text-xl">&lt;</span>
      </button>
    </div>
  );
};