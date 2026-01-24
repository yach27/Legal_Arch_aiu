import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, MoreVertical } from 'lucide-react';
import { DocumentListItemProps, Document } from '../../types/types';
import DocumentViewer from '../DocumentViewer/DocumentViewer';
import DocumentMenu from './DocumentMenu';
import DocumentPropertiesModal from './DocumentPropertiesModal';
import EditDocumentModal from './EditDocumentModal';
import DeleteDocumentDialog from './DeleteDocumentDialog';
import realDocumentService from '../../services/realDocumentService';

// Reusing types from DocumentListItemProps as they are identical
const DocumentGridItem: React.FC<DocumentListItemProps> = ({
    document,
    folders = [],
    onDocumentUpdated
}) => {
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleDocumentClick = (): void => {
        setIsViewerOpen(true);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();

        if (!menuOpen) {
            const rect = event.currentTarget.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + window.scrollY,
                left: rect.right + window.scrollX - 160 // Adjust for menu width
            });
        }

        setMenuOpen(!menuOpen);
    };

    const handleMenuAction = async (action: string): Promise<void> => {
        setMenuOpen(false);

        switch (action) {
            case 'properties':
                setIsPropertiesOpen(true);
                break;
            case 'edit':
                setIsEditOpen(true);
                break;
            case 'archive':
                await handleArchive();
                break;
            case 'restore':
                await handleRestore();
                break;
            case 'delete':
                setIsDeleteOpen(true);
                break;
        }
    };

    const handleArchive = async (): Promise<void> => {
        try {
            await realDocumentService.archiveDocument(document.doc_id);
            setToastMessage(`Document "${document.title}" has been archived!`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            onDocumentUpdated?.();
        } catch (error) {
            console.error('Failed to archive document:', error);
            alert(`Failed to archive document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleRestore = async (): Promise<void> => {
        try {
            await realDocumentService.restoreDocument(document.doc_id);
            setToastMessage(`Document "${document.title}" has been restored!`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            onDocumentUpdated?.();
        } catch (error) {
            console.error('Failed to restore document:', error);
            alert(`Failed to restore document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDocumentUpdated = () => {
        onDocumentUpdated?.();
    };

    const handleDocumentDeleted = () => {
        onDocumentUpdated?.();
    };

    const getFileExtension = (filename: string): string => {
        const extension = filename.split('.').pop()?.toUpperCase();
        return extension || 'FILE';
    };

    // Close menu when clicking outside
    useEffect(() => {
        if (!menuOpen || typeof window === 'undefined') return;

        const handleClickOutside = () => {
            setMenuOpen(false);
            setMenuPosition(null);
        };

        window.document.addEventListener('click', handleClickOutside);
        return () => window.document.removeEventListener('click', handleClickOutside);
    }, [menuOpen]);

    return (
        <>
            <div
                className="group relative bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-green-100/50 transition-all duration-300 cursor-pointer flex flex-col items-center text-center h-56 overflow-hidden w-full backdrop-blur-sm"
                onClick={handleDocumentClick}
                title={document.title}
            >
                {/* Modern Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 via-green-50/0 to-green-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 transform translate-y-[-4px] group-hover:translate-y-0">
                    <button
                        className="p-1.5 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-700 bg-white/50 backdrop-blur-md shadow-sm border border-gray-100/50 transition-all"
                        onClick={handleMenuClick}
                        type="button"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center w-full mt-1 relative z-10">
                    <div className="relative mb-4">
                        <div className="absolute inset-0 bg-green-200 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                        <div className="relative w-16 h-16 bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 border border-green-100/50 shadow-sm">
                            <FileText className="w-8 h-8 text-green-600/90" strokeWidth={1.5} />
                        </div>
                    </div>

                    <h4 className="text-[13px] font-semibold text-gray-700 truncate w-full px-2 max-w-full leading-relaxed tracking-tight group-hover:text-green-800 transition-colors">
                        {document.title}
                    </h4>

                    <div className="mt-2.5">
                        <span className="text-[10px] tracking-wider text-gray-400 font-semibold bg-gray-50/80 px-2.5 py-1 rounded-lg border border-gray-100 uppercase group-hover:border-green-100/50 group-hover:text-green-600/70 transition-colors">
                            {getFileExtension(document.title)}
                        </span>
                    </div>
                </div>
            </div >

            {/* Portals for Modals/Menus */}
            {
                typeof window !== 'undefined' && menuOpen && menuPosition && createPortal(
                    <div
                        style={{
                            position: 'absolute',
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                            zIndex: 10000
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DocumentMenu
                            onProperties={() => handleMenuAction('properties')}
                            onEdit={() => handleMenuAction('edit')}
                            onDelete={() => handleMenuAction('delete')}
                            onArchive={() => handleMenuAction('archive')}
                            onRestore={() => handleMenuAction('restore')}
                            isArchived={document.status === 'archived'}
                        />
                    </div>,
                    window.document.body
                )
            }

            <DocumentViewer
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                document={document}
            />

            {
                typeof window !== 'undefined' && isPropertiesOpen && createPortal(
                    <DocumentPropertiesModal
                        isOpen={isPropertiesOpen}
                        onClose={() => setIsPropertiesOpen(false)}
                        document={document}
                    />,
                    window.document.body
                )
            }

            {
                typeof window !== 'undefined' && isEditOpen && createPortal(
                    <EditDocumentModal
                        isOpen={isEditOpen}
                        onClose={() => setIsEditOpen(false)}
                        document={document}
                        folders={folders}
                        onDocumentUpdated={handleDocumentUpdated}
                    />,
                    window.document.body
                )
            }

            {
                typeof window !== 'undefined' && isDeleteOpen && createPortal(
                    <DeleteDocumentDialog
                        isOpen={isDeleteOpen}
                        onClose={() => setIsDeleteOpen(false)}
                        document={document}
                        onDocumentDeleted={handleDocumentDeleted}
                    />,
                    window.document.body
                )
            }

            {
                typeof window !== 'undefined' && showToast && createPortal(
                    <div className="fixed top-6 right-6 z-[10000] bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg">
                        {toastMessage}
                    </div>,
                    window.document.body
                )
            }
        </>
    );
};

export default DocumentGridItem;
