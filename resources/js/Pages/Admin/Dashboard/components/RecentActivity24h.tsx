import React from "react";
import { Activity as ActivityIcon } from "lucide-react";

interface Activity {
    action: string;
    document: string;
    user: string;
    time: string;
}

interface RecentActivity24hProps {
    activities: Activity[];
}

const RecentActivity24h: React.FC<RecentActivity24hProps> = ({ activities }) => {
    // Filter activities from last 24 hours
    const getLast24HourActivities = () => {
        return activities.filter(activity => {
            // Parse the time string - assuming format like "2 hours ago", "10 minutes ago", etc.
            const timeStr = activity.time.toLowerCase();
            
            if (timeStr.includes('minute') || timeStr.includes('hour')) {
                // These are definitely within 24 hours
                return true;
            }
            
            // If it shows a day, check if it's within 24 hours
            if (timeStr.includes('day')) {
                const dayMatch = timeStr.match(/(\d+)\s*day/);
                if (dayMatch) {
                    const daysAgo = parseInt(dayMatch[1]);
                    return daysAgo === 1; // Only same day or previous day
                }
            }
            
            return true; // Include if unable to parse but assume recent
        });
    };

    const last24HourActivities = getLast24HourActivities();

    return (
        <div
            className="rounded-3xl p-6 border border-green-700/30 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)' }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-green-900/50 rounded-lg">
                    <ActivityIcon className="w-5 h-5 text-green-300" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                    <p className="text-xs text-gray-300">Last 24 hours</p>
                </div>
            </div>

            {/* Activities List */}
            {last24HourActivities.length > 0 ? (
                <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-2">
                    {last24HourActivities.map((activity, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-green-900/20 border border-green-700/30 hover:bg-green-900/40 transition-all duration-200"
                        >
                            <div className="w-2 h-2 mt-1.5 rounded-full bg-green-400 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white">{activity.action}</p>
                                {activity.document && (
                                    <p className="text-xs text-gray-300 truncate mt-0.5">{activity.document}</p>
                                )}
                                <div className="flex items-center justify-between gap-2 mt-1">
                                    <p className="text-xs text-gray-400">by {activity.user}</p>
                                    <span className="text-xs text-gray-500">{activity.time}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-8 text-center">
                    <p className="text-gray-300 text-sm">No activities in the last 24 hours</p>
                </div>
            )}
        </div>
    );
};

export default RecentActivity24h;
