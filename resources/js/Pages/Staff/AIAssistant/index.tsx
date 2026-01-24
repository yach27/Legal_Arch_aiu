import React, { useState, useEffect } from 'react';
import StaffLayout from "../../../../Layouts/StaffLayout";

import { Header } from './components/layout/Header';
import { ChatInterface } from './components/chat/ChatInterface';
import { apiService } from './services/api';
import { useApi } from './hooks/useApi';
import { ChatSession, ChatMessage, Document } from './types';
import { Sidebar } from './components/layout/SidebarUi/Sidebar';

function StaffAIAssistant() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [documentsShownInSession, setDocumentsShownInSession] = useState(false);
  const [sessionDocumentIds, setSessionDocumentIds] = useState<number[]>([]);
  const [isNewConversation, setIsNewConversation] = useState(false);

  // API hooks - Fetch chat sessions
  const { data: chatSessions, loading: sessionsLoading, refetch: refetchSessions } = useApi<ChatSession[]>(
    () => apiService.getChatSessions(),
    []
  );

  // Load chat history when session changes
  useEffect(() => {
    // Only load chat history when manually selecting an existing session
    // Skip loading for new conversations or when no session is selected
    if (selectedSessionId && !isNewConversation) {
      const loadChatHistory = async () => {
        try {
          setIsLoading(true);
          const history = await apiService.getChatHistory(selectedSessionId);
          // Only set messages if we actually got some history
          if (history && history.length > 0) {
            setChatMessages(history);
          }
        } catch (error) {
          console.error('Failed to load chat history:', error);
          // Don't clear messages on error for new conversations
        } finally {
          setIsLoading(false);
        }
      };
      loadChatHistory();
    }

    // Reset the new conversation flag after handling
    if (isNewConversation) {
      setIsNewConversation(false);
    }
  }, [selectedSessionId, isNewConversation]);

  const handleSendMessage = async (messageText: string, attachedDocuments?: Document[]) => {
    if (!messageText.trim()) return;

    // Add user message immediately with document context (only show documents on first attachment)
    let messageContent = messageText;
    if (attachedDocuments && attachedDocuments.length > 0 && !documentsShownInSession) {
      const docNames = attachedDocuments.map(doc => doc.title).join(', ');
      messageContent = `${messageText}\n\n📎 Attached documents: ${docNames}`;
      setDocumentsShownInSession(true);
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Store document IDs for the session if this is the first time attaching documents
      let documentIdsToSend = sessionDocumentIds;
      if (attachedDocuments && attachedDocuments.length > 0) {
        const newDocIds = attachedDocuments.map(doc => doc.doc_id || doc.id);
        setSessionDocumentIds(newDocIds);
        documentIdsToSend = newDocIds;
      }

      const aiResponse = await apiService.sendMessage(messageText, selectedSessionId || undefined, documentIdsToSend.length > 0 ? documentIdsToSend : undefined);

      // Update session ID if this was a new chat
      if (!selectedSessionId && aiResponse.session_id) {
        setIsNewConversation(true); // Flag this as a new conversation
        setSelectedSessionId(aiResponse.session_id);
      }

      setChatMessages(prev => [...prev, aiResponse]);

      // Always refresh sessions list to update sidebar with latest message
      refetchSessions();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setDocumentsShownInSession(false); // Reset document display flag for new session
    setSessionDocumentIds([]); // Clear session document IDs for new session
    setIsNewConversation(false); // Reset new conversation flag
  };

  const handleNewChat = () => {
    setSelectedSessionId(null);
    setChatMessages([]);
    setDocumentsShownInSession(false); // Reset document display flag for new chat
    setSessionDocumentIds([]); // Clear session document IDs for new chat
    setIsNewConversation(false); // Reset new conversation flag
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await apiService.deleteSession(sessionId);

      if (selectedSessionId === sessionId) {
        handleNewChat();
      }
      refetchSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleStarSession = async (sessionId: string) => {
    try {
      await apiService.starSession(sessionId);
      refetchSessions();
    } catch (error) {
      console.error('Failed to star session:', error);
    }
  };

  const handleUnstarSession = async (sessionId: string) => {
    try {
      await apiService.unstarSession(sessionId);
      refetchSessions();
    } catch (error) {
      console.error('Failed to unstar session:', error);
    }
  };

  const currentSession = chatSessions?.find(s => s.id === selectedSessionId);

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      <div className="h-full flex">
        {/* Sidebar */}
        <div className="flex-shrink-0">
          <Sidebar
            chatSessions={chatSessions || []}
            selectedSession={selectedSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
            onUnstarSession={handleUnstarSession}
            onStarSession={handleStarSession}
            onBack={() => window.history.back()}
            onCollapse={() => {}}
            onExpand={() => {}}
            isLoading={sessionsLoading}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <Header
            currentSessionTitle={currentSession?.title}
            onUpload={() => console.log('Upload disabled for testing')}
          />

          {/* Chat Interface */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatInterface
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              loading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Apply Staff Layout wrapper with fullScreen and hideSidebar props
StaffAIAssistant.layout = (page: React.ReactNode) => (
  <StaffLayout fullScreen hideSidebar>{page}</StaffLayout>
);

export default StaffAIAssistant;
