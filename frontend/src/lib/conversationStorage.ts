const STORAGE_KEY = 'rag-agent-conversations';

export type Mood = 'happy' | 'thinking' | 'confused' | 'excited' | 'neutral' | 'sad';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mood?: Mood;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

function getStartOfMonth(): number {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

interface RawMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  mood?: Mood;
}

function parseMessage(msg: RawMessage): Message {
  return {
    id: msg.id,
    role: msg.role === "assistant" ? "assistant" : "user",
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    mood: msg.mood,
  };
}

export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: { id: string; title: string; messages: RawMessage[]; createdAt: number; updatedAt: number }[] = JSON.parse(raw);
    const cutoff = getStartOfMonth();
    const filtered = parsed.filter((c) => c.createdAt >= cutoff);
    const withParsedMessages: Conversation[] = filtered.map((c) => ({
      ...c,
      messages: c.messages.map(parseMessage),
    }));
    if (filtered.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withParsedMessages));
    }
    return withParsedMessages;
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave = conversations.map((c) => ({
      ...c,
      messages: c.messages.map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      })),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save conversations:', e);
  }
}
