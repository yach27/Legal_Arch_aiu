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
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg">
            <img src={image} alt={title} className="w-full h-52 object-cover" />
            <div className="p-6 flex flex-col justify-between h-full">
                <div>
                    <h2 className="text-xl font-bold text-[#003A18] leading-snug">
                        {title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">By: {author}</span> |{" "}
                        {date}
                    </p>
                </div>

                <article className="text-gray-700 text-sm leading-relaxed mt-4 space-y-4 text-justify">
                    {content.map((para, index) =>
                        para.startsWith('"') ? (
                            <blockquote
                                key={index}
                                className="pl-4 border-l-4 border-[#003A18] text-gray-600 italic"
                            >
                                {para}
                            </blockquote>
                        ) : (
                            <p key={index}>{para}</p>
                        ),
                    )}

                    {features.length > 0 && (
                        <div className="bg-[#f1f8f5] p-4 rounded-md border border-[#cce5da]">
                            <h3 className="font-semibold text-[#003A18] mb-1 text-sm">
                                Key Features:
                            </h3>
                            <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
                                {features.map((feature, i) => (
                                    <li key={i}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {quote && (
                        <blockquote className="pl-4 border-l-4 border-[#003A18] text-gray-600 italic">
                            {quote}
                        </blockquote>
                    )}
                </article>
            </div>
        </div>
    );
};

export default NewsCard;
