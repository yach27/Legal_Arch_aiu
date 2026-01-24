// components/StatsCard.tsx
import React from 'react';
import { Download } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  showExport?: boolean;
}

export default function StatsCard({ title, value, subtitle, showExport = false }: StatsCardProps) {
  return (
    <div className="relative rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden" style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 10px 40px 0 rgba(100, 116, 139, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.2)'
    }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white/85 tracking-tight">{title}</h3>
        {showExport && (
          <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
            <Download size={16} />
            EXPORT
          </button>
        )}
      </div>

      <div className="text-4xl font-semibold text-white/85 mb-2">
        {value}
      </div>

      {subtitle && (
        <p className="text-sm text-white/65 font-normal">{subtitle}</p>
      )}

      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-xl"></div>
    </div>
  );
}