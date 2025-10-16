// Components/ProfileDropdown/index.tsx
import React, { useState, useEffect } from "react";
import ProfileTrigger from "./ProfileTrigger";
import ProfileMenu from "./ProfileMenu";
import ViewProfileModal from "./ViewProfileModal";
import { UserData } from "../../../../Types/profile_types";

const ProfileDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    // Load real user data from sessionStorage or API on component mount
    useEffect(() => {
        const loadUserData = async () => {
            try {
                // First try to get user data from sessionStorage
                const storedUser = sessionStorage.getItem("currentUser");

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);

                    // Transform the user data to match UserData interface
                    const transformedUser: UserData = {
                        id: parsedUser.user_id || parsedUser.id,
                        name: `${parsedUser.firstname} ${parsedUser.lastname}`,
                        email: parsedUser.email,
                        role: parsedUser.role || "Admin",
                        avatar: parsedUser.avatar || null,
                    };

                    setUserData(transformedUser);
                } else {
                    // If not in sessionStorage, fetch from API
                    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');

                    const response = await fetch('/api/user', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            ...(token && { 'Authorization': `Bearer ${token}` }),
                        },
                    });

                    if (response.ok) {
                        const apiUser = await response.json();

                        // Transform API response to UserData
                        const transformedUser: UserData = {
                            id: apiUser.user_id || apiUser.id,
                            name: `${apiUser.firstname} ${apiUser.lastname}`,
                            email: apiUser.email,
                            role: apiUser.role || "Admin",
                            avatar: apiUser.avatar || null,
                        };

                        setUserData(transformedUser);

                        // Store in sessionStorage for future use
                        sessionStorage.setItem("currentUser", JSON.stringify(apiUser));
                    }
                }
            } catch (error) {
                console.error("Error loading user data:", error);
            }
        };

        loadUserData();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(".profile-dropdown")) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleViewProfile = async () => {
        try {
            setIsOpen(false);

            // Fetch user profile data from the backend
            const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');

            const response = await fetch('/api/user/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });

            const data = await response.json();

            if (data.success && data.user) {
                setProfileData(data.user);
                setIsProfileModalOpen(true);
            } else {
                console.error('Failed to fetch user profile:', data.message);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleSettings = () => {
        try {
            setIsOpen(false);

            // Navigate to appropriate settings page based on user role
            if (userData?.role === "Admin") {
                console.log("Navigating to admin settings...");
                // router.visit("/admin/settings");
            } else {
                console.log("Navigating to tenant settings...");
                // router.visit("/tenant/settings");
            }
        } catch (error) {
            console.error("Error navigating to settings:", error);
        }
    };

    const handleLogout = () => {
        try {
            console.log("User logged out successfully");
            setIsOpen(false);

            // For now, just log the logout action
            console.log("Logout clicked - would redirect to home");
            // router.visit("/");
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    // Don't render if no user data
    if (!userData) {
        return null;
    }

    return (
        <>
            <div className="relative profile-dropdown z-[9999]">
                <ProfileTrigger
                    userData={userData}
                    isOpen={isOpen}
                    onClick={() => setIsOpen(!isOpen)}
                />

                {isOpen && (
                    <ProfileMenu
                        userData={userData}
                        onViewProfile={handleViewProfile}
                        onSettings={handleSettings}
                        onLogout={handleLogout}
                    />
                )}
            </div>

            {/* View Profile Modal */}
            <ViewProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userData={profileData}
            />
        </>
    );
};

export default ProfileDropdown;
