import { FC, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface CalendarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Calendar: FC<CalendarProps> = ({ isOpen, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    if (!isOpen) return null;

    const today = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Get first day of the month and number of days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    // Month names
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Day names
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Generate calendar days
    const calendarDays = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    const isToday = (day: number) => {
        return (
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear()
        );
    };

    const modalContent = (
        <div
            className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 backdrop-blur-sm"
            style={{ margin: 0, padding: 0 }}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.25) 100%)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 10px 40px 0 rgba(100, 116, 139, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.3)'
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4 border-b border-white/30 pb-3">
                    <h2 className="text-xl font-semibold text-white/90">
                        {monthNames[currentMonth]} {currentYear}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white/90 hover:bg-white/20 p-1 rounded-lg transition-all text-xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2 rounded-full transition-all hover:bg-white/20"
                    >
                        <ChevronLeft size={20} className="text-white/80" />
                    </button>

                    <div className="text-lg font-medium text-white/90">
                        {monthNames[currentMonth]} {currentYear}
                    </div>

                    <button
                        onClick={() => navigateMonth('next')}
                        className="p-2 rounded-full transition-all hover:bg-white/20"
                    >
                        <ChevronRight size={20} className="text-white/80" />
                    </button>
                </div>

                {/* Days of week header */}
                <div className="grid grid-cols-7 mb-2">
                    {dayNames.map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-white/75 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                        <div key={index} className="h-10 flex items-center justify-center">
                            {day && (
                                <button
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                        transition-all
                                        ${isToday(day)
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg'
                                            : 'text-white/85 hover:bg-white/20 hover:text-white/95'
                                        }
                                    `}
                                >
                                    {day}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Today's date highlight */}
                <div className="mt-4 pt-4 border-t border-white/30">
                    <div className="text-center text-sm text-white/85 font-medium">
                        Today: {today.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    // Render modal using portal to bypass parent overflow constraints
    return createPortal(modalContent, document.body);
};

export default Calendar;