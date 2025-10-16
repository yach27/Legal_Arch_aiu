// Components/ProfileDropdown/ProfileTrigger.tsx
import React from "react";
import { ProfileTriggerProps } from "../../../../Types/profile_types";

const ProfileTrigger: React.FC<ProfileTriggerProps> = ({
    userData,
    isOpen,
    onClick,
}) => {
    // Dummy profile image URL - replace utility function for now
    const profileImageUrl =
        userData.avatar || `https://i.pravatar.cc/40?u=${userData.email}`;

    return (
        <div
            className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200"
            onClick={onClick}
        >
            {/* Profile Icon */}
            <img
                src={profileImageUrl}
                alt={`${userData.name}'s Profile`}
                className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://i.pravatar.cc/40?u=${userData.email}`;
                }}
            />

            <div className="hidden md:flex flex-col ml-2 text-gray-800">
                <span className="font-semibold text-sm">{userData.name}</span>
                <span className="text-xs text-gray-500">{userData.email}</span>
            </div>

            {/* Dropdown Arrow */}
            <svg
                className={`ml-2 h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </div>
    );
};

export default ProfileTrigger;
