import logo from "../../../images/logo.png";
const FooterBottom = () => {
    return (
        <footer className="w-full py-8 mt-auto bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <div className="flex items-center justify-center mb-4">
                    <div className="5 flex items-center justify-center mr-2">
                        <img src={logo} alt="logo" className="w-10 h-auto" />
                    </div>
                    <span className="text-gray-800 font-semibold">
                        University Legal Counsel
                    </span>
                </div>
                <p className="text-gray-600 text-sm">
                    © 2024 University Legal Counsel . All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default FooterBottom;
