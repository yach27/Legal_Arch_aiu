// Components/ProfileDropdown/MenuItem.tsx
import React from "react";
import { MenuItemProps } from "../../../../Types/profile_types";

const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    label,
    onClick,
    variant = "default",
}) => {
    const getHoverClasses = () => {
        switch (variant) {
            case "danger":
                return "hover:text-white hover:bg-x";
            default:
                return "hover:text-black hover:bg-gray-50";
        }
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center text-gray-700 ${getHoverClasses()} w-full py-2 px-4 rounded-lg transition-all ease-in-out duration-200`}
        >
            {icon}
            <span className="ml-3 text-sm">{label}</span>
        </button>
    );
};

export default MenuItem;
