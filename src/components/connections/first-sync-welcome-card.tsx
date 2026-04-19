"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, PartyPopper } from "lucide-react";

interface FirstSyncWelcomeCardProps {
  connectionId: string;
  /** ISO timestamp — card shows only if this happened within the last 10 minutes. */
  initialSyncCompletedAt?: string | null;
  /** If true, ignores the 10-minute window (used inside the "About Play Store sync" details). */
  force?: boolean;
}

const WINDOW_MS = 10 * 60 * 1000;
const storageKey = (id: string) => `rp:welcome_seen:${id}`;

export function FirstSyncWelcomeCard({
  connectionId,
  initialSyncCompletedAt,
  force = false,
}: FirstSyncWelcomeCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (force) {
      setVisible(true);
      return;
    }
    if (!initialSyncCompletedAt) return;
    const seen = typeof window !== "undefined"
      ? window.localStorage.getItem(storageKey(connectionId))
      : "1";
    if (seen) return;
    const age = Date.now() - new Date(initialSyncCompletedAt).getTime();
    if (age >= 0 && age <= WINDOW_MS) {
      setVisible(true);
    }
  }, [connectionId, initialSyncCompletedAt, force]);

  if (!visible) return null;

  function dismiss() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey(connectionId), "1");
    }
    setVisible(false);
  }

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
      <CardContent className="p-5 relative">
        {!force && (
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="flex items-start gap-3">
          <div className="rounded-lg p-2 bg-accent/10 shrink-0">
            <PartyPopper className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-base font-semibold">You&apos;re all set — sync is live</p>
              <p className="text-sm text-muted-foreground mt-1">
                We just pulled in every review Google makes available through their API.
                Here&apos;s what happens next:
              </p>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
              <li>
                Going forward, every new review is saved to your ReviewPilot inbox
                permanently — even after it rolls off Google&apos;s public feed.
                Your review history starts building from today.
              </li>
              <li>New reviews appear in your inbox within minutes of a 2-hour sync cycle.</li>
              <li>If auto-reply is on, drafts are generated automatically and ready for your approval.</li>
            </ul>
            <details className="text-sm group">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                A note on older reviews
              </summary>
              <div className="mt-2 text-sm text-muted-foreground space-y-2 pl-1">
                <p>
                  Google&apos;s Play Developer API only exposes reviews from the last 7 days —
                  this is a platform-wide limit Google applies to every tool, not something specific
                  to ReviewPilot. That means reviews older than about a week aren&apos;t fetchable
                  through any API, ours or anyone else&apos;s.
                </p>
                <p>
                  The good news: from this moment on, every review you receive is captured
                  and kept in ReviewPilot for as long as your account is active. You&apos;ll
                  never lose another review.
                </p>
              </div>
            </details>
            {!force && (
              <div className="pt-1">
                <Button size="sm" variant="outline" onClick={dismiss}>
                  Got it
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
