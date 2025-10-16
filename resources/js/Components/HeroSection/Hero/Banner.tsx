import React from "react";
import LeftBanner from "./LeftBanner";
import RightBanner from "./RightBanner";

interface BannerProps {
    onLoginClick: () => void;
}

const Banner: React.FC<BannerProps> = ({ onLoginClick }) => {
    return (
        <section
            id="home"
            className="w-full pt-15 pb-20 flex flex-col gap-10 xl:gap-0 lg:flex-row items-center border-b border-gray-200 min-h-[500px]"
            style={{
                display: '-webkit-box',
                display: '-ms-flexbox',
                display: 'flex'
            }}
        >
            <LeftBanner onLoginClick={onLoginClick} /> {/* 👈 THIS is key */}
            <RightBanner />
        </section>
    );
};

export default Banner;
