import { FC, useContext } from "react";
import { Link, usePage } from "@inertiajs/react";
import { DashboardContext } from "../../../Context/DashboardContext";
import { navLinksData } from "./NavLink";
import Brand from "./brand";

const Sidebar: FC = () => {
    const dashboardContext = useContext(DashboardContext);
    const collapsed = dashboardContext?.collapse;
    const { url } = usePage();

    const isActive = (path: string) => {
        // Remove query parameters for comparison
        const currentPath = url.split('?')[0];
        return currentPath === path || currentPath.startsWith(path + "/");
    };

    return (
        <div
            className={`h-screen bg-gray-200 text-black transition-all duration-300 ${
                collapsed ? "w-20" : "w-64"
            }`}
        >
            {/* Brand Logo */}
            <div className={`flex justify-center items-center transition-all duration-300 ${
                collapsed ? "py-6" : "py-4 px-4"
            }`}>
                <Brand
                    height={collapsed ? 40 : 60}
                    width={collapsed ? 40 : 150}
                    type={1}
                />
            </div>

            {/* Sidebar Links */}
            <ul className={`space-y-2 transition-all duration-300 ${
                collapsed ? "px-2 mt-8" : "px-4 mt-6"
            }`}>
                {navLinksData.map((item, index) => {
                    const active = isActive(item.path);
                    return (
                        <li key={item.title}>
                            <Link
                                href={item.path}
                                className={`
                                    flex items-center transition-all duration-200 relative group
                                    ${collapsed 
                                        ? "justify-center p-3 rounded-lg mx-auto w-12 h-12" 
                                        : "gap-4 p-3 rounded-xl"
                                    }
                                    ${
                                        active
                                            ? "bg-[#003A18] text-white shadow-md"
                                            : "bg-transparent text-gray-700 hover:bg-[#FFD700] hover:text-black"
                                    }
                                `}
                                title={collapsed ? item.title : undefined}
                            >
                                {/* Icon */}
                                <span className={`transition-all duration-200 ${
                                    collapsed ? "text-xl" : "text-lg"
                                }`}>
                                    {item.icon}
                                </span>
                                
                                {/* Title - hidden when collapsed */}
                                {!collapsed && (
                                    <span className="font-medium transition-all duration-200">
                                        {item.title}
                                    </span>
                                )}

                                {/* Active indicator - different styles for collapsed/expanded */}
                                {active && (
                                    <>
                                        {collapsed ? (
                                            // Small dot indicator for collapsed state
                                            <span className="absolute -right-1 top-1 w-2 h-2 bg-[#FFD700] rounded-full" />
                                        ) : (
                                            // Left border for expanded state
                                            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[#FFD700]" />
                                        )}
                                    </>
                                )}

                                {/* Tooltip for collapsed state */}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                                        {item.title}
                                        <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                                    </div>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {/* Optional: Add some spacing at bottom */}
            {collapsed && (
                <div className="mt-8 px-2">
                    <div className="h-px bg-gray-300 opacity-50"></div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;