import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import Navbar from "../../Components/Public Navbar";
import Banner from "../../Components/HeroSection/Hero/Banner";
import About from "../../Components/About/About";
import News from "../../Components/News";
import Contact from "../../Components/Contact/Contact";
import FooterBottom from "../../Components/Footer/FooterBottom";
import LoginModal from "../../Components/Modal/Login";

export default function Home() {
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check for existing session on component mount
    useEffect(() => {
        const checkExistingSession = () => {
            const currentUser = sessionStorage.getItem("currentUser");

            if (currentUser) {
                try {
                    const user = JSON.parse(currentUser);
                    console.log("Existing session found:", user);

                    // Redirect to appropriate dashboard based on user role
                    if (user.role === "Admin") {
                        router.visit("/admin/dashboard");
                    } else {
                        router.visit("/tenant/dashboard");
                    }
                    return; // Don't show loading if redirecting
                } catch (error) {
                    console.error("Error parsing stored user session:", error);
                    // Clear invalid session data
                    sessionStorage.removeItem("currentUser");
                }
            }

            // Show loading screen for new users
            const timeout = setTimeout(() => {
                setLoading(false);
            }, 3000);

            return () => clearTimeout(timeout);
        };

        checkExistingSession();
    }, []);

    // Function to handle login click with session check
    const handleLoginClick = () => {
        const currentUser = sessionStorage.getItem("currentUser");

        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                console.log("User already logged in, redirecting...");

                // Redirect to appropriate dashboard
                if (user.role === "Admin") {
                    router.visit("/admin/dashboard");
                } else {
                    router.visit("/tenant/dashboard");
                }
            } catch (error) {
                console.error("Error parsing stored user session:", error);
                // Clear invalid session and show login modal
                sessionStorage.removeItem("currentUser");
                setShowLogin(true);
            }
        } else {
            // No existing session, show login modal
            setShowLogin(true);
        }
    };

    // if (loading) return <Loading />;

    return (
        <>
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
            <div className="min-h-screen flex flex-col relative overflow-hidden">
                {/* Glassmorphism Background with Green Theme */}
                <div className="fixed inset-0 bg-gradient-to-br from-green-200 via-emerald-200 to-teal-200 -z-10">
                    {/* Animated Gradient Orbs */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                    <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
                    <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-lime-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
                </div>

                <Navbar
                    onLoginClick={handleLoginClick}
                    onRegisterClick={() => setShowRegister(true)}
                />
                <main className="flex-1 w-full">
                    <Banner onLoginClick={handleLoginClick} />
                    <About />
                    <News />
                    <Contact />
                </main>
                <FooterBottom />
            </div>
        </>
    );
}
