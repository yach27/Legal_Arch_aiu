import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';

// Session storage key for document queue
const DOCUMENT_QUEUE_KEY = 'document_upload_queue';

export interface DocumentQueue {
    documentIds: number[];
    currentIndex: number;
    totalCount: number;
}

/**
 * Custom hook for managing document queue navigation in multi-document upload flow.
 * Handles storing/retrieving queue from session storage and navigation between documents.
 */
export const useDocumentQueue = (currentDocId?: number | null) => {
    const [queue, setQueue] = useState<DocumentQueue | null>(null);
    const [isLastDocument, setIsLastDocument] = useState(false);
    const [isFirstDocument, setIsFirstDocument] = useState(true);

    // Load queue from session storage on mount
    useEffect(() => {
        const storedQueue = sessionStorage.getItem(DOCUMENT_QUEUE_KEY);
        if (storedQueue) {
            try {
                const parsedQueue: DocumentQueue = JSON.parse(storedQueue);
                setQueue(parsedQueue);

                // Find current index if docId is provided
                if (currentDocId) {
                    const index = parsedQueue.documentIds.indexOf(currentDocId);
                    if (index !== -1) {
                        parsedQueue.currentIndex = index;
                        setQueue({ ...parsedQueue });
                        sessionStorage.setItem(DOCUMENT_QUEUE_KEY, JSON.stringify(parsedQueue));
                    }
                }

                // Update navigation state
                setIsFirstDocument(parsedQueue.currentIndex === 0);
                setIsLastDocument(parsedQueue.currentIndex === parsedQueue.documentIds.length - 1);
            } catch (e) {
                console.error('Failed to parse document queue:', e);
                clearQueue();
            }
        }
    }, [currentDocId]);

    /**
     * Initialize a new document queue with uploaded document IDs
     */
    const initializeQueue = useCallback((documentIds: number[]) => {
        const newQueue: DocumentQueue = {
            documentIds,
            currentIndex: 0,
            totalCount: documentIds.length
        };
        setQueue(newQueue);
        sessionStorage.setItem(DOCUMENT_QUEUE_KEY, JSON.stringify(newQueue));
        setIsFirstDocument(true);
        setIsLastDocument(documentIds.length === 1);
    }, []);

    /**
     * Navigate to the next document in the queue
     */
    const goToNextDocument = useCallback(() => {
        if (!queue || queue.currentIndex >= queue.documentIds.length - 1) {
            // No more documents, clear queue and redirect
            clearQueue();
            router.visit('/admin/documents');
            return;
        }

        const newIndex = queue.currentIndex + 1;
        const nextDocId = queue.documentIds[newIndex];

        const updatedQueue = { ...queue, currentIndex: newIndex };
        setQueue(updatedQueue);
        sessionStorage.setItem(DOCUMENT_QUEUE_KEY, JSON.stringify(updatedQueue));

        setIsFirstDocument(false);
        setIsLastDocument(newIndex === queue.documentIds.length - 1);

        router.visit(`/ai-processing?docId=${nextDocId}`);
    }, [queue]);

    /**
     * Navigate to the previous document in the queue
     */
    const goToPreviousDocument = useCallback(() => {
        if (!queue || queue.currentIndex <= 0) return;

        const newIndex = queue.currentIndex - 1;
        const prevDocId = queue.documentIds[newIndex];

        const updatedQueue = { ...queue, currentIndex: newIndex };
        setQueue(updatedQueue);
        sessionStorage.setItem(DOCUMENT_QUEUE_KEY, JSON.stringify(updatedQueue));

        setIsFirstDocument(newIndex === 0);
        setIsLastDocument(false);

        router.visit(`/ai-processing?docId=${prevDocId}`);
    }, [queue]);

    /**
     * Remove current document from queue and move to next
     */
    const removeCurrentAndContinue = useCallback(() => {
        if (!queue) {
            router.visit('/admin/documents');
            return;
        }

        const newDocumentIds = queue.documentIds.filter((_, i) => i !== queue.currentIndex);

        if (newDocumentIds.length === 0) {
            // No more documents
            clearQueue();
            router.visit('/admin/documents');
            return;
        }

        // Adjust current index if we removed the last document
        const newIndex = Math.min(queue.currentIndex, newDocumentIds.length - 1);
        const nextDocId = newDocumentIds[newIndex];

        const updatedQueue: DocumentQueue = {
            documentIds: newDocumentIds,
            currentIndex: newIndex,
            totalCount: newDocumentIds.length
        };

        setQueue(updatedQueue);
        sessionStorage.setItem(DOCUMENT_QUEUE_KEY, JSON.stringify(updatedQueue));

        router.visit(`/ai-processing?docId=${nextDocId}`);
    }, [queue]);

    /**
     * Clear the document queue from session storage
     */
    const clearQueue = useCallback(() => {
        sessionStorage.removeItem(DOCUMENT_QUEUE_KEY);
        setQueue(null);
        setIsFirstDocument(true);
        setIsLastDocument(false);
    }, []);

    /**
     * Check if there's an active queue
     */
    const hasQueue = queue !== null && queue.documentIds.length > 1;

    /**
     * Get remaining document count
     */
    const remainingCount = queue ? queue.documentIds.length - queue.currentIndex - 1 : 0;

    return {
        queue,
        hasQueue,
        isFirstDocument,
        isLastDocument,
        remainingCount,
        currentPosition: queue ? queue.currentIndex + 1 : 1,
        totalDocuments: queue?.totalCount || 1,
        initializeQueue,
        goToNextDocument,
        goToPreviousDocument,
        removeCurrentAndContinue,
        clearQueue
    };
};

export default useDocumentQueue;
