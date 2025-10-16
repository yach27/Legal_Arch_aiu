import { createContext, FC, ReactNode, useState } from "react";

type TDashboardContext = {
    collapse: boolean;
    handleCollapse: (t?: boolean) => void;
    showMobileSidebar: boolean;
    toggleMobileSidebar: (value?: boolean) => void;
};

export const DashboardContext = createContext<TDashboardContext | null>(null);

type TDashboardContextProps = {
    children?: ReactNode;
};

export const DashboardContextProvider: FC<TDashboardContextProps> = ({
    children,
}) => {
    const savedCollapseState = localStorage.getItem("sidebarCollapse");
    const initialCollapse = savedCollapseState
        ? JSON.parse(savedCollapseState)
        : true;

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
};
