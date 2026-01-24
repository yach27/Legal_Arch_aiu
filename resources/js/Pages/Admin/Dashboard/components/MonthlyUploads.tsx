// components/MonthlyUploads.tsx
import React from 'react';
import { AreaChart, Area, XAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { MonthlyData } from '../types/dashboard';

interface MonthlyUploadsProps {
  data: MonthlyData[];
}

export default function MonthlyUploads({ data }: MonthlyUploadsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl shadow-lg border border-green-100/50 overflow-hidden" style={{ background: 'linear-gradient(135deg, #228B22 0%, #355105ff 100%)' }}>
        <div className="p-6 space-y-1.5">
          <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900">Monthly Uploads</h3>
          <p className="text-sm text-gray-600 font-normal">Track document submissions throughout the year</p>
        </div>
        <div className="p-6 pt-0">
          <div className="text-center py-12 text-gray-500 font-normal">
            No upload data available
          </div>
        </div>
      </div>
    );
  }

  // Calculate trend percentage
  const currentMonth = data[data.length - 1]?.count || 0;
  const previousMonth = data[data.length - 2]?.count || 0;
  const trendPercentage = previousMonth > 0
    ? (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1)
    : 0;

  // Get current year
  const currentYear = new Date().getFullYear();

  return (
    <div className="rounded-3xl shadow-lg border border-green-100/50 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)' }}>
      {/* Header */}
      <div className="p-6 space-y-1.5">
        <h3 className="text-2xl font-semibold leading-none tracking-tight text-white">Monthly Uploads</h3>
        <p className="text-sm text-gray-200 font-normal">
          Showing total uploads for the last {data.length} months
        </p>
      </div>

      {/* Chart Content */}
      <div className="p-6 pt-0">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12, fill: '#e5e7eb' }}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-lg">
                        <p className="text-sm font-medium text-gray-900">{payload[0].payload.month}</p>
                        <p className="text-sm text-gray-600">
                          Uploads: <span className="font-semibold text-green-600">{payload[0].value}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                dataKey="count"
                type="natural"
                fill="#4ade80"
                fillOpacity={0.4}
                stroke="#4ade80"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-0">
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium text-white leading-none">
              Trending {Number(trendPercentage) >= 0 ? 'up' : 'down'} by {Math.abs(Number(trendPercentage))}% this month
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-gray-200 font-normal">
              January - December {currentYear}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}