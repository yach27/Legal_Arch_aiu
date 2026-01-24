import React, { useState } from 'react';
import { Clock } from 'lucide-react';

interface SidebarCollapsedIconProps {
  onExpand: () => void;
}

export const SidebarCollapsedIcon: React.FC<SidebarCollapsedIconProps> = ({ onExpand }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="w-16 h-full relative flex flex-col items-center justify-start pt-4 shadow-2xl">
      {/* Glassmorphism background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/95 via-emerald-900/95 to-teal-900/95"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(74,222,128,0.15),transparent_70%)]"></div>

      {/* Glass overlay */}
      <div className="absolute inset-0 backdrop-blur-3xl bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>

      {/* Border */}
      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-green-400/30 via-green-500/30 to-green-600/30"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <button
          onClick={onExpand}
          className="p-3 rounded-xl transition-all duration-300 hover:scale-110 mb-6 group relative shadow-lg"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title="Expand Sidebar"
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.2) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(74, 222, 128, 0.4)',
            boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>

          {/* Hover glow effect */}
          <div className="absolute inset-0 rounded-xl bg-green-400/0 group-hover:bg-green-400/20 transition-all duration-300"></div>
        </button>

        {/* Expand arrow indicator - with more spacing */}
        <div className="text-green-200/90 text-[10px] font-bold transform -rotate-90 whitespace-nowrap tracking-widest drop-shadow-lg mt-4">
          HISTORY
        </div>
      </div>

      {/* Tooltip with glassmorphism */}
      {isHovered && (
        <div
          className="absolute left-full ml-2 top-16 text-white text-sm px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap z-50"
          style={{
            background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          Click to expand history
        </div>
      )}
    </div>
  );
};