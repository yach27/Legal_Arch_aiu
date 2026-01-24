import { FC } from "react";

const AddFilesButton: FC = () => {
    return (
        <button
            className="w-full bg-white text-green-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-all duration-200 mb-3"
        >
            Add Files
        </button>
    );
};

export default AddFilesButton;
