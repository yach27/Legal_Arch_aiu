import React from "react";
import { Users, UserPlus } from "lucide-react";

interface AccountHeaderProps {
    totalUsers: number;
    activeUsers: number;
    onAddUserClick: () => void;
}

const AccountHeader: React.FC<AccountHeaderProps> = ({
    totalUsers,
    activeUsers,
    onAddUserClick,
}) => {
    return (
        <div className="mb-8">
            {/* Title and Stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Management</h1>
                    <p className="text-gray-600">Manage users, roles, and permissions</p>
                </div>

                <button
                    onClick={onAddUserClick}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg w-full md:w-auto justify-center md:justify-start"
                >
                    <UserPlus className="w-5 h-5" />
                    Add New User
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Users */}
                <div className="rounded-2xl p-6 border border-green-700/30 shadow-md" 
                    style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm font-medium mb-1">Total Users</p>
                            <p className="text-4xl font-bold text-white">{totalUsers}</p>
                        </div>
                        <div className="p-4 bg-white/20 rounded-xl">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>

                {/* Active Users */}
                <div className="rounded-2xl p-6 border border-yellow-700/30 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #FBEC5D 0%, #F4D03F 100%)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-800 text-sm font-medium mb-1">Active Users</p>
                            <p className="text-4xl font-bold text-gray-900">{activeUsers}</p>
                        </div>
                        <div className="p-4 bg-white/30 rounded-xl">
                            <Users className="w-8 h-8 text-gray-900" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountHeader;
