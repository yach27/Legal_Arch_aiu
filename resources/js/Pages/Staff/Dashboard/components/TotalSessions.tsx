import { FC } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

interface TotalSessionsProps {
    data: any[];
}

const TotalSessions: FC<TotalSessionsProps> = ({ data }) => {
    // Transform data for line chart
    const chartData = data.slice(-12).map((item) => ({
        name: item.month,
        value: item.count * 5,
    }));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total sessions</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">400</span>
                        <span className="text-sm text-green-600 font-medium">▲ 5%</span>
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={100}>
                <LineChart data={chartData}>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        cursor={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md font-medium">↑ 5.2%</span>
                <span className="text-gray-500">105 visitors</span>
            </div>
        </div>
    );
};

export default TotalSessions;
