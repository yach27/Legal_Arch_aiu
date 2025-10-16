import React, { useState } from "react";
import { HiOutlineBell } from "react-icons/hi2"; // Import the bell icon
import { notifications } from "./dummy_notif";

const NotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);
    const maxNotifications = 3;

    return (
        <div className="relative ">
            <button
                className={`relative p-2 rounded-4xl transition-colors ml-2  ${
                    isOpen
                        ? "bg-blue-900 text-white"
                        : "bg-transparent text-black"
                }`}
                title="Notifications"
                onClick={() => setIsOpen(!isOpen)}
            >
                <HiOutlineBell size={25} />{" "}
                {/* Bell icon with the same size as in Message */}
            </button>

            {isOpen && (
                <div className="absolute right-0 sm:w-80 w-[65vw] max-w-xs bg-white text-black rounded-lg shadow-lg border border-gray-200  max-h-96 overflow-y-auto p-4 z-[30]">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-300">
                        <span className="font-medium">Notifications</span>
                        <button className="text-sm text-blue-600 hover:underline">
                            Mark all as Read
                        </button>
                    </div>

                    <div>
                        {(showAll
                            ? notifications
                            : notifications.slice(0, maxNotifications)
                        ).map((notif, index) => (
                            <div
                                key={index}
                                className="relative flex items-start gap-3 p-2 rounded-lg transition-all duration-300 cursor-pointer"
                                onClick={() =>
                                    setExpandedIndex(
                                        expandedIndex === index ? null : index,
                                    )
                                }
                            >
                                <img
                                    src={notif.avatar}
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium text-black">
                                            {notif.name}
                                        </p>
                                        <span className="text-xs text-gray-500">
                                            {notif.time}
                                        </span>
                                    </div>
                                    {expandedIndex === index ? (
                                        <div>
                                            <p className="text-sm text-gray-600 break-words">
                                                {notif.message}
                                            </p>
                                            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                                <button className="text-blue-600 hover:underline">
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-600 overflow-hidden text-ellipsis whitespace-nowrap">
                                            {notif.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        className="block w-full text-center text-blue-600 text-sm py-3 hover:underline"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? "Show Less" : "Show More"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
