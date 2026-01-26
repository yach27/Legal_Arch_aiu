import { ReactNode } from "react";

interface ModalProps {
    children: ReactNode;
}

export default function Modal({ children }: ModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/40">
            <div className="bg-white text-black rounded-[2.5rem] p-10 w-[95%] max-w-md relative shadow-[0_20px_70px_rgba(0,0,0,0.15)] border border-gray-100">
                {children}
            </div>
        </div>
    );
}
