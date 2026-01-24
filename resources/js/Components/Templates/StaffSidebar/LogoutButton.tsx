import { FC } from "react";
import { Link } from "@inertiajs/react";

interface LogoutButtonProps {
    collapsed?: boolean;
}

const LogoutButton: FC<LogoutButtonProps> = ({ collapsed }) => {
    return (
        <Link
            href="/logout"
            method="post"
            as="button"
            className={`
                flex items-center transition-all duration-200 relative group
                ${collapsed
                    ? "justify-center p-2 rounded-lg mx-auto"
                    : "gap-3 px-4 py-2.5 rounded-lg w-full"
                }
                text-gray-700 hover:bg-green-50 hover:text-green-600
            `}
            title={collapsed ? "Log out" : undefined}
        >
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
            </svg>
            {!collapsed && (
                <span className="font-medium">Log out</span>
            )}

            {/* Tooltip for collapsed state */}
            {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    Log out
                </div>
            )}
        </Link>
    );
};

export default LogoutButton;
