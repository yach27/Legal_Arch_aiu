import logo from "../../../images/logo.png";
const FooterBottom = () => {
    return (
        <footer className="w-full py-10 mt-auto bg-white/30 backdrop-blur-xl border-t border-white/20">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <div className="flex items-center justify-center mb-4">
                    <div className="5 flex items-center justify-center mr-2">
                        <img src={logo} alt="logo" className="w-12 h-auto" />
                    </div>
                    <span className="text-green-800 font-bold text-lg">
                        University Legal Counsel
                    </span>
                </div>
                <p className="text-gray-600 text-sm">
                    © 2024 University Legal Counsel. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default FooterBottom;
