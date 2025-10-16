import React from "react";
import Modal from "./../../../../Layouts/ModalLayout";

interface ConfirmationModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    onConfirm,
    onCancel,
}) => {
    return (
        <Modal>
            <div className="text-center p-6 space-y-4">
                <div className="text-red-600 text-4xl font-bold">❗</div>

                <h3 className="text-xl font-semibold text-gray-800">
                    Confirm Submission
                </h3>
                <p className="text-sm text-gray-600">
                    Are you sure you want to submit the form?
                </p>
                <div className="flex justify-center gap-4 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border rounded-md hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        Yes, Submit
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;
