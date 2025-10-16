import { ReactNode } from "react";

interface ModalProps {
    children: ReactNode;
}

export default function Modal({ children }: ModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-black/20">
            <div className="bg-white text-black rounded-xl p-6 w-[90%] max-w-md relative shadow-xl">
                {children}
            </div>
        </div>
    );
}
