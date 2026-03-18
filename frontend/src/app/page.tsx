"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, Loader2, Sparkles, PanelLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  loadConversations,
  saveConversations,
  type Conversation,
  type Message,
  type Mood,
} from "@/lib/conversationStorage";
import { ChatSidebar } from "@/components/ChatSidebar";
import { MoodAvatar } from "@/components/MoodAvatar";

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = (
  RAW_API_URL.startsWith("http") ? RAW_API_URL : `https://${RAW_API_URL}`
).replace(/\/+$/, "");

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const messages =
    activeConversationId === null
      ? []
      : conversations.find((c) => c.id === activeConversationId)?.messages ??
        [];

  const isInitialMount = useRef(true);

  useEffect(() => {
    const loaded = loadConversations();
    setConversations(loaded);
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeConversationId]);

  const sendMessage = useCallback(
    async (overridePrompt?: string) => {
      const trimmed = (overridePrompt ?? input).trim();
      if (!trimmed || isLoading) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      let convId = activeConversationId;
      const existingConv = convId
        ? conversations.find((c) => c.id === convId)
        : null;
      const isNewConversation = convId === null || !existingConv;

      if (isNewConversation) {
        convId = crypto.randomUUID();
        const title =
          trimmed.length > 30 ? trimmed.slice(0, 30) + "..." : trimmed;
        const newConv: Conversation = {
          id: convId,
          title,
          messages: [userMessage],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(convId);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, userMessage],
                  updatedAt: Date.now(),
                }
              : c
          )
        );
      }

      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const data = await res.json();

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer || "Sorry, no response received.",
          timestamp: new Date(),
          mood: (data.mood as Mood) || "neutral",
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, assistantMessage],
                  updatedAt: Date.now(),
                }
              : c
          )
        );
      } catch (error) {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : "An unexpected error occurred. Please try again.",
          timestamp: new Date(),
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, errorMessage],
                  updatedAt: Date.now(),
                }
              : c
          )
        );
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [activeConversationId, isLoading, input, conversations]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setInput("");
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    },
    [activeConversationId]
  );

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarCollapsedChange={setSidebarCollapsed}
      />

      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border/40 bg-background/60 px-5 py-3 backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            title="Open conversations"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-semibold tracking-tight">
              RAG AI Agent
            </h1>
            <p className="text-[11px] text-muted-foreground/70">
              Gemini &amp; Pinecone
            </p>
          </div>
          <ThemeToggle />
        </header>

        <ScrollArea className="flex-1 min-h-0 overflow-hidden">
          <div className="mx-auto max-w-3xl px-4 py-6">
            {messages.length === 0 ? (
              <EmptyState onSuggestionSend={sendMessage} />
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
                {isLoading && <ThinkingIndicator />}
                <div ref={scrollRef} />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 border-t border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                disabled={isLoading}
                className="rounded-xl border-border/40 bg-muted/40 pr-12 shadow-sm backdrop-blur-sm placeholder:text-muted-foreground/50 focus-visible:bg-background"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`group flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {isUser ? (
        <Avatar className="mt-0.5 h-7 w-7 shrink-0">
          <AvatarFallback className="bg-foreground/10 text-foreground">
            <User className="h-3.5 w-3.5" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <MoodAvatar mood={message.mood} size={28} className="mt-0.5" />
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "rounded-tr-md bg-foreground text-background"
            : "rounded-tl-md bg-muted/60"
        }`}
      >
        <div className="whitespace-pre-wrap text-[13px] leading-relaxed">
          {message.content}
        </div>
        <div
          className={`mt-1.5 flex items-center gap-2 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          {!isUser && message.mood && (
            <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-500 dark:text-violet-400 capitalize">
              {message.mood}
            </span>
          )}
          <p
            className={`text-[10px] ${
              isUser ? "text-background/40" : "text-muted-foreground/50"
            }`}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <MoodAvatar mood="thinking" size={28} className="mt-0.5 animate-pulse" />
      <div className="rounded-2xl rounded-tl-md bg-muted/60 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Thinking...</span>
        </div>
      </div>
    </div>
  );
}

const suggestions = [
  { icon: "🔧", text: "What frontend framework do we use?", label: "Stack" },
  { icon: "🔐", text: "How does API authentication work?", label: "Auth" },
  { icon: "🚀", text: "Describe the deployment process", label: "Deploy" },
  { icon: "🌐", text: "How to fix CORS issues?", label: "Debug" },
];

function EmptyState({
  onSuggestionSend,
}: {
  onSuggestionSend: (text: string) => void;
}) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <MoodAvatar mood="happy" size={44} className="mb-4" />
      <h2 className="text-lg font-semibold tracking-tight">
        What can I help you find?
      </h2>
      <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground/70">
        Ask about architecture, API specs, deployment, and more.
      </p>
      <div className="mt-8 grid w-full max-w-md gap-2.5 sm:grid-cols-2">
        {suggestions.map((s) => (
          <button
            key={s.text}
            className="group flex items-start gap-3 rounded-2xl border border-border/40 bg-muted/30 px-4 py-3 text-left transition-all duration-200 hover:border-border hover:bg-muted/60 hover:shadow-sm"
            onClick={() => onSuggestionSend(s.text)}
          >
            <span className="mt-0.5 text-sm leading-none">{s.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium leading-snug">{s.text}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/50">
                {s.label}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
