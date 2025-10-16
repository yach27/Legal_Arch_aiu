import { useContext, useEffect, useState, ReactNode } from "react";
import Navbar from "../js/Components/Templates/Navbar/index";
import Sidebar from "../js/Components/Templates/AdminSidebar";
import {
    DashboardContext,
    DashboardContextProvider,
} from "../../resources/js/Context/DashboardContext";
// import Loading from "../js/Components/Loading";

import { ModalProvider, useModal } from "../js/Components/Modal/ModalContext";
import Modal from "./ModalLayout";

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        const hasLoaded = sessionStorage.getItem("adminLoaded");
        if (hasLoaded) {
            setLoading(false);
        } else {
            const timer = setTimeout(() => {
                setLoading(false);
                sessionStorage.setItem("adminLoaded", "true");
            }, 1500);

            return () => clearTimeout(timer);
        }

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <DashboardContextProvider>
            <ModalProvider>
                <InnerLayout isMobile={isMobile}>{children}</InnerLayout>
            </ModalProvider>
        </DashboardContextProvider>
    );
}

function InnerLayout({
    isMobile,
    children,
}: {
    isMobile: boolean;
    children: ReactNode;
}) {
    const context = useContext(DashboardContext);
    const { isFilterOpen, closeFilter } = useModal();

    if (!context) return null;

    const { showMobileSidebar, toggleMobileSidebar } = context;

    return (
        <div className="flex h-screen overflow-hidden relative">
            {/* Sidebar */}
            {isMobile ? (
                showMobileSidebar && (
                    <>
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-40"
                            onClick={() => toggleMobileSidebar(false)}
                        />
                        <div className="fixed top-0 left-0 w-64 h-full bg-primary text-white z-50">
                            <Sidebar />
                        </div>
                    </>
                )
            ) : (
                <div className="h-full z-10">
                    <Sidebar />
                </div>
            )}

            {/* Main content */}
            <div className="flex flex-col flex-1 w-full h-full overflow-auto z-0">
                <Navbar />
                <main className="p-6 flex-1 overflow-auto bg-gray-50 shadow-xl">
                    {children}
                </main>
            </div>

            {/* Global Modal */}
            {isFilterOpen && (
                <Modal>
                    <button
                        onClick={closeFilter}
                        className="absolute top-3 right-3 text-sm font-bold text-gray-500 hover:text-black"
                    >
                        ✕
                    </button>
                </Modal>
            )}
        </div>
    );
}
