import React, { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import axios from 'axios';

interface Folder {
    folder_id: number;
    folder_name: string;
}

interface ReportFiltersProps {
    selectedPeriod: 'week' | 'month' | 'year';
    selectedCategory: string;
    onPeriodChange: (period: 'week' | 'month' | 'year') => void;
    onCategoryChange: (category: string) => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
    selectedPeriod,
    selectedCategory,
    onPeriodChange,
    onCategoryChange
}) => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFolders = async () => {
            try {
                const response = await axios.get('/api/manual-process/folders', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                        'Accept': 'application/json'
                    }
                });
                setFolders(response.data);
            } catch (error) {
                console.error('Error fetching folders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFolders();
    }, []);

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-700">
                    <Filter className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">Filters:</span>
                </div>

                <div className="flex gap-2">
                    {(['week', 'month', 'year'] as const).map((period) => (
                        <button
                            key={period}
                            onClick={() => onPeriodChange(period)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                selectedPeriod === period
                                    ? 'bg-green-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                    ))}
                </div>

                <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading}
                >
                    <option value="all">All Folders</option>
                    {folders.map((folder) => (
                        <option key={folder.folder_id} value={folder.folder_id.toString()}>
                            {folder.folder_name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ReportFilters;
