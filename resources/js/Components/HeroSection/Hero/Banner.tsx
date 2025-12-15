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
            className="w-full pt-20 pb-24 flex flex-col gap-10 xl:gap-0 lg:flex-row items-center border-b border-green-100 min-h-[600px] bg-gradient-to-br from-white via-green-50/20 to-white"
        >
            <LeftBanner onLoginClick={onLoginClick} /> {/* 👈 THIS is key */}
            <RightBanner />
        </section>
    );
};

export default Banner;
