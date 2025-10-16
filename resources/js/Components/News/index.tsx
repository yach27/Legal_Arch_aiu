import React from "react";
import { newsData } from "./newsData";
import NewsCard from "./NewsCard";

const News: React.FC = () => {
    return (
        <section
            id="news"
            className="w-full py-10 px-6 lg:px-10 bg-white border-b border-gray-200"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-10">
                {newsData.map((item) => (
                    <NewsCard
                        key={item.id}
                        title={item.title}
                        author={item.author}
                        date={item.date}
                        image={item.image}
                        content={item.content}
                        features={item.features}
                        quote={item.quote}
                    />
                ))}
            </div>
        </section>
    );
};

export default News;
