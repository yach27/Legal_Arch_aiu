import { Home, Bot, FileText, BarChart3, Users2, CreditCard, LogOut, Activity, User } from "lucide-react";
import { FC, useContext } from "react";
import { Link, usePage } from "@inertiajs/react";
import { DashboardContext } from "../../../Context/DashboardContext";
import { NavLink } from "./NavLink";
import { navLinksData } from "./navLinksData";
import { useModal } from "../../Modal/ModalContext";
import { Modal } from "../../Modal/Modal";



export const navLinksData = [
    {
        title: "Dashboard",
        path: "/admin/dashboard",
        icon: <Home size={18} />,
    },

    {
        title: "AI Assistant",
         path: "/admin/ai-assistant",
        icon: <Bot size={18} />,
    },
    {
        title: "Documents",
        path: "/admin/documents",
        icon: <FileText size={18} />,
    },
    {
        title: "Reports",
        path: "/admin/reports",
        icon: <BarChart3 size={18} />,
    },
    {
        title: "Activity Logs",
        path: "/admin/activity-logs",
        icon: <Activity size={18} />,
    },
    {
        title: "Account Management",
        path: "/admin/account",
        icon: <User size={18} />,
    },
];
