import React from "react";
import heroImage from "./hero.jpg";
import PrimaryButton from "../../Components/PrimaryButton";

const HeroSection: React.FC = () => {
    return (
        <section className="w-full bg-white">
            <div className="max-w-full mx-auto py-10 flex flex-col-reverse lg:flex-row items-center justify-between gap-12">
                {/* LEFT: Text Content */}
                <div className="flex-1">
                    <h1 className="text-4xl sm:text-5xl font-bold text-[#00491E] leading-tight mb-6">
                        University Housing, <br />
                        Recompilation and <br />
                        Boarding House Management
                    </h1>
                    <p className="text-gray-600 text-lg max-w-xl mb-6">
                        A system designed to organize, update, and oversee
                        university housing records, recompilation of resident
                        information, and efficient boarding house management.
                    </p>
                    <PrimaryButton href="/register">GET STARTED</PrimaryButton>
                </div>

                {/* RIGHT: Image */}
                <div className="flex-1">
                    <img
                        src={heroImage}
                        alt="Hero Banner"
                        className="w-full h-auto object-contain rounded-lg shadow-lg"
                    />
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
