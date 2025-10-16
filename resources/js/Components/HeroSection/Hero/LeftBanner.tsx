import { useState } from "react";
import { useTypewriter, Cursor } from "react-simple-typewriter";

interface NavbarProps {
    onLoginClick: () => void;
}
const LeftBanner: React.FC<NavbarProps> = ({ onLoginClick }) => {
    const [showMenu, setShowMenu] = useState(false);

    const [text] = useTypewriter({
        words: [
            "Central Mindanao University",
            "University Legal Counsel .",
            "Management System.",
        ],
        loop: true,
        typeSpeed: 20,
        deleteSpeed: 10,
        delaySpeed: 2000,
    });
    return (
        <div className="w-full lg:w-1/2 flex flex-col gap-8 px-6 lg:px-12">
            <div className="flex flex-col gap-6">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-[#003a18] leading-tight">
                    Legal Document Management & Retrieval System
                </h1>
                <h2 className="text-3xl font-bold text-gray-500">
                    <span>{text}</span>
                    <Cursor
                        cursorBlinking={false}
                        cursorStyle="|"
                        cursorColor="#ff014f"
                    />
                </h2>
                <p className="text-base lg:text-lg text-gray-600 leading-relaxed">
                    A secure and efficient system designed for archiving and
                    retrieving legal reports and documents, ensuring organized
                    storage and quick access for legal offices.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => {
                        setShowMenu(false);
                        onLoginClick();
                    }}
                    className="bg-[#003A18] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#ffc600] hover:text-black transition-colors"
                >
                    GET STARTED
                </button>
            </div>
        </div>
    );
};

export default LeftBanner;
