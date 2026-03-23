"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquarePlus,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  FileText,
} from "lucide-react";
import type { Conversation } from "@/lib/conversationStorage";
import { cn } from "@/lib/utils";

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  sidebarCollapsed: boolean;
  onSidebarCollapsedChange: (collapsed: boolean) => void;
  activeTab: "chats" | "documents";
  onTabChange: (tab: "chats" | "documents") => void;
  documentsContent?: React.ReactNode;
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  sidebarOpen,
  onSidebarOpenChange,
  sidebarCollapsed,
  onSidebarCollapsedChange,
  activeTab,
  onTabChange,
  documentsContent,
}: ChatSidebarProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirmId === id) {
      onDeleteConversation(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 2000);
    }
  };

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    onSidebarOpenChange(false);
  };

  const tabBar = (
    <div className="flex border-b">
      <button
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
          activeTab === "chats"
            ? "border-b-2 border-violet-500 text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onTabChange("chats")}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Chats
      </button>
      <button
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
          activeTab === "documents"
            ? "border-b-2 border-violet-500 text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onTabChange("documents")}
      >
        <FileText className="h-3.5 w-3.5" />
        Documents
      </button>
    </div>
  );

  const listContent = (
    <div className="flex flex-col gap-1.5 py-3">
      {conversations.length === 0 ? (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
          No conversations yet. Start a new chat to begin.
        </p>
      ) : (
        conversations.map((conv) => (
          <div
            key={conv.id}
            className={cn(
              "group flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3.5 py-3 text-left transition-colors hover:bg-accent",
              activeConversationId === conv.id && "bg-accent"
            )}
            onClick={() => handleSelect(conv.id)}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-relaxed">
                {conv.title || "New Chat"}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {formatRelativeTime(conv.updatedAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => handleDelete(conv.id, e)}
              title={deleteConfirmId === conv.id ? "Click again to confirm" : "Delete"}
            >
              <Trash2
                className={cn(
                  "h-3.5 w-3.5",
                  deleteConfirmId === conv.id && "text-destructive"
                )}
              />
            </Button>
          </div>
        ))
      )}
    </div>
  );

  const chatsContent = (
    <>
      <div className="border-b p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2.5"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">{listContent}</ScrollArea>
    </>
  );

  return (
    <>
      {/* Mobile: Sheet overlay */}
      <Sheet open={sidebarOpen} onOpenChange={onSidebarOpenChange}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="px-4 py-3">
            <SheetTitle className="text-base">RAG Agent</SheetTitle>
          </SheetHeader>
          {tabBar}
          <div className="flex flex-1 flex-col">
            {activeTab === "chats" ? (
              <>
                <div className="border-b p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2.5"
                    onClick={() => {
                      onNewChat();
                      onSidebarOpenChange(false);
                    }}
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    New Chat
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-180px)] px-2">
                  {listContent}
                </ScrollArea>
              </>
            ) : (
              documentsContent
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: Persistent sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border/40 bg-card/50 backdrop-blur-sm transition-all duration-200 md:flex md:flex-col",
          sidebarCollapsed ? "w-12" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b",
            sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {!sidebarCollapsed && (
            <span className="truncate text-sm font-medium">RAG Agent</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onSidebarCollapsedChange(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!sidebarCollapsed && (
          <>
            {tabBar}
            {activeTab === "chats" ? chatsContent : documentsContent}
          </>
        )}
      </aside>
    </>
  );
}
