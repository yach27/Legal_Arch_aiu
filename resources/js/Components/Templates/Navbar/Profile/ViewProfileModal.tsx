import React from "react";
import { User, Mail, Calendar, Shield, X } from "lucide-react";

interface UserData {
    user_id: number;
    firstname: string;
    lastname: string;
    middle_name?: string;
    email: string;
    created_at: string;
    updated_at: string;
}

interface ViewProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: UserData | null;
}

const ViewProfileModal: React.FC<ViewProfileModalProps> = ({
    isOpen,
    onClose,
    userData,
}) => {
    if (!isOpen || !userData) return null;

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getFullName = (): string => {
        const parts = [
            userData.firstname,
            userData.middle_name,
            userData.lastname,
        ].filter(Boolean);
        return parts.join(" ");
    };

    const getInitials = (): string => {
        const first = userData.firstname?.charAt(0) || "";
        const last = userData.lastname?.charAt(0) || "";
        return (first + last).toUpperCase();
    };

    return (
        <div
            className="fixed inset-0 flex items-center justify-center z-[99999] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            style={{ pointerEvents: 'auto' }}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden ml-64"
                onClick={(e) => e.stopPropagation()}
                style={{ marginLeft: "16rem" }}
            >
                {/* Header with Gradient Background */}
                <div className="relative bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 px-8 py-12">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Profile Picture and Name */}
                    <div className="flex flex-col items-center">
                        <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center text-white text-4xl font-bold shadow-xl mb-4 border-4 border-white/30">
                            {getInitials()}
                        </div>
                        <h2 className="text-3xl font-bold text-white text-center mb-2">
                            {getFullName()}
                        </h2>
                        <p className="text-white/90 text-sm font-medium">
                            {userData.email}
                        </p>
                        <div className="mt-3 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
                            <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" />
                                User ID: #{userData.user_id}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-8 py-6 max-h-[50vh] overflow-y-auto">
                    {/* Personal Information Card */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <User className="w-4 h-4 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Personal Information
                            </h3>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        First Name
                                    </label>
                                    <p className="text-base text-gray-900 font-medium mt-1">
                                        {userData.firstname}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Last Name
                                    </label>
                                    <p className="text-base text-gray-900 font-medium mt-1">
                                        {userData.lastname}
                                    </p>
                                </div>
                            </div>

                            {userData.middle_name && (
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Middle Name
                                    </label>
                                    <p className="text-base text-gray-900 font-medium mt-1">
                                        {userData.middle_name}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Mail className="w-4 h-4 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Contact Information
                            </h3>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Email Address
                            </label>
                            <p className="text-base text-gray-900 font-medium mt-1 break-all">
                                {userData.email}
                            </p>
                        </div>
                    </div>

                    {/* Account Timeline Card */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Calendar className="w-4 h-4 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">
                                Account Timeline
                            </h3>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Account Created
                                    </label>
                                    <p className="text-base text-gray-900 font-medium mt-1">
                                        {formatDate(userData.created_at)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Last Updated
                                    </label>
                                    <p className="text-base text-gray-900 font-medium mt-1">
                                        {formatDate(userData.updated_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-center py-4">
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 border-2 border-green-200 rounded-full">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-green-700">
                                Account Active
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewProfileModal;
