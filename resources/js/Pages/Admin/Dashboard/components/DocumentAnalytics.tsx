// components/DocumentAnalytics.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { DocumentCategory } from '../types/dashboard';

interface DocumentAnalyticsProps {
  categories: DocumentCategory[];
}

export default function DocumentAnalytics({ categories }: DocumentAnalyticsProps) {
  // Find the category with highest count for highlight
  const topCategory = categories.reduce((max, category) =>
    category.count > max.count ? category : max, categories[0]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-1">DOCUMENT ANALYTICS</h3>
        <p className="text-sm text-gray-500">Comprehensive category distribution overview</p>
      </div>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={95}
              paddingAngle={2}
              dataKey="count"
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={50}
              formatter={(value, entry: any) => (
                <span className="text-xs font-medium text-gray-600">
                  {entry.payload.name} ({entry.payload.percentage}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Top Category Highlight */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: topCategory.color }}
            />
            <div>
              <div className="font-bold text-green-800 text-lg">{topCategory.name}</div>
              <div className="text-sm text-green-600">
                {topCategory.count} documents
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-700">{topCategory.percentage}%</div>
            <div className="text-xs text-green-600">of total</div>
          </div>
        </div>
      </div>
    </div>
  );
}