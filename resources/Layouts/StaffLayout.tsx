import { FC, ReactNode, useState } from "react";
import StaffSidebar from "../js/Components/Templates/StaffSidebar";
import StaffNavbar from "../js/Components/Templates/StaffNavbar";
import { DashboardContext } from "../js/Context/DashboardContext";

interface StaffLayoutProps {
    children: ReactNode;
    fullScreen?: boolean;
    hideSidebar?: boolean;
    noPadding?: boolean;
}

const StaffLayout: FC<StaffLayoutProps> = ({ children, fullScreen = false, hideSidebar = false, noPadding = false }) => {
    const savedCollapseState = localStorage.getItem("sidebarCollapse");
    const initialCollapse = savedCollapseState
        ? JSON.parse(savedCollapseState)
        : false;

    const [collapse, setCollapse] = useState<boolean>(initialCollapse);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    const handleCollapse = (toggle?: boolean) => {
        const newCollapseState = toggle !== undefined ? toggle : !collapse;
        setCollapse(newCollapseState);
        localStorage.setItem(
            "sidebarCollapse",
            JSON.stringify(newCollapseState)
        );
    };

    const toggleMobileSidebar = (value?: boolean) => {
        setShowMobileSidebar((prev) => (value !== undefined ? value : !prev));
    };

    // Full screen mode for AI Assistant
    if (fullScreen) {
        return (
            <DashboardContext.Provider
                value={{
                    collapse,
                    handleCollapse,
                    showMobileSidebar,
                    toggleMobileSidebar,
                }}
            >
                {children}
            </DashboardContext.Provider>
        );
    }

    return (
        <DashboardContext.Provider
            value={{
                collapse,
                handleCollapse,
                showMobileSidebar,
                toggleMobileSidebar,
            }}
        >
            <div className="flex h-screen overflow-hidden bg-gray-50">
                {/* Sidebar */}
                {!hideSidebar && <StaffSidebar />}

                {/* Main Content */}
                <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
                    <StaffNavbar />
                    <main className={`flex-1 ${noPadding ? 'overflow-hidden p-0' : 'overflow-auto p-6'}`}>
                        {children}
                    </main>
                </div>
            </div>
        </DashboardContext.Provider>
    );
};

export default StaffLayout;
