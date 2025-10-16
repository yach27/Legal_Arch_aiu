import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface SidebarCollapsedIconProps {
  onExpand: () => void;
}

export const SidebarCollapsedIcon: React.FC<SidebarCollapsedIconProps> = ({ onExpand }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="w-16 h-full bg-gradient-to-b from-green-800 to-green-900 flex flex-col items-center justify-start pt-4 shadow-2xl border-r-4 border-green-600 relative">
      <button
        onClick={onExpand}
        className="p-3 rounded-lg bg-green-700 hover:bg-green-600 transition-all hover:scale-105 mb-4 group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Expand Sidebar"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
      
      {/* Expand arrow indicator */}
      <div className="text-green-300 text-xs font-semibold transform -rotate-90 whitespace-nowrap">
        HISTORY
      </div>
      
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute left-full ml-2 top-16 bg-gray-800 text-white text-sm px-3 py-2 rounded shadow-lg whitespace-nowrap z-50">
          Click to expand history
        </div>
      )}
    </div>
  );
};