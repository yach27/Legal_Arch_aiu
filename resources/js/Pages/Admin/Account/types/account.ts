export interface User {
    user_id: number;
    firstname: string;
    lastname: string;
    middle_name?: string;
    email: string;
    role: 'admin' | 'staff';
    status?: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
    permissions?: {
        can_delete?: boolean;
        can_upload?: boolean;
        can_view?: boolean;
    };
}

export interface UserFormData {
    firstname: string;
    lastname: string;
    middle_name?: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    role: 'admin' | 'staff';
    permissions?: {
        can_delete?: boolean;
        can_upload?: boolean;
        can_view?: boolean;
    };
    status?: 'active' | 'inactive';
}

export interface AccountPageProps {
    users: User[];
    [key: string]: any;
}

export interface AccountContextType {
    users: User[];
    loading: boolean;
    error: string | null;
    fetchUsers: () => Promise<void>;
    addUser: (data: UserFormData) => Promise<User>;
    updateUser: (id: number, data: Partial<UserFormData>) => Promise<User>;
    deleteUser: (id: number) => Promise<void>;
}
