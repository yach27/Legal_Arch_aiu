import { FC, useContext } from "react";
import { Menu } from "lucide-react";

import ProfileDropdown from "./Profile";
import NotificationDropdown from "./notification_dropdown";
import DateTimeDisplay from "./Profile/DateTimeDisplay";

import { DashboardContext } from "../../../Context/DashboardContext";

const Navbar: FC = () => {
    const dashboardContext = useContext(DashboardContext);

    if (!dashboardContext) return null;

    const handleMenuCollapse = () => {
        if (window.innerWidth <= 768) {
            dashboardContext.toggleMobileSidebar();
        } else {
            dashboardContext.handleCollapse();
        }
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white shadow-md w-full z-20">
            <button
                onClick={handleMenuCollapse}
                className="text-black md:text-black hover:text-gray-600"
            >
                <Menu />
            </button>

            <div className="flex items-center space-x-6">
                <DateTimeDisplay />
                <div className="flex items-center space-x-4">
                    <NotificationDropdown />
                    <ProfileDropdown />
                </div>
            </div>
        </div>
    );
};

export default Navbar;