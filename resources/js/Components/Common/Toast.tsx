import React, { useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
    type: ToastType;
    message: string;
    title?: string;
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({
    type,
    message,
    title,
    isVisible,
    onClose,
    duration = 3000,
}) => {
    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const config = {
        success: {
            icon: CheckCircle,
            bgColor: "bg-gradient-to-r from-green-500 to-emerald-600",
            iconColor: "text-white",
            borderColor: "border-green-300",
            defaultTitle: "Success",
        },
        error: {
            icon: XCircle,
            bgColor: "bg-gradient-to-r from-red-500 to-red-600",
            iconColor: "text-white",
            borderColor: "border-red-300",
            defaultTitle: "Error",
        },
        warning: {
            icon: AlertCircle,
            bgColor: "bg-gradient-to-r from-yellow-500 to-orange-600",
            iconColor: "text-white",
            borderColor: "border-yellow-300",
            defaultTitle: "Warning",
        },
        info: {
            icon: Info,
            bgColor: "bg-gradient-to-r from-blue-500 to-blue-600",
            iconColor: "text-white",
            borderColor: "border-blue-300",
            defaultTitle: "Information",
        },
    };

    const { icon: Icon, bgColor, iconColor, borderColor, defaultTitle } = config[type];

    return (
        <div className="fixed top-6 right-6 z-[99999] animate-slide-in-right">
            <div
                className={`${bgColor} rounded-2xl shadow-2xl border-2 ${borderColor} backdrop-blur-sm min-w-[320px] max-w-md overflow-hidden transform transition-all duration-300 hover:scale-105`}
            >
                <div className="p-5">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0">
                            <div className="bg-white/20 backdrop-blur-md rounded-full p-2">
                                <Icon className={`w-6 h-6 ${iconColor}`} />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-0.5">
                            <h3 className="text-white font-bold text-lg mb-1">
                                {title || defaultTitle}
                            </h3>
                            <p className="text-white/95 text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-all duration-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                {duration > 0 && (
                    <div className="h-1 bg-white/20">
                        <div
                            className="h-full bg-white/60 animate-progress"
                            style={{
                                animationDuration: `${duration}ms`,
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Toast;
