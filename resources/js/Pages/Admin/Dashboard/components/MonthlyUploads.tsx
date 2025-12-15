// components/MonthlyUploads.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { MonthlyData } from '../types/dashboard';

interface MonthlyUploadsProps {
  data: MonthlyData[];
}

export default function MonthlyUploads({ data }: MonthlyUploadsProps) {
  // Calculate max value for Y-axis domain
  const maxUploads = data.length > 0 ? Math.max(...data.map(d => d.count)) : 100;
  const yAxisMax = Math.ceil(maxUploads * 1.2); // Add 20% padding

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">MONTHLY PAPER UPLOADS</h3>
        <p className="text-sm text-gray-500 mb-6">Track document submissions throughout the year</p>
        <div className="text-center py-12 text-gray-500">
          No upload data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-2">MONTHLY PAPER UPLOADS</h3>
      <p className="text-sm text-gray-500 mb-6">Track document submissions throughout the year</p>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              domain={[0, yAxisMax]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}