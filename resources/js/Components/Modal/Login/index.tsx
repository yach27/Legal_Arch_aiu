import React, { useState } from "react";
import { router } from "@inertiajs/react";
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
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        
        // Debug logs
        console.log("=== LOGIN RESPONSE DEBUG ===");
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);
        console.log("Full response data:", data);
        console.log("Access token:", data.access_token);
        console.log("Token length:", data.access_token?.length);

        if (!response.ok) {
            setError(data.message || "Invalid email or password.");
        } else {
            console.log("=== LOGIN SUCCESS ===");
            console.log("User:", data.user);

            if (data.access_token) {
                // Save token for future API calls
                localStorage.setItem("auth_token", data.access_token);
                console.log("Token saved to localStorage:", data.access_token);
                
                // Verify token was saved
                const savedToken = localStorage.getItem("auth_token");
                console.log("Verified saved token:", savedToken);
            } else {
                console.error("No access_token in response!");
            }

            // Close modal
            onClose();

            // Redirect to admin dashboard
            setTimeout(() => {
                router.visit("/admin/dashboard");
            }, 200);
        }
    } catch (error) {
        console.error("Login error:", error);
        setError("An error occurred. Please try again.");
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

            <h2 className="text-2xl font-semibold text-center mb-2">
                Legal Office Admin Login
            </h2>
            <p className="text-center text-sm text-gray-600 mb-6">
                Please login with your admin credentials
            </p>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm mb-1">Email</label>
                <input
                    type="email"
                    placeholder="admin@legal.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="w-full px-4 py-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm mb-1">Password</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        className="w-full px-4 py-2 pr-10 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                </div>
            </div>

            <button
                type="button"
                disabled={isDisabled || isLoading}
                onClick={handleLogin}
                className={`w-full py-2 rounded-md transition-colors duration-200 ${
                    isDisabled || isLoading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#00491e] text-white hover:bg-green-900"
                }`}
            >
                {isLoading ? "Logging in..." : "Login"}
            </button>
        </Modal>
    );
};

export default LoginModal;
