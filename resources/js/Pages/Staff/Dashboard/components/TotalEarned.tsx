import { FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface TotalEarnedProps {
    data: any[];
}

const TotalEarned: FC<TotalEarnedProps> = ({ data }) => {
    // Transform data for the bar chart
    const chartData = data.slice(-12).map((item, index) => ({
        name: item.month,
        value: item.count * 10, // Multiply for visualization
    }));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total earned</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900">$144.6K</span>
                        <span className="text-sm text-green-600 font-medium">▲ 12%</span>
                    </div>
                </div>
            </div>
            <div className="mb-4">
                <p className="text-xs text-gray-500">Last 12 months</p>
            </div>
            <ResponsiveContainer width="100%" height={150}>
                <BarChart data={chartData} barCategoryGap="20%">
                    <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        style={{ fontSize: '10px' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        cursor={{ fill: 'transparent' }}
                    />
                    <Bar
                        dataKey="value"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        barSize={8}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TotalEarned;
