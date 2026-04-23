"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, RefreshCw, Send, Sparkles, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { Message, TypingIndicator } from "./Message";
import { SuggestedPrompts } from "./SuggestedPrompts";

interface Props {
  open: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

const MAX_CHARS = 1000;

export function ChatPanel({ open, onClose, onMinimize }: Props) {
  const { messages, isStreaming, send, reset } = useChat();
  const [input, setInput] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Focus trap + Esc to close
  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => textareaRef.current?.focus(), 50);

    const onKey = (e: KeyboardEvent | globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", onKey as (e: globalThis.KeyboardEvent) => void);
    return () => {
      clearTimeout(t);
      document.removeEventListener(
        "keydown",
        onKey as (e: globalThis.KeyboardEvent) => void
      );
      lastFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isStreaming]);

  // Auto-grow textarea (max ~4 lines)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  const handleSend = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isStreaming) return;
    setInput("");
    send(value);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showWelcome = messages.length === 0;
  const lastMessage = messages[messages.length - 1];
  const waitingForFirstToken =
    isStreaming && lastMessage?.role === "assistant" && lastMessage.content.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border border-border bg-background shadow-2xl",
            // Mobile: full-screen sheet using dynamic viewport height (handles mobile URL bar)
            "inset-0 h-[100dvh] w-full rounded-none",
            // Desktop: floating panel, clamped to viewport so it never overflows on short screens
            "sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(600px,calc(100dvh-7rem))] sm:w-[min(400px,calc(100vw-3rem))] sm:rounded-2xl"
          )}
        >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="ReviewPilot Assistant"
          className="flex h-full w-full flex-col"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-500 px-4 py-3 text-white">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
              <Sparkles className="h-4.5 w-4.5" />
              <span
                className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white/90"
                aria-label="Online"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-tight">ReviewPilot Assistant</div>
              <div className="text-[11px] text-white/80">
                {isStreaming ? "Typing…" : "Online · usually replies instantly"}
              </div>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                aria-label="Clear conversation"
                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onMinimize}
              aria-label="Minimize chat"
              className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            aria-live="polite"
          >
            {showWelcome && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm leading-relaxed text-foreground shadow-sm">
                    Hi! I can answer questions about ReviewPilot — features, pricing, how
                    it works. What would you like to know?
                  </div>
                </div>
                <div className="pl-9">
                  <SuggestedPrompts onPick={(p) => handleSend(p)} disabled={isStreaming} />
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const isStreamingThis =
                isStreaming && isLast && m.role === "assistant" && m.content.length > 0;
              if (
                isStreaming &&
                isLast &&
                m.role === "assistant" &&
                m.content.length === 0
              ) {
                return null;
              }
              return <Message key={m.id} message={m} streaming={isStreamingThis} />;
            })}

            {waitingForFirstToken && <TypingIndicator />}
          </div>

          {/* Footer / Input */}
          <form
            onSubmit={onSubmit}
            className="border-t border-border bg-background p-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={onKeyDown}
                placeholder="Ask about features, pricing, integrations…"
                rows={1}
                disabled={isStreaming}
                aria-label="Message ReviewPilot Assistant"
                className="max-h-[120px] flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                aria-label="Send message"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="mt-1.5 px-1 text-[10px] text-muted-foreground">
              Powered by AI · May occasionally be inaccurate
            </div>
          </form>
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
