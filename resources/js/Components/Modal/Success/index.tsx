// SuccessModal.tsx
import Modal from "./../../../../Layouts/ModalLayout";

interface SuccessModalProps {
    message: string;
    onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ message, onClose }) => {
    return (
        <Modal>
            <div className="text-center p-6 space-y-4">
                <div className="text-green-600 text-4xl font-bold">✔</div>
                <h3 className="text-xl font-semibold text-gray-800">
                    Success!
                </h3>
                <p className="text-sm text-gray-600">{message}</p>
                <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
};

export default SuccessModal;
