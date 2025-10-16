import { createContext, useContext, useState, ReactNode } from "react";
import SuccessModal from "../Success";
import ConfirmationModal from "../Confirmation";
import IssueModal from "../IssueModal";

export type Filters = {
    cottageTypes: string[];
    remarks: string[];
    puroks: string[];
};

interface ModalContextType {
    isFilterOpen: boolean;
    openFilter: () => void;
    closeFilter: () => void;
    filters: Filters;
    setFilters: (filters: Filters) => void;

    isConfirmationOpen: boolean;
    isSuccessOpen: boolean;
    openConfirmation: (onConfirm: () => void) => void;
    closeConfirmation: () => void;
    openSuccess: () => void;
    closeSuccess: () => void;

    isIssueOpen: boolean;
    openIssue: (onConfirm: (issues: string[]) => void) => void;
    closeIssue: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error("useModal must be used within ModalProvider");
    return context;
};

///Email Generate Text base on the Issues
const generateEmailMessage = (issues: string[], remarks?: string) => {
    const issueMessages: Record<string, string> = {
        "Expire Soon":
            "This is a reminder that your contract is about to expire soon. Please renew as soon as possible.",
        Expired:
            "Your contract has expired. Immediate action is required to renew or vacate.",
        "Other Issue":
            "There is another issue with your contract. Please contact the administration for more details.",
    };

    const messageLines = issues.map(
        (issue) => `• ${issue}: ${issueMessages[issue]}`,
    );

    let finalMessage = `Dear Tenant,\n\nWe have detected the following issues with your contract:\n\n${messageLines.join("\n")}`;

    if (remarks?.trim()) {
        finalMessage += `\n\nAdditional remarks:\n${remarks}`;
    }

    finalMessage += `\n\nBest regards,\nAdmin Team`;

    return finalMessage;
};

export function ModalProvider({ children }: { children: ReactNode }) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<Filters>({
        cottageTypes: [],
        remarks: [],
        puroks: [],
    });
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [onConfirmAction, setOnConfirmAction] = useState<() => void>(
        () => {},
    );
    const openFilter = () => setIsFilterOpen(true);
    const closeFilter = () => setIsFilterOpen(false);

    const openConfirmation = (action: () => void) => {
        setOnConfirmAction(() => action); // set the function to call
        setIsConfirmationOpen(true);
    };
    const closeConfirmation = () => setIsConfirmationOpen(false);

    const openSuccess = () => setIsSuccessOpen(true);
    const closeSuccess = () => setIsSuccessOpen(false);
    const [isIssueOpen, setIsIssueOpen] = useState(false);
    const [onIssueConfirm, setOnIssueConfirm] = useState<
        (issues: string[]) => void
    >(() => {});

    const openIssue = (onConfirm: (issues: string[]) => void) => {
        setOnIssueConfirm(() => onConfirm);
        setIsIssueOpen(true);
    };
    const closeIssue = () => setIsIssueOpen(false);

    return (
        <ModalContext.Provider
            value={{
                isFilterOpen,
                openFilter,
                closeFilter,
                filters,
                setFilters,

                isConfirmationOpen,
                openConfirmation,
                closeConfirmation,
                isSuccessOpen,
                openSuccess,
                closeSuccess,
                isIssueOpen,
                openIssue,
                closeIssue,
            }}
        >
            {children}
            {isConfirmationOpen && (
                <ConfirmationModal
                    onConfirm={() => {
                        onConfirmAction();
                        closeConfirmation();
                        openSuccess(); // Trigger success modal after confirmation
                    }}
                    onCancel={closeConfirmation}
                />
            )}
            {isSuccessOpen && (
                <SuccessModal
                    message="Email was sent successfully!"
                    onClose={closeSuccess}
                />
            )}
            {isIssueOpen && (
                <IssueModal
                    onNext={(selected, remarks) => {
                        const emailMessage = generateEmailMessage(
                            selected,
                            remarks,
                        );

                        closeIssue();

                        openConfirmation(() => {
                            console.log(
                                "📧 Sending Email to:",
                                "tenant@example.com",
                            );
                            console.log("✉️ Email Body:\n", emailMessage);
                            openSuccess();
                        });
                    }}
                    onCancel={closeIssue}
                />
            )}
        </ModalContext.Provider>
    );
}
