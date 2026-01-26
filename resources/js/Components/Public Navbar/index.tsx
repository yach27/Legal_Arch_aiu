import { useState } from "react";
import { Link } from "react-scroll";
import { FiMenu } from "react-icons/fi";
import { MdClose } from "react-icons/md";
// import logo from "../../../images/logo.png";

interface NavbarProps {
    onLoginClick: () => void;
    onRegisterClick: () => void;
}

export const navLinksdata = [
    { _id: 1001, title: "Home", link: "home" },
    { _id: 1002, title: "About", link: "about" },
    { _id: 1003, title: "News", link: "news" },
    { _id: 1004, title: "Contact", link: "contact" },
];

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onRegisterClick }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm px-4 lg:px-10 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
                {/* <img src={logo} alt="logo" className="w-10 h-10" /> */}
                <h1 className="text-xl font-black text-green-900 tracking-tight">
                    CMU Legal <span className="text-yellow-600">Archiving</span>
                </h1>
            </div>

            <ul className="hidden lg:flex space-x-10 text-sm font-bold justify-center uppercase tracking-widest">
                {navLinksdata.map((item) => (
                    <li key={item._id}>
                        <Link
                            to={item.link}
                            spy={true}
                            smooth={true}
                            offset={-70}
                            duration={500}
                            activeClass="active-link"
                            className="cursor-pointer text-gray-500 hover:text-green-800 transition-all duration-300 hover:scale-105 inline-block"
                        >
                            {item.title}
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-4">
                <button
                    onClick={onLoginClick}
                    className="bg-green-800 text-white px-10 py-2.5 rounded-xl font-bold hover:bg-green-900 border-b-2 border-yellow-500 shadow-md transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    Login
                </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-2xl text-green-800 hover:text-green-600 transition-colors"
                >
                    <FiMenu />
                </button>
            </div>

            {/* Mobile Sidebar Menu */}
            {showMenu && (
                <div className="absolute top-0 left-0 w-[80%] h-screen bg-white p-6 shadow-2xl z-50 border-r border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        {/* <img src={logo} alt="logo" className="w-14" /> */}
                        <button
                            onClick={() => setShowMenu(false)}
                            className="text-2xl text-green-800 hover:text-green-600 transition-colors"
                        >
                            <MdClose />
                        </button>
                    </div>

                    <ul className="flex flex-col gap-6 text-lg">
                        {navLinksdata.map((item) => (
                            <li key={item._id}>
                                <Link
                                    to={item.link}
                                    spy={true}
                                    smooth={true}
                                    offset={-70}
                                    duration={500}
                                    className="text-green-800 hover:text-green-600 transition-colors font-medium"
                                    onClick={() => setShowMenu(false)}
                                >
                                    {item.title}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 flex flex-col gap-4">
                        <button
                            onClick={() => {
                                setShowMenu(false);
                                onLoginClick();
                            }}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-full font-bold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-md"
                        >
                            Login
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
