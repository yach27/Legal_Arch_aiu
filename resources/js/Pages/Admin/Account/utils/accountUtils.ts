/**
 * Account Management Utilities
 * Helper functions for user data formatting and validation
 */

import { User } from '../types/account';

/**
 * Format user full name
 */
export const formatUserName = (user: User): string => {
    const parts = [user.firstname, user.middle_name, user.lastname].filter(Boolean);
    return parts.join(' ');
};

/**
 * Format role for display
 */
export const formatRole = (role: string): string => {
    return role.charAt(0).toUpperCase() + role.slice(1);
};

/**
 * Format status for display
 */
export const formatStatus = (status?: string): string => {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Active';
};

/**
 * Get role badge color
 */
export const getRoleBadgeColor = (role: string): string => {
    switch (role) {
        case 'admin':
            return 'bg-purple-100 text-purple-800';
        case 'staff':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

/**
 * Get status badge color
 */
export const getStatusBadgeColor = (status?: string): string => {
    switch (status) {
        case 'active':
            return 'bg-green-100 text-green-800';
        case 'inactive':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

/**
 * Format permissions for display
 */
export const formatPermissions = (user: User): string => {
    const perms = user.permissions || {};
    const permsArray = [];
    
    if (perms.can_upload) permsArray.push('Upload');
    if (perms.can_view) permsArray.push('View');
    if (perms.can_delete) permsArray.push('Delete');
    
    return permsArray.length > 0 ? permsArray.join(', ') : 'View Only';
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
    return password.length >= 6;
};

/**
 * Check if user can be deleted
 * (e.g., prevent deleting the last admin)
 */
export const canDeleteUser = (user: User, allUsers: User[]): boolean => {
    // Prevent deletion of last admin
    if (user.role === 'admin') {
        const adminCount = allUsers.filter(u => u.role === 'admin').length;
        return adminCount > 1;
    }
    return true;
};

/**
 * Sort users by property
 */
export const sortUsers = (users: User[], property: keyof User, ascending = true): User[] => {
    return [...users].sort((a, b) => {
        const aValue = a[property];
        const bValue = b[property];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return ascending 
                ? aValue.localeCompare(bValue) 
                : bValue.localeCompare(aValue);
        }

        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        if (aValue === bValue) return 0;

        return ascending ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
};

/**
 * Filter users based on search term and role
 */
export const filterUsers = (
    users: User[],
    searchTerm: string,
    role: string
): User[] => {
    return users.filter(user => {
        const matchesSearch = 
            user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = role === 'all' || user.role === role;
        
        return matchesSearch && matchesRole;
    });
};

/**
 * Generate default permissions based on role
 */
export const getDefaultPermissions = (role: string) => {
    switch (role) {
        case 'admin':
            return {
                can_view: true,
                can_upload: true,
                can_delete: true,
            };
        case 'staff':
        default:
            return {
                can_view: true,
                can_upload: true,
                can_delete: false,
            };
    }
};

/**
 * Export users to CSV
 */
export const exportUsersToCSV = (users: User[], filename = 'users.csv'): void => {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Permissions'];
    const rows = users.map(user => [
        user.user_id,
        user.firstname,
        user.lastname,
        user.email,
        formatRole(user.role),
        formatStatus(user.status),
        formatPermissions(user),
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Calculate user statistics
 */
export const getUserStats = (users: User[]) => {
    return {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        admins: users.filter(u => u.role === 'admin').length,
        staff: users.filter(u => u.role === 'staff').length,
    };
};
