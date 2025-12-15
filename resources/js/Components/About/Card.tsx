import { HiArrowRight } from "react-icons/hi";

// eslint-disable-next-line react/prop-types
const Card = ({ title, des, icon }) => {
    return (
        <div className="w-full px-6 py-10 rounded-2xl bg-gradient-to-br from-green-50 to-white shadow-lg hover:shadow-2xl hover:scale-[1.05] transition-all duration-300 group border border-green-100 hover:border-green-300">
            <div className="flex flex-col h-full justify-between gap-6">
                <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-gradient-to-br from-green-600 to-green-700 text-white text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
                <div className="flex flex-col gap-3">
                    <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                        {title}
                    </h2>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        {des}
                    </p>
                </div>
                <span className="text-2xl text-green-600 mt-2 group-hover:translate-x-2 transition-transform duration-300">
                    <HiArrowRight />
                </span>
            </div>
        </div>
    );
};

export default Card;
