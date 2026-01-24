import { ReactNode } from "react";

interface ModalProps {
    children: ReactNode;
}

export default function Modal({ children }: ModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md bg-black/30">
            <div className="bg-white/50 backdrop-blur-2xl text-black rounded-3xl p-8 w-[90%] max-w-md relative shadow-2xl border border-white/40">
                {children}
            </div>
        </div>
    );
}
