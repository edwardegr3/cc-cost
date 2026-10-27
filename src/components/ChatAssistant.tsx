"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Eraser, Loader2, MessageSquarePlus, Send, Trash2, User } from "lucide-react";
import type { ChatSessionDTO, MessageDTO } from "@/lib/types";
import { DbErrorNotice } from "@/components/ui";

const ACTIVE_KEY = "credit-compass:active-chat";
const MIN_TYPING_MS = 600;

function readActive(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

function writeActive(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // Storage unavailable (private mode etc.); the active chat just isn't remembered.
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Something went wrong."), { status: res.status });
  return data as T;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ChatAssistant({
  assistantName,
  welcomeMessage,
  maxLength,
}: {
  assistantName: string;
  welcomeMessage: string;
  maxLength: number;
}) {
  const [sessions, setSessions] = useState<ChatSessionDTO[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dbDown, setDbDown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleError = useCallback((e: unknown) => {
    const err = e as Error & { status?: number };
    if (err.status === 503 || err instanceof TypeError) setDbDown(true);
    else setError(err.message);
  }, []);

  const openSession = useCallback(
    async (id: string) => {
      setActiveId(id);
      writeActive(id);
      setError(null);
      try {
        const data = await api<{ messages: MessageDTO[] }>(`/api/chats/${id}`);
        setMessages(data.messages);
      } catch (e) {
        if ((e as { status?: number }).status === 404) {
          setSessions((s) => s.filter((x) => x.id !== id));
          setActiveId(null);
          setMessages([]);
          writeActive(null);
        } else handleError(e);
      }
    },
    [handleError],
  );

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setDbDown(false);
    try {
      const list = await api<ChatSessionDTO[]>("/api/chats");
      setSessions(list);
      const remembered = readActive();
      const target = list.find((s) => s.id === remembered) ?? list[0];
      if (target) await openSession(target.id);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  }, [openSession, handleError]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  async function newChat(): Promise<string | null> {
    setError(null);
    try {
      const s = await api<ChatSessionDTO>("/api/chats", { method: "POST" });
      setSessions((list) => [s, ...list]);
      setActiveId(s.id);
      writeActive(s.id);
      setMessages([]);
      return s.id;
    } catch (e) {
      handleError(e);
      return null;
    }
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    if (content.length > maxLength) {
      setError(`Message is too long (max ${maxLength} characters).`);
      return;
    }
    setBusy(true);
    setError(null);

    const sessionId = activeId ?? (await newChat());
    if (!sessionId) {
      setBusy(false);
      return;
    }

    const tempId = `temp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "user", content, createdAt: new Date().toISOString() }]);
    setInput("");
    setTyping(true);
    const started = Date.now();

    try {
      const res = await api<{ userMessage: MessageDTO; assistantMessage: MessageDTO }>(
        `/api/chats/${sessionId}/messages`,
        { method: "POST", body: JSON.stringify({ content }) },
      );
      const wait = MIN_TYPING_MS - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setMessages((m) => [...m.filter((x) => x.id !== tempId), res.userMessage, res.assistantMessage]);
      setSessions((list) => {
        const current = list.find((s) => s.id === sessionId);
        const title = current && current.messageCount > 0 ? current.title : res.userMessage.content.replace(/\s+/g, " ").slice(0, 60);
        const updated = { id: sessionId, title, updatedAt: res.assistantMessage.createdAt, messageCount: (current?.messageCount ?? 0) + 2 };
        return [updated, ...list.filter((s) => s.id !== sessionId)];
      });
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setInput(content);
      handleError(err);
    } finally {
      setTyping(false);
      setBusy(false);
    }
  }

  async function clearChat() {
    if (!activeId || messages.length === 0) return;
    if (!window.confirm("Clear all messages in this chat?")) return;
    try {
      await api(`/api/chats/${activeId}/messages`, { method: "DELETE" });
      setMessages([]);
      setSessions((list) => list.map((s) => (s.id === activeId ? { ...s, title: "New chat", messageCount: 0 } : s)));
    } catch (e) {
      handleError(e);
    }
  }

  async function deleteChat() {
    if (!activeId) return;
    if (!window.confirm("Delete this chat permanently?")) return;
    try {
      await api(`/api/chats/${activeId}`, { method: "DELETE" });
      const remaining = sessions.filter((s) => s.id !== activeId);
      setSessions(remaining);
      setMessages([]);
      if (remaining[0]) await openSession(remaining[0].id);
      else {
        setActiveId(null);
        writeActive(null);
      }
    } catch (e) {
      handleError(e);
    }
  }

  if (dbDown) {
    return (
      <div className="space-y-3">
        <DbErrorNotice message="Chat history can't be loaded or saved at the moment. The calculator still works. Please try again shortly." />
        <button
          type="button"
          onClick={loadSessions}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Try again
        </button>
      </div>
    );
  }

  const remaining = maxLength - input.length;
  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[240px_1fr]">
      {/* Chat history: sidebar on desktop, dropdown on mobile */}
      <aside className="hidden border-r border-slate-200 bg-slate-50 md:flex md:flex-col">
        <div className="border-b border-slate-200 p-3">
          <button
            type="button"
            onClick={newChat}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden />
            New Chat
          </button>
        </div>
        <nav className="max-h-[480px] flex-1 overflow-y-auto p-2" aria-label="Chat history">
          {loading && <p className="p-2 text-xs text-slate-500">Loading chats…</p>}
          {!loading && sessions.length === 0 && <p className="p-2 text-xs text-slate-500">No chats yet.</p>}
          <ul className="space-y-1">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => openSession(s.id)}
                  aria-current={s.id === activeId}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    s.id === activeId ? "bg-white font-medium shadow-sm ring-1 ring-slate-200" : "text-slate-700 hover:bg-white"
                  }`}
                >
                  <span className="block truncate">{s.title}</span>
                  <span className="block text-xs text-slate-500">{formatTime(s.updatedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
            <label htmlFor="chat-select" className="sr-only">
              Chat history
            </label>
            <select
              id="chat-select"
              value={activeId ?? ""}
              onChange={(e) => e.target.value && openSession(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              {!activeId && <option value="">{loading ? "Loading…" : "No chat selected"}</option>}
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <button type="button" onClick={newChat} className={`${btn} border-indigo-600 bg-indigo-600 text-white`}>
              <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
              New Chat
            </button>
          </div>
          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            <Bot className="h-5 w-5 text-indigo-600" aria-hidden />
            <span className="truncate text-sm font-semibold">{assistantName}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={clearChat} disabled={!activeId || messages.length === 0 || busy} className={`${btn} border-slate-300 text-slate-700 hover:bg-slate-50`}>
              <Eraser className="h-3.5 w-3.5" aria-hidden />
              Clear Chat
            </button>
            <button type="button" onClick={deleteChat} disabled={!activeId || busy} className={`${btn} border-rose-200 text-rose-700 hover:bg-rose-50`}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Delete Chat
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="h-[420px] space-y-4 overflow-y-auto bg-slate-50/50 p-4 sm:h-[480px]" aria-live="polite">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Loading chat…
            </div>
          ) : (
            <>
              <Bubble role="assistant" content={welcomeMessage} />
              {messages.map((m) => (
                <Bubble key={m.id} role={m.role} content={m.content} time={formatTime(m.createdAt)} />
              ))}
              {typing && <TypingIndicator />}
            </>
          )}
        </div>

        <form onSubmit={send} className="border-t border-slate-200 p-3">
          {error && (
            <p role="alert" className="mb-2 text-xs text-rose-600">
              {error}
            </p>
          )}
          <div className="flex items-end gap-2">
            <label htmlFor="chat-input" className="sr-only">
              Your question
            </label>
            <textarea
              id="chat-input"
              rows={2}
              value={input}
              maxLength={maxLength}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about fees, DSTI, early repayment… (no personal data)"
              className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Send message"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          <p className={`mt-1 text-right text-xs ${remaining < 50 ? "text-amber-700" : "text-slate-400"}`}>
            {input.length}/{maxLength}
          </p>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, content, time }: { role: "user" | "assistant"; content: string; time?: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-slate-200 text-slate-700" : "bg-indigo-100 text-indigo-700"
        }`}
        aria-hidden
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`flex max-w-[80%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed [overflow-wrap:anywhere] ${
            isUser ? "rounded-tr-sm bg-indigo-600 text-white" : "rounded-tl-sm border border-slate-200 bg-white text-slate-800"
          }`}
        >
          <span className="sr-only">{isUser ? "You: " : "Assistant: "}</span>
          {content}
        </div>
        {time && <span className="mt-1 text-[11px] text-slate-400">{time}</span>}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2" role="status" aria-label="Assistant is typing">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700" aria-hidden>
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3">
        {[0, 150, 300].map((delay) => (
          <span key={delay} className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </div>
  );
}
