"use client";

// "Share this report" affordance used on both analyzer surfaces: the client
// tool result and the server-rendered /insights page. Copy-link works
// everywhere; the native share sheet is offered only where the browser
// supports navigator.share (mostly mobile).
//
// canShare is resolved in an effect (not at render) so the server and the
// first client render agree — avoids a hydration mismatch from probing
// navigator during SSR.

import { useEffect, useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

export function ShareReport({ url, title }: { url: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link is still visible to copy manually. */
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: title ?? "Review Health Report",
        url,
      });
    } catch {
      /* user dismissed the share sheet — nothing to do. */
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Share this report</p>
      </div>
      <p className="mt-1 break-all text-xs text-muted-foreground">{url}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background/80"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy link
            </>
          )}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/10 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent/20"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        )}
      </div>
    </div>
  );
}
