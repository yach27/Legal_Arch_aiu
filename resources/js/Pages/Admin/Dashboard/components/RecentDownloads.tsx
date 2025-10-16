// components/RecentDownloads.tsx
import React from 'react';
import { RecentFile } from '../types/dashboard';

interface RecentDownloadsProps {
  downloads: RecentFile[];
}

export default function RecentDownloads({ downloads }: RecentDownloadsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-green-600">RECENT DOWNLOADS</h2>
        <span className="text-sm text-gray-400">{downloads.length} downloads</span>
      </div>

      <div className="space-y-4">
        {downloads.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <h3 className="text-gray-600 font-medium mb-1">No downloads today</h3>
            <p className="text-sm text-gray-400">Downloads from the last 24 hours will appear here</p>
          </div>
        ) : (
          downloads.map((download) => (
            <div key={download.id} className="group hover:bg-gray-50 p-4 rounded-lg transition-all duration-200 cursor-pointer border border-gray-100 hover:border-blue-200 hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                    {download.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-2 text-sm">
                    <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                      DOWNLOADED
                    </span>
                    <span className="text-gray-500 font-medium">{download.timestamp}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500">{download.date}</span>
                  </div>
                </div>
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="text-green-600 hover:text-green-700 text-sm font-medium">
          View all downloads →
        </button>
      </div>
    </div>
  );
}