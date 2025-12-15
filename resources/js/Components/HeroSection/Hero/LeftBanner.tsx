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
            "University Legal Counsel.",
            "Management System.",
        ],
        loop: true,
        typeSpeed: 20,
        deleteSpeed: 10,
        delaySpeed: 2000,
    });
    return (
        <div className="w-full lg:w-1/2 flex flex-col gap-8 px-6 lg:px-12 animate-fade-in">
            <div className="flex flex-col gap-6">
                <h1 className="text-4xl lg:text-6xl font-extrabold bg-gradient-to-r from-green-800 via-green-600 to-green-700 bg-clip-text text-transparent leading-tight drop-shadow-lg">
                    Legal Document Management & Retrieval System
                </h1>
                <h2 className="text-2xl lg:text-3xl font-bold text-green-700">
                    <span>{text}</span>
                    <Cursor
                        cursorBlinking={false}
                        cursorStyle="|"
                        cursorColor="#15803d"
                    />
                </h2>
                <p className="text-base lg:text-lg text-gray-700 leading-relaxed">
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
                    className="bg-gradient-to-r from-green-700 to-green-800 text-white px-8 py-4 rounded-xl font-bold hover:from-green-800 hover:to-green-900 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                    GET STARTED
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
            </div>
        </div>
    );
};

export default LeftBanner;
