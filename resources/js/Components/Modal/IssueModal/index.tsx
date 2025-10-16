import React, { useState } from "react";
import Modal from "../../../../Layouts/ModalLayout";
import IssueImg from "./issue.png";
interface IssueModalProps {
    onNext: (selectedIssues: string[], remarks: string) => void;
    onCancel: () => void;
}

const IssueModal: React.FC<IssueModalProps> = ({ onNext, onCancel }) => {
    const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
    const [remarks, setRemarks] = useState("");

    const toggleIssue = (issue: string) => {
        setSelectedIssues((prev) =>
            prev.includes(issue)
                ? prev.filter((i) => i !== issue)
                : [...prev, issue],
        );
    };

    const handleConfirm = () => {
        if (selectedIssues.length > 0) {
            onNext(selectedIssues, remarks);
        }
    };

    return (
        <Modal>
            <div className="text-center space-y-4 p-6">
                <img src={IssueImg} alt="Issue" className="w-20 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-800">Issue</h3>
                <p className="text-sm text-gray-600">
                    Please select the issue you’re concerned about.
                </p>

                <div className="flex justify-center gap-4 my-4 flex-wrap">
                    {["Expire Soon", "Expired", "Other Issue"].map((issue) => (
                        <label key={issue} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={selectedIssues.includes(issue)}
                                onChange={() => toggleIssue(issue)}
                                className="accent-green-700 w-5 h-5"
                            />
                            <span className="text-sm text-gray-800">
                                {issue}
                            </span>
                        </label>
                    ))}
                </div>

                {/* Remarks Textarea */}
                <div>
                    <label className="block text-sm font-medium text-left text-gray-700 mb-1">
                        Remarks{" "}
                        <span className="text-gray-400 text-xs">
                            (optional)
                        </span>
                    </label>
                    <textarea
                        rows={3}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-700 resize-none text-sm"
                        placeholder="Write any additional remarks here..."
                    />
                </div>

                <div className="flex justify-center gap-4 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border rounded-md hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedIssues.length === 0}
                        className="px-6 py-2 bg-green-800 text-white rounded-md hover:bg-green-900 disabled:bg-gray-400"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default IssueModal;
