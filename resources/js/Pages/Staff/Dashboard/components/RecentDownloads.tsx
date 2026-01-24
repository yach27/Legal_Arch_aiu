import { FC } from 'react';
import { Download, Clock, User, ArrowUpRight } from 'lucide-react';

interface RecentDownload {
    id: number;
    title: string;
    timestamp: string;
    date: string;
    downloaded_by: string;
}

interface RecentDownloadsProps {
    downloads: RecentDownload[];
}

const RecentDownloads: FC<RecentDownloadsProps> = ({ downloads }) => {
    return (
        <div className="relative bg-white rounded-3xl shadow-lg border border-gray-100/50 p-6 overflow-hidden group/card hover:shadow-2xl transition-all duration-500">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 blur-lg opacity-30"></div>
                        <div className="relative p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                            <Download className="w-6 h-6 text-green-600" strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight"
                            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}>
                            Recent Downloads
                        </h3>
                        <p className="text-xs text-gray-500 font-medium tracking-wide mt-0.5">
                            Latest downloaded files
                        </p>
                    </div>
                </div>

                {/* Downloads List */}
                <div className="space-y-2.5">
                    {downloads.length > 0 ? (
                        downloads.map((download, index) => (
                            <div
                                key={download.id}
                                className="group relative flex items-center justify-between p-4 bg-gradient-to-br from-gray-50/80 to-white rounded-2xl hover:from-green-50/50 hover:to-green-50/30 transition-all duration-400 border border-gray-100/80 hover:border-green-200/60 hover:shadow-md cursor-pointer overflow-hidden"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Hover gradient effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>

                                <div className="flex-1 min-w-0 flex items-center gap-3.5 relative z-10">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-gray-100">
                                        <Download className="w-4 h-4 text-green-600 group-hover:text-green-700 transition-colors" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate group-hover:text-green-700 transition-colors mb-1"
                                           style={{ fontFamily: "'Inter', sans-serif" }}>
                                            {download.title}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-gray-400" strokeWidth={2.5} />
                                            <p className="text-xs text-gray-600 font-medium">{download.downloaded_by}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 ml-3 flex-shrink-0 relative z-10">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100/80 group-hover:bg-green-100/80 rounded-lg transition-colors duration-300">
                                        <Clock className="w-3.5 h-3.5 text-gray-500 group-hover:text-green-600" strokeWidth={2.5} />
                                        <span className="text-xs font-semibold text-gray-600 group-hover:text-green-700 transition-colors">
                                            {download.timestamp}
                                        </span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" strokeWidth={2.5} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <div className="relative inline-flex items-center justify-center mb-4">
                                <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-40"></div>
                                <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                    <Download className="w-10 h-10 text-gray-400" strokeWidth={2} />
                                </div>
                            </div>
                            <p className="text-gray-700 font-bold text-base mb-1">No recent downloads</p>
                            <p className="text-sm text-gray-500 font-medium">Files you download will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecentDownloads;
