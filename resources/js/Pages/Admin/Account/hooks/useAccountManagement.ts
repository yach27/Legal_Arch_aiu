import { useState, useCallback } from 'react';
import axios from 'axios';
import { User, UserFormData } from '../types/account';

export const useAccountManagement = (initialUsers: User[] = []) => {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/admin/account/users');
            setUsers(response.data.users);
            return response.data.users;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch users';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const addUser = useCallback(async (data: UserFormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/admin/account/users', data);
            const newUser = response.data.user;
            setUsers([...users, newUser]);
            return newUser;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to add user';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [users]);

    const updateUser = useCallback(async (userId: number, data: Partial<UserFormData>) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.put(`/admin/account/users/${userId}`, data);
            const updatedUser = response.data.user;
            setUsers(users.map(u => u.user_id === userId ? updatedUser : u));
            return updatedUser;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to update user';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [users]);

    const deleteUser = useCallback(async (userId: number) => {
        setLoading(true);
        setError(null);
        try {
            await axios.delete(`/admin/account/users/${userId}`);
            setUsers(users.filter(u => u.user_id !== userId));
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to delete user';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [users]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        users,
        loading,
        error,
        fetchUsers,
        addUser,
        updateUser,
        deleteUser,
        clearError,
    };
};
