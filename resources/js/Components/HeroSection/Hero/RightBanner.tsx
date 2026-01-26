import { motion } from "framer-motion";
import bannerImg from "./hero.jpg";

const RightBanner = () => {
    return (
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end items-center relative p-6 lg:p-0">
            <motion.img
                initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="w-full max-w-[500px] lg:max-w-[700px] h-auto object-contain rounded-[3rem] shadow-[0_20px_60px_rgba(27,94,32,0.15)] border border-gray-100"
                src={bannerImg}
                alt="bannerImg"
            />
        </div>
    );
};

export default RightBanner;
