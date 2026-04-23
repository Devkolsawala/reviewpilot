"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChat";

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Tiny inline markdown: **bold**, *italic*, `code`, [label](url).
// Intentionally minimal — no HTML injection, just text spans.
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const pattern = /(\*\*[^*\n]+\*\*|(?<!\*)\*[^*\n]+\*(?!\*)|`[^`\n]+`|\[[^\]\n]+\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\))/g;
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > lastIndex) {
      out.push(text.slice(lastIndex, m.index));
    }
    const token = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**") && token.endsWith("**")) {
      out.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      out.push(
        <code
          key={key}
          className="rounded bg-background/60 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const close = token.indexOf("](");
      const label = token.slice(1, close);
      const href = token.slice(close + 2, -1);
      out.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
        >
          {label}
        </a>
      );
    } else {
      out.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = m.index + token.length;
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}

function renderContent(text: string): React.ReactNode {
  // Strip ATX headings down to plain strong lines (### foo → **foo**)
  const cleaned = text.replace(/^#{1,6}\s+(.*)$/gm, "**$1**");
  const lines = cleaned.split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5">
          {bullets.map((b, i) => (
            <li key={i}>{renderInline(b, `li-${blocks.length}-${i}`)}</li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const m = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
    if (m) {
      bullets.push(m[1]);
    } else {
      flush();
      if (line.trim()) {
        blocks.push(
          <p key={`p-${blocks.length}`}>{renderInline(line, `p-${blocks.length}`)}</p>
        );
      }
    }
  }
  flush();
  return blocks.length ? blocks : renderInline(text, "t");
}

export function Message({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("group flex w-full gap-2", isUser ? "justify-end" : "justify-start")}
      aria-live={streaming ? "polite" : undefined}
    >
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="flex max-w-[80%] flex-col gap-1">
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
            isUser
              ? "bg-brand-600 text-white rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          )}
        >
          <div className="space-y-2 whitespace-pre-wrap [word-break:break-word]">
            {renderContent(message.content)}
            {streaming && (
              <span
                aria-hidden
                className="ml-0.5 inline-block h-3.5 w-1.5 -mb-0.5 animate-pulse bg-current opacity-70"
              />
            )}
          </div>
        </div>
        <span
          className={cn(
            "px-1 text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100",
            isUser ? "text-right" : "text-left"
          )}
        >
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white shadow-sm">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 shadow-sm">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
