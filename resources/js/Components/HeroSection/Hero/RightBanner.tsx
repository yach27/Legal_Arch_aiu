import React from "react";
import bannerImg from "./hero.jpg";

const RightBanner = () => {
    return (
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end items-center relative p-6 lg:p-0">
            <img
                className="w-full max-w-[500px] lg:max-w-[700px] h-auto object-contain rounded-2xl shadow-2xl"
                src={bannerImg}
                alt="bannerImg"
            />
        </div>
    );
};

export default RightBanner;
