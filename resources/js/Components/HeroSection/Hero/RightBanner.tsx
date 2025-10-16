import React from "react";
import bannerImg from "./hero.jpg";

const RightBanner = () => {
    return (
        <div className="w-full lg:w-1/2 flex justify-end items-center relative">
            <img
                className="w-full h-full lg:w-[700px] lg:h-[480px] object-cover z-10"
                src={bannerImg}
                alt="bannerImg"
            />
        </div>
    );
};

export default RightBanner;
