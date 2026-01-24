import { FC } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface AnalyticsData {
    folder_id: number;
    folder_name: string;
    count: number;
    color: string;
}

interface DocumentAnalyticsProps {
    categories: AnalyticsData[];
}

const DocumentAnalytics: FC<DocumentAnalyticsProps> = ({ categories }) => {
    // Calculate total and percentages
    const totalDocs = categories.reduce((sum, cat) => sum + cat.count, 0);
    const categoriesWithPercentage = categories
        .map(cat => ({
            ...cat,
            percentage: totalDocs > 0 ? Math.round((cat.count / totalDocs) * 100) : 0
        }))
        .filter(cat => cat.count > 0);

    // Find the category with highest count for highlight
    const topCategory = categoriesWithPercentage.length > 0
        ? categoriesWithPercentage.reduce((max, category) =>
            category.count > max.count ? category : max, categoriesWithPercentage[0])
        : null;

    if (!topCategory || categories.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 space-y-1.5">
                    <h3 className="text-2xl font-semibold text-gray-900">Document Analytics</h3>
                    <p className="text-sm text-gray-600">Folder distribution overview</p>
                </div>
                <div className="p-6 pt-0">
                    <div className="text-center py-12 text-gray-500">
                        No documents to display
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 space-y-1.5 text-center">
                <h3 className="text-2xl font-semibold text-gray-900">Document Analytics</h3>
                <p className="text-sm text-gray-600">Folder distribution overview</p>
            </div>

            {/* Chart Content */}
            <div className="flex-1 p-6 pt-0 pb-0">
                <div className="mx-auto aspect-square max-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-lg">
                                                <p className="text-sm font-medium">{payload[0].name}</p>
                                                <p className="text-sm text-gray-600">
                                                    Documents: <span className="font-semibold">{payload[0].value}</span>
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Pie
                                data={categoriesWithPercentage}
                                cx="50%"
                                cy="50%"
                                paddingAngle={0}
                                dataKey="count"
                                nameKey="folder_name"
                                label={false}
                                labelLine={false}
                                outerRadius="80%"
                            >
                                {categoriesWithPercentage.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value, entry: any) => (
                                    <span className="text-xs text-gray-600">
                                        {entry.payload.folder_name}
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 flex flex-col gap-2 text-sm">
                {topCategory.percentage > 0 && (
                    <div className="flex items-center gap-2 font-medium text-gray-700 leading-none">
                        Trending up by {topCategory.percentage}% this month <TrendingUp className="h-4 w-4" />
                    </div>
                )}
                <div className="text-gray-600 leading-none">
                    Showing total documents for all folders
                </div>
            </div>
        </div>
    );
};

export default DocumentAnalytics;
