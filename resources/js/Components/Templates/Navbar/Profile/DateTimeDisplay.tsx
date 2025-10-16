import { FC, useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import Calendar from "./Calendar";

const DateTimeDisplay: FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000); // Update every second

        return () => clearInterval(timer);
    }, []);

    const formatDay = (date: Date): string => {
        return date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    const toggleCalendar = () => {
        setIsCalendarOpen(!isCalendarOpen);
    };

    const closeCalendar = () => {
        setIsCalendarOpen(false);
    };

    return (
        <>
            <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg border">
                <div className="text-center">
                    <div className="text-lg font-bold text-gray-800 tracking-wide">
                        {formatDay(currentDate)}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                        {formatDate(currentDate)}
                    </div>
                </div>
                <button
                    onClick={toggleCalendar}
                    className="text-gray-500 hover:text-blue-500 transition-colors cursor-pointer"
                >
                    <CalendarIcon size={20} />
                </button>
            </div>
            
            <Calendar isOpen={isCalendarOpen} onClose={closeCalendar} />
        </>
    );
};

export default DateTimeDisplay;