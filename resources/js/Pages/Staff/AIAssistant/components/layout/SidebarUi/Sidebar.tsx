import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2 } from 'lucide-react';

import { SidebarCollapsedIcon } from './SidebarCollapsedIcon';
import { SidebarHeader } from './SidebarHeader';
import { NewChatButton } from './NewChatButton';
import { ChatSessionItem } from './ChatSessionItem';
import { SidebarFooter } from './SidebarFooter';
import { ChatSession } from "../../../types";

interface SidebarProps {
  chatSessions: ChatSession[];
  selectedSession: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onUnstarSession: (sessionId: string) => void;
  onStarSession?: (sessionId: string) => void;
  onBack?: () => void;
  onCollapse?: (isCollapsed: boolean) => void;
  onExpand?: () => void;
  isLoading?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chatSessions,
  selectedSession,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onUnstarSession,
  onStarSession,
  onBack,
  onCollapse,
  onExpand,
  isLoading = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth >= 250 && newWidth <= 600) { // Min and max width limits
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Filter starred and recent sessions from real data
  const starredSessions = chatSessions.filter(session => session.starred);
  const recentSessions = chatSessions.filter(session => !session.starred);

  const handleCollapse = () => {
    setCollapsed(true);
    onCollapse?.(true);
  };

  const handleExpand = () => {
    setCollapsed(false);
    onCollapse?.(false);
    onExpand?.();
  };

  if (collapsed) {
    return (
      <div className="w-16 h-full flex-shrink-0">
        <SidebarCollapsedIcon onExpand={handleExpand} />
      </div>
    );
  }

  return (
    <div
      ref={sidebarRef}
      className="relative h-full overflow-hidden flex-shrink-0"
      style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
    >
      {/* Forest Green background matching dashboard */}
      <div className="absolute inset-0 bg-[#1b5e20]"></div>

      {/* Content */}
      <div className="relative h-full flex flex-col text-white shadow-2xl">
        <SidebarHeader onBack={onBack} onCollapse={handleCollapse} />

        <NewChatButton onClick={onNewChat} />

        <div className="flex-1 overflow-y-auto px-4 py-2 green-scrollbar">
          {isLoading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Loader2 className="w-10 h-10 text-green-300 animate-spin mb-4" />
              <p className="text-green-100 text-sm font-medium mb-1">
                Loading conversations...
              </p>
              <p className="text-green-200/60 text-xs">
                Please wait a moment
              </p>
              {/* Loading skeleton items */}
              <div className="w-full mt-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-green-800/30 rounded-lg p-3 border-b border-green-600/30">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500/50 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-green-700/50 rounded w-3/4"></div>
                          <div className="h-2 bg-green-700/30 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Starred Sessions */}
              {starredSessions.length > 0 && (
                <div className="mb-6">
                  {/* Starred Header - Yellow Theme */}
                  <div className="relative mb-4 overflow-hidden rounded-2xl bg-[#F4D03F] border border-[#FBEC5D]">
                    <div className="relative px-4 py-3 flex items-center gap-3">
                      {/* Title */}
                      <div className="flex-1">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
                          Starred Chats
                        </h3>
                        <p className="text-xs text-gray-700 mt-0.5">
                          {starredSessions.length} favorite{starredSessions.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Badge */}
                      <div className="bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                        <span className="text-xs font-bold text-yellow-400">
                          {starredSessions.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Starred Sessions List */}
                  <div className="space-y-3">
                    {starredSessions.map((session) => (
                      <ChatSessionItem
                        key={session.id}
                        session={session}
                        isSelected={selectedSession === session.id}
                        isStarred={true}
                        onSelect={() => onSelectSession(session.id)}
                        onUnstar={() => onUnstarSession(session.id)}
                        onDelete={() => onDeleteSession(session.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Sessions */}
              <div>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-500/30">
                  <div className="w-1 h-4 bg-green-400 rounded-full"></div>
                  <h3 className="text-xs uppercase tracking-wider text-green-100 font-bold truncate">
                    Recent Chats
                  </h3>
                </div>
                <div className="space-y-3">
                  {recentSessions.length > 0 ? (
                    recentSessions.map((session) => (
                      <ChatSessionItem
                        key={session.id}
                        session={session}
                        isSelected={selectedSession === session.id}
                        isStarred={false}
                        onSelect={() => onSelectSession(session.id)}
                        onStar={onStarSession ? () => onStarSession(session.id) : undefined}
                        onDelete={() => onDeleteSession(session.id)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 px-4">
                      <div className="w-16 h-16 bg-green-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-3xl">💭</span>
                      </div>
                      <p className="text-green-100 text-sm font-medium mb-1">
                        No conversations yet
                      </p>
                      <p className="text-green-200/60 text-xs">
                        Start a new chat to begin!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <SidebarFooter onAllChatsClick={onNewChat} />

        {/* Resize Handle */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:w-2 bg-white/20 hover:bg-white/30 transition-all duration-200 ${isResizing ? 'bg-white/40 w-2' : ''
            }`}
          onMouseDown={startResizing}
          title="Drag to resize sidebar"
        >
          <div className="absolute inset-0 w-4 -translate-x-1.5" />
        </div>
      </div>
    </div>
  );
};