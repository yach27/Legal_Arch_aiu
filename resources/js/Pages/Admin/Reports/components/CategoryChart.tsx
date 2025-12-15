import React from "react";
import { PieChart } from "lucide-react";

interface CategoryData {
    category: string;
    count: number;
    percentage: number;
    trend: string;
}

interface CategoryChartProps {
    data: CategoryData[];
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center gap-3 mb-6">
                <PieChart className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-800">Documents by Folder</h2>
            </div>

            <div className="space-y-4">
                {data.map((item, index) => (
                    <div key={index} className="group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-700">{item.category}</span>
                            <span className="text-gray-600">{item.count} docs</span>
                        </div>
                        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 group-hover:from-green-600 group-hover:to-green-700"
                                style={{ width: `${item.percentage}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{item.percentage.toFixed(1)}%</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryChart;
