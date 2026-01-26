import React from "react";
import { Edit2, Trash2, ToggleRight, ToggleLeft, AlertCircle, FileText } from "lucide-react";

interface User {
    user_id: number;
    firstname: string;
    lastname: string;
    middle_name?: string;
    email: string;
    role: string;
    status?: 'active' | 'inactive';
    created_at?: string;
    permissions?: {
        can_delete?: boolean;
        can_upload?: boolean;
        can_view?: boolean;
    };
}

interface AccountTableProps {
    users: User[];
    loading: boolean;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onDeactivate: (user: User) => void;
    onViewUploads: (user: User) => void;
}

const AccountTable: React.FC<AccountTableProps> = ({
    users,
    loading,
    onEdit,
    onDelete,
    onDeactivate,
    onViewUploads,
}) => {
    const getStatusBadgeColor = (status?: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-800';
            case 'staff':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPermissionsDisplay = (user: User) => {
        const perms = user.permissions || {};
        const permsArray = [];
        if (perms.can_upload) permsArray.push('Upload');
        if (perms.can_view) permsArray.push('View');
        if (perms.can_delete) permsArray.push('Delete');
        return permsArray.length > 0 ? permsArray.join(', ') : 'View Only';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
                <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    Loading users...
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-12">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
                    <p className="text-gray-600">Try adjusting your search or filters</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Permissions
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr
                                key={user.user_id}
                                className="hover:bg-gray-50 transition-colors duration-200"
                            >
                                {/* Name */}
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {user.firstname} {user.lastname}
                                        </p>
                                        {user.middle_name && (
                                            <p className="text-xs text-gray-500">{user.middle_name}</p>
                                        )}
                                    </div>
                                </td>

                                {/* Email */}
                                <td className="px-6 py-4">
                                    <p className="text-gray-700 break-all">{user.email}</p>
                                </td>

                                {/* Role */}
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                                            user.role
                                        )}`}
                                    >
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </span>
                                </td>

                                {/* Permissions */}
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-700">{getPermissionsDisplay(user)}</p>
                                </td>

                                {/* Status */}
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                                            user.status
                                        )}`}
                                    >
                                        {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Active'}
                                    </span>
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-3">
                                        {/* View Uploads Button */}
                                        <button
                                            onClick={() => onViewUploads(user)}
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                                            title="View Uploads"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>

                                        {/* Edit Button */}
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                                            title="Edit user"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>

                                        {/* Toggle Status Button */}
                                        <button
                                            onClick={() => onDeactivate(user)}
                                            className={`p-2 rounded-lg transition-colors duration-200 ${user.status === 'active'
                                                ? 'text-green-600 hover:bg-green-100'
                                                : 'text-yellow-600 hover:bg-yellow-100'
                                                }`}
                                            title={user.status === 'active' ? 'Deactivate user' : 'Activate user'}
                                        >
                                            {user.status === 'active' ? (
                                                <ToggleRight className="w-4 h-4" />
                                            ) : (
                                                <ToggleLeft className="w-4 h-4" />
                                            )}
                                        </button>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => onDelete(user)}
                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                                            title="Delete user"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Table Footer - Results Count */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                    Showing {users.length} user{users.length !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    );
};

export default AccountTable;
