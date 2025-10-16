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
        <header className="sticky top-0 z-50 w-full bg-white shadow-sm px-4 lg:px-10 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
                {/* <img src={logo} alt="logo" className="w-10 h-10" /> */}
                <h1 className="text-xl font-semibold text-gray-800">
                    CMU Legal Archieving System
                </h1>
            </div>

            <ul className="hidden lg:flex space-x-10 text-sm font-semibold justify-center">
                {navLinksdata.map((item) => (
                    <li key={item._id}>
                        <Link
                            to={item.link}
                            spy={true}
                            smooth={true}
                            offset={-70}
                            duration={500}
                            activeClass="active-link"
                            className="cursor-pointer text-black hover:text-[#057032] transition-colors duration-300"
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
                    className="bg-[#003A18] text-white px-10 py-2 rounded-full hover:bg-[#ffc600] hover:text-black "
                >
                    Login
                </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-2xl text-green-800"
                >
                    <FiMenu />
                </button>
            </div>

            {/* Mobile Sidebar Menu */}
            {showMenu && (
                <div className="absolute top-0 left-0 w-[80%] h-screen bg-white p-6 shadow-lg z-50">
                    <div className="flex justify-between items-center mb-6">
                        {/* <img src={logo} alt="logo" className="w-14" /> */}
                        <button
                            onClick={() => setShowMenu(false)}
                            className="text-2xl text-gray-800"
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
                                    className="text-gray-700 hover:text-green-800"
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
                            className="bg-green-900 text-white py-2 rounded-full"
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
