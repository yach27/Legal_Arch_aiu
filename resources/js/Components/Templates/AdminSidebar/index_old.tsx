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
            className={`h-screen relative transition-all duration-300 ${
                collapsed ? "w-20" : "w-64"
            }`}
            style={{
                background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.15) 0%, rgba(71, 85, 105, 0.2) 100%)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRight: '1px solid rgba(100, 116, 139, 0.3)',
                boxShadow: '0 10px 40px 0 rgba(100, 116, 139, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
        >

            {/* Brand Logo */}
            <div className={`relative flex justify-center items-center transition-all duration-300 ${
                collapsed ? "py-6" : "py-4 px-4"
            }`}>
                <Brand
                    height={collapsed ? 40 : 60}
                    width={collapsed ? 40 : 150}
                    type={1}
                />
            </div>

            {/* Sidebar Links */}
            <ul className={`relative space-y-2 transition-all duration-300 ${
                collapsed ? "px-2 mt-8" : "px-4 mt-6"
            }`}>
                {navLinksData.map((item, index) => {
                    const active = isActive(item.path);
                    return (
                        <li key={item.title}>
                            <Link
                                href={item.path}
                                className={`
                                    flex items-center transition-all duration-200 relative group overflow-hidden
                                    ${collapsed
                                        ? "justify-center p-3 rounded-xl mx-auto w-12 h-12"
                                        : "gap-4 p-3 rounded-xl"
                                    }
                                    ${
                                        active
                                            ? "text-white shadow-lg"
                                            : "text-gray-700 hover:shadow-md border border-white/50"
                                    }
                                `}
                                style={active ? {
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                                } : {
                                    background: 'rgba(255, 255, 255, 0.3)',
                                    backdropFilter: 'blur(15px)',
                                    WebkitBackdropFilter: 'blur(15px)',
                                }}
                                title={collapsed ? item.title : undefined}
                            >
                                {/* Hover gradient overlay for inactive links */}
                                {!active && (
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)',
                                            backdropFilter: 'blur(10px)',
                                        }}
                                    />
                                )}

                                {/* Icon */}
                                <span className={`relative z-10 transition-all duration-200 ${
                                    collapsed ? "text-xl" : "text-lg"
                                } ${active ? "drop-shadow-sm" : ""}`}>
                                    {item.icon}
                                </span>

                                {/* Title - hidden when collapsed */}
                                {!collapsed && (
                                    <span className="relative z-10 font-semibold transition-all duration-200">
                                        {item.title}
                                    </span>
                                )}

                                {/* Active indicator - different styles for collapsed/expanded */}
                                {active && (
                                    <>
                                        {collapsed ? (
                                            // Small dot indicator for collapsed state
                                            <span className="absolute -right-1 top-1 w-2 h-2 bg-emerald-400 rounded-full shadow-sm" />
                                        ) : (
                                            // Left border for expanded state
                                            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-white/50" />
                                        )}
                                    </>
                                )}

                                {/* Tooltip for collapsed state */}
                                {collapsed && (
                                    <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                                        {item.title}
                                        <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900/95 rotate-45"></div>
                                    </div>
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {/* Optional: Add some spacing at bottom */}
            {collapsed && (
                <div className="relative mt-8 px-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-emerald-200/50 to-transparent"></div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;