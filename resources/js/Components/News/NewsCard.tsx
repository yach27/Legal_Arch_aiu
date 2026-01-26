import { motion } from "framer-motion";
import React from "react";

interface NewsProps {
    title: string;
    author: string;
    date: string;
    image: string;
    content?: string[]; // optional now
    features?: string[]; // optional now
    quote?: string;
}

const NewsCard: React.FC<NewsProps> = ({
    title,
    author,
    date,
    image,
    content = [],
    features = [],
    quote = "",
}) => {
    return (
        <motion.div
            whileHover={{ y: -12 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-gray-100 overflow-hidden flex flex-col group cursor-pointer hover:shadow-[0_32px_70px_rgba(27,94,32,0.12)]"
        >
            <div className="relative overflow-hidden h-64">
                <motion.img
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.7 }}
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-6 left-6 bg-yellow-500 px-4 py-2 rounded-xl text-xs font-black text-green-950 shadow-sm border border-yellow-400">
                    LEGAL NEWS
                </div>
            </div>

            <div className="p-8 flex flex-col justify-between flex-1">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-green-800 transition-colors duration-300">
                        {title}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-4 font-semibold uppercase tracking-wider">
                        <span>{author}</span>
                        <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"></span>
                        <span>{date}</span>
                    </div>
                </div>

                <article className="text-gray-500 text-lg leading-relaxed mt-6 space-y-4">
                    {content.slice(0, 1).map((para, index) => (
                        <p key={index} className="line-clamp-3">{para}</p>
                    ))}

                    {features.length > 0 && (
                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 mt-6 group-hover:bg-yellow-50 group-hover:border-yellow-100 transition-colors duration-500">
                            <h3 className="font-black text-gray-900 mb-3 text-base flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-yellow-500 rounded-full"></span>
                                HIGHLIGHTS
                            </h3>
                            <ul className="space-y-2">
                                {features.slice(0, 3).map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 font-bold">
                                        <span className="text-yellow-600 mt-1">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </article>

                <div className="mt-8 flex items-center gap-2 text-green-800 font-black uppercase tracking-widest text-xs group-hover:gap-4 transition-all">
                    Read More
                    <span className="text-lg text-yellow-600">→</span>
                </div>
            </div>
        </motion.div>
    );
};

export default NewsCard;
