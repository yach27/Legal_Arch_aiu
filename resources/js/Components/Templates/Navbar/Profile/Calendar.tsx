import { FC, useState } from "react";
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-full mx-4 ml-64" style={{ marginLeft: '16rem' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {monthNames[currentMonth]} {currentYear}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronLeft size={20} className="text-gray-600" />
                    </button>
                    
                    <div className="text-lg font-medium text-gray-700">
                        {monthNames[currentMonth]} {currentYear}
                    </div>
                    
                    <button
                        onClick={() => navigateMonth('next')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ChevronRight size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Days of week header */}
                <div className="grid grid-cols-7 mb-2">
                    {dayNames.map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
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
                                        transition-colors hover:bg-blue-100
                                        ${isToday(day) 
                                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                            : 'text-gray-700 hover:text-blue-600'
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
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-center text-sm text-gray-600">
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
};

export default Calendar;