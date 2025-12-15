import React from "react";

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle }) => {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6 hover:shadow-lg transition-all duration-200 group">
            <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl text-white group-hover:scale-110 transition-transform duration-200">
                    {icon}
                </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
            <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
    );
};

export default StatCard;
