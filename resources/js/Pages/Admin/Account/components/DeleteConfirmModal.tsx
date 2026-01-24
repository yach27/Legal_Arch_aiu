import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface User {
    user_id: number;
    firstname: string;
    lastname: string;
    email: string;
}

interface DeleteConfirmModalProps {
    isOpen: boolean;
    user: User;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    user,
    onClose,
    onConfirm,
}) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Delete User</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Warning Icon */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                    </div>

                    {/* Message */}
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Are you sure?
                        </h3>
                        <p className="text-gray-600 text-sm">
                            You are about to delete the user account:
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="font-semibold text-gray-900">
                                {user.firstname} {user.lastname}
                            </p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">
                            <strong>Warning:</strong> This action cannot be undone. All user data and activity logs will be permanently deleted.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Deleting..." : "Delete User"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
