import React from "react";
import { newsData } from "./newsData";
import NewsCard from "./NewsCard";

const News: React.FC = () => {
    return (
        <section
            id="news"
            className="w-full py-20 px-6 lg:px-10 bg-gradient-to-b from-white via-green-50/20 to-white border-b border-green-100"
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
