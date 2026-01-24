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
        <div className="rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 p-6" style={{
            background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)'
        }}>
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-white">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Filter className="w-5 h-5" />
                    </div>
                    <span className="font-bold">FILTERS:</span>
                </div>

                <div className="flex gap-2">
                    {(['week', 'month', 'year'] as const).map((period) => (
                        <button
                            key={period}
                            onClick={() => onPeriodChange(period)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                selectedPeriod === period
                                    ? 'text-white shadow-lg'
                                    : 'bg-white/20 text-white/90 hover:bg-white/30'
                            }`}
                            style={selectedPeriod === period ? {
                                background: 'linear-gradient(90deg, #FBEC5D 0%, #f5e042 100%)',
                                color: '#228B22'
                            } : {}}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                    ))}
                </div>

                <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium focus:ring-2 focus:outline-none hover:bg-white/30 transition-all duration-300"
                    disabled={loading}
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        color: 'white'
                    }}
                >
                    <option value="all" style={{ color: '#1f2937', background: 'white' }}>All Folders</option>
                    {folders.map((folder) => (
                        <option key={folder.folder_id} value={folder.folder_id.toString()} style={{ color: '#1f2937', background: 'white' }}>
                            {folder.folder_name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default ReportFilters;
