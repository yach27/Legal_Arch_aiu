import { Home, Bot, FileText, Users2, CreditCard, LogOut } from "lucide-react";
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
    
];
