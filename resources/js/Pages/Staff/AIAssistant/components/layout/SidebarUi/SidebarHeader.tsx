import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SidebarHeaderProps {
  onBack?: () => void;
  onCollapse: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onBack, onCollapse }) => {
  return (
    <div className="relative px-5 py-5">
      {/* Solid background */}
      <div className="absolute inset-0 bg-[#144a18] border-b border-green-700"></div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Back Button */}
          <button
            onClick={onBack || (() => window.history.back())}
            className="p-2 hover:bg-green-700/30 rounded-xl transition-all flex-shrink-0 group"
          >
            <ArrowLeft className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </button>

          {/* Title */}
          <h2 className="text-lg font-bold text-white truncate tracking-wide">HISTORY</h2>
        </div>

        {/* Collapse Button */}
        <button
          onClick={onCollapse}
          className="p-2 hover:bg-green-700/30 rounded-xl transition-all group"
        >
          <span className="text-white font-bold text-lg group-hover:scale-110 inline-block transition-transform">&lt;</span>
        </button>
      </div>
    </div>
  );
};