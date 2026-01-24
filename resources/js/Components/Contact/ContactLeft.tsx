import React from "react";
import { FaEnvelope, FaFacebookF } from "react-icons/fa";
import contactImg from "../../../images/contact/legal.png";

const ContactLeft: React.FC = () => {
    return (
        <div className="w-full lgl:w-[35%] h-full bg-white/40 backdrop-blur-xl p-4 lgl:p-8 rounded-3xl shadow-xl flex flex-col gap-8 justify-center border border-white/30">
            <img
                className="w-full h-full object-cover rounded-lg mb-2"
                src={contactImg}
                alt="Contact"
            />
            <div className="flex flex-col gap-4">
                <h3 className="text-3xl font-bold text-black">
                    University Legal Office Councel{" "}
                </h3>
                <p className="text-lg font-normal text-gray-700">
                    Central Mindano University
                </p>
                <p className="text-base text-gray-700 tracking-wide">
                    Get in touch with us for any inquiries, feedback, or
                    assistance. We're here to help you with your questions and
                    provide the support you need.
                </p>
                <p className="text-base text-gray-700 flex items-center gap-2">
                    Phone:{" "}
                    <span className="text-black font-medium">
                        +63 0000000000
                    </span>
                </p>
                <p className="text-base text-gray-700 flex items-center gap-2">
                    Email:{" "}
                    <span className="text-black font-medium">
                        cmulegal@cmu.edu.ph
                    </span>
                </p>
            </div>
            <div className="flex flex-col gap-4">
                <h2 className="text-sm uppercase text-gray-500 tracking-wider mb-2">
                    Find Us in
                </h2>
                <div className="flex gap-4">
                    <a
                        href="https://www.facebook.com/profile.php?id=61577020230793"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition"
                    >
                        <FaFacebookF size={18} />
                    </a>
                    <a
                        href="https://mail.google.com/mail/u/0/#inbox?compose=CllgCJvrcjxmhScfGGSCcPKSMVHBPzkLrQZBxFQMXjQzGGkFHRSxBbwNqWGpXLQqRpTMWqCgrqV"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-blue-600 hover:bg-blue-50 transition"
                    >
                        <FaEnvelope size={18} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ContactLeft;
