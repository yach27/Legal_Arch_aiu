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
    <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h3>
        {showExport && (
          <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
            <Download size={16} />
            EXPORT
          </button>
        )}
      </div>

      <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-2">
        {value}
      </div>

      {subtitle && (
        <p className="text-sm text-gray-600 font-medium">{subtitle}</p>
      )}

      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-xl"></div>
    </div>
  );
}