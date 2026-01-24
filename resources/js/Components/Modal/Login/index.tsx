import React, { useState } from "react";
import axios from "axios";
import Modal from "../../../../Layouts/ModalLayout";

interface LoginModalProps {
    onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isDisabled = !email.trim() || !password.trim();

    const handleLogin = async () => {
        if (!email || !password) return;

        setIsLoading(true);
        setError("");

        try {
            // Use axios for automatic CSRF handling and session cookie persistence
            const response = await axios.post("/login", { email, password });
            const data = response.data;

            // Debug logs
            console.log("=== LOGIN RESPONSE DEBUG ===");
            console.log("Response status:", response.status);
            console.log("Full response data:", data);
            console.log("Access token:", data.access_token);

            console.log("=== LOGIN SUCCESS ===");
            console.log("User:", data.user);

            if (data.access_token) {
                // Save token for future API calls
                localStorage.setItem("auth_token", data.access_token);
                console.log("Token saved to localStorage:", data.access_token);
            }

            // Close modal
            onClose();

            // Redirect to admin dashboard
            // Using window.location.href is safer for login transitions to ensure 
            // fresh state and proper cookie handling across all browsers
            setTimeout(() => {
                window.location.href = "/admin/dashboard";
            }, 200);

        } catch (error: any) {
            console.error("Login error:", error);
            const message = error.response?.data?.message || "An error occurred. Please try again.";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isDisabled && !isLoading) {
            handleLogin();
        }
    };

    return (
        <Modal>
            <button
                onClick={onClose}
                className="absolute top-3 right-4 text-xl font-bold text-green-800 hover:text-red-600"
                disabled={isLoading}
            >
                ×
            </button>

            <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                Legal Office Admin Login
            </h2>
            <p className="text-center text-sm text-gray-700 mb-6">
                Please login with your admin credentials
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-100/80 backdrop-blur-sm border border-red-400 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm mb-1 font-semibold text-gray-700">Email</label>
                <input
                    type="email"
                    placeholder="admin@legal.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="w-full px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm border-2 border-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 transition-all"
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm mb-1 font-semibold text-gray-700">Password</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="w-full px-4 py-2 pr-10 rounded-xl bg-white/60 backdrop-blur-sm border-2 border-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 transition-all"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                </div>
            </div>

            <button
                type="button"
                disabled={isDisabled || isLoading}
                onClick={handleLogin}
                className={`w-full py-3 rounded-xl font-bold transition-all duration-200 shadow-lg ${isDisabled || isLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-xl transform hover:scale-[1.02]"
                    }`}
            >
                {isLoading ? "Logging in..." : "Login"}
            </button>
        </Modal>
    );
};

export default LoginModal;
