import { useTypewriter, Cursor } from "react-simple-typewriter";

interface NavbarProps {
    onLoginClick: () => void;
}
const LeftBanner: React.FC<NavbarProps> = ({ onLoginClick }) => {

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
        <div className="w-full lg:w-1/2 flex flex-col gap-8 animate-fade-in">
            {/* Glass Card Container */}
            <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl">
                <div className="flex flex-col gap-6">
                    <h1 className="text-4xl lg:text-6xl font-extrabold bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">
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

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button
                        onClick={onLoginClick}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold hover:from-green-600 hover:to-emerald-700 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg"
                    >
                        GET STARTED
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeftBanner;
