// Components/ProfileDropdown/ProfileMenu.tsx
import React, { useState } from "react";
import { router } from "@inertiajs/react";
import UserInfoHeader from "./UserInfoHeader";
import MenuItem from "./MenuItem";
import { SettingsIcon, UserIcon } from "lucide-react";
import { LogoutIcon } from "./Icons";
import { ProfileMenuProps } from "../../../../Types/profile_types";

const ProfileMenu: React.FC<ProfileMenuProps> = ({
    userData,
    onViewProfile,
    onSettings,
    onLogout, // This prop is now optional since we handle logout internally
}) => {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
        // Get the stored token
        const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
        
        const response = await fetch("/api/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                // Add the Bearer token for Sanctum authentication
                ...(token && { "Authorization": `Bearer ${token}` }),
                // You can remove CSRF token for API routes with Sanctum
                // "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
            },
        });

        const data = await response.json();

        if (data.success) {
            // Clear all stored authentication data
            sessionStorage.removeItem("currentUser");
            sessionStorage.removeItem("adminLoaded");
            sessionStorage.removeItem("tenantLoaded");
            sessionStorage.removeItem("auth_token");
            localStorage.removeItem("auth_token");

            console.log("Logout successful, redirecting to home...");

            // Call the onLogout prop if provided (for cleanup)
            if (onLogout) {
                onLogout();
            }

            // Redirect to home page
            router.visit("/");
        } else {
            console.error("Logout failed:", data.message);
            // Force redirect anyway and clear tokens
            sessionStorage.removeItem("auth_token");
            localStorage.removeItem("auth_token");
            router.visit("/");
        }
    } catch (error) {
        console.error("Logout error:", error);
        // Force redirect anyway and clear tokens
        sessionStorage.removeItem("auth_token");
        localStorage.removeItem("auth_token");
        router.visit("/");
    } finally {
        setIsLoggingOut(false);
    }
};

    // Conditional handlers to prevent actions during logout
    const handleViewProfile = () => {
        if (!isLoggingOut) {
            onViewProfile();
        }
    };

    const handleSettings = () => {
        if (!isLoggingOut) {
            onSettings();
        }
    };

    return (
        <div
            className={`absolute right-0 top-full bg-white rounded-lg shadow-lg w-64 p-2 mt-2 border border-gray-200 z-[10000] ${isLoggingOut ? "pointer-events-none opacity-75" : ""}`}
        >
            {/* User Info Header */}
            <UserInfoHeader userData={userData} />

            {/* Menu Items */}
            <ul className="space-y-1">
                {/* View Profile */}
                <li>
                    <MenuItem
                        icon={<UserIcon />}
                        label="View Profile"
                        onClick={handleViewProfile}
                    />
                </li>

                {/* Settings */}
                <li>
                    <MenuItem
                        icon={<SettingsIcon />}
                        label="Settings"
                        onClick={handleSettings}
                    />
                </li>

                {/* Divider */}
                <li className="border-t border-gray-100 my-2"></li>

                {/* Logout */}
                <li>
                    <MenuItem
                        icon={<LogoutIcon />}
                        label={isLoggingOut ? "Logging out..." : "Logout"}
                        onClick={handleLogout}
                        // variant="danger"
                    />
                </li>
            </ul>
        </div>
    );
};

export default ProfileMenu;
