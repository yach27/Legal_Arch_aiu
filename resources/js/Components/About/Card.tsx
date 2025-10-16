import { HiArrowRight } from "react-icons/hi";

// eslint-disable-next-line react/prop-types
const Card = ({ title, des, icon }) => {
    return (
        <div className="w-full px-6 py-10 rounded-2xl bg-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
            <div className="flex flex-col h-full justify-between gap-6">
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[#003A18]/10 text-[#003A18] text-3xl">
                    {icon}
                </div>
                <div className="flex flex-col gap-3">
                    <h2 className="text-xl md:text-2xl font-semibold text-[#003A18]">
                        {title}
                    </h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        {des}
                    </p>
                </div>
                <span className="text-2xl text-[#003A18] mt-2 group-hover:translate-x-2 transition-transform duration-300">
                    <HiArrowRight />
                </span>
            </div>
        </div>
    );
};

export default Card;
