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
            className="w-full pt-20 pb-24 flex flex-col gap-10 xl:gap-0 lg:flex-row items-center min-h-[600px] px-6 lg:px-12"
        >
            <LeftBanner onLoginClick={onLoginClick} /> {/* 👈 THIS is key */}
            <RightBanner />
        </section>
    );
};

export default Banner;
