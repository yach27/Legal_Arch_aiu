import React from "react";

interface Activity {
    action: string;
    document: string;
    user: string;
    time: string;
}

interface ActivityLogItemProps {
    activity: Activity;
}

const ActivityLogItem: React.FC<ActivityLogItemProps> = ({ activity }) => {
    return (
        <div className="p-4 hover:bg-white/5 transition-all duration-200">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <div className="w-2 h-2 mt-2 rounded-full shadow-sm" style={{ background: '#FBEC5D' }}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white mb-1">{activity.action}</p>
                            {activity.document && (
                                <p className="text-sm text-white/80 truncate mb-1 font-normal">
                                    {activity.document}
                                </p>
                            )}
                            <p className="text-xs text-white/60 font-normal">by {activity.user}</p>
                        </div>
                        <span className="text-xs text-white/50 whitespace-nowrap font-normal">
                            {activity.time}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogItem;
