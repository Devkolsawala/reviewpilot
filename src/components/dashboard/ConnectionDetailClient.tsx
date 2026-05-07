"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Loader2, RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { WhatsAppTemplatesTab } from "@/components/dashboard/WhatsAppTemplatesTab";
import { WhatsAppProfileTab } from "@/components/dashboard/WhatsAppProfileTab";

const WHATSAPP_GREEN = "#25D366";

export type TokenStatus =
  | "active"
  | "expired"
  | "revoked"
  | "pending_exchange"
  | "exchange_failed"
  | null;

export interface ConnectionDetailProps {
  id: string;
  type: string;
  name: string;
  createdAtFormatted: string;
  wabaId: string | null;
  phoneNumberId: string | null;
  displayPhoneNumber: string | null;
  connectionMethod: "manual" | "embedded_signup" | null;
  tokenStatus: TokenStatus;
  tokenLastValidatedAt: string | null;
  tokenExchangeError: string | null;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ConnectionDetailClient({
  connection,
}: {
  connection: ConnectionDetailProps;
}) {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <Link
          href="/dashboard/settings/connections"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Connections
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="rounded-lg p-2.5"
            style={{ backgroundColor: `${WHATSAPP_GREEN}22` }}
          >
            <MessageCircle className="h-5 w-5" style={{ color: WHATSAPP_GREEN }} />
          </div>
          <div>
            <h1 className="font-sans text-2xl font-semibold tracking-tight">
              {connection.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="text-[10px]"
                style={{ backgroundColor: `${WHATSAPP_GREEN}22`, color: WHATSAPP_GREEN }}
              >
                WhatsApp Business
              </Badge>
              {connection.displayPhoneNumber && (
                <span className="text-xs text-muted-foreground font-mono">
                  {connection.displayPhoneNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <TokenStatusBanner connection={connection} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <OverviewRow
                label="Display phone number"
                value={connection.displayPhoneNumber || "—"}
                mono
              />
              <OverviewRow label="Verified name" value={connection.name || "—"} />
              <OverviewRow
                label="WhatsApp Business Account ID"
                value={connection.wabaId || "—"}
                mono
              />
              <OverviewRow
                label="Phone number ID"
                value={connection.phoneNumberId || "—"}
                mono
              />
              <OverviewRow
                label="Connected on"
                value={connection.createdAtFormatted}
              />
              <OverviewRow
                label="Webhook status"
                value={
                  <Badge variant="outline" className="text-[10px]">
                    Configured in Meta App Dashboard
                  </Badge>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <WhatsAppTemplatesTab connectionId={connection.id} />
        </TabsContent>

        <TabsContent value="profile" className="mt-4">
          <WhatsAppProfileTab connectionId={connection.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-4 sm:items-center border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>
      <div
        className={
          mono
            ? "text-sm font-mono text-foreground break-all"
            : "text-sm text-foreground"
        }
      >
        {value}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Token health banner (Phase 6 v2 — TASK 4)
// ----------------------------------------------------------------------------

const PENDING_TIMEOUT_MS = 60_000;

function TokenStatusBanner({ connection }: { connection: ConnectionDetailProps }) {
  const router = useRouter();
  const [reconnecting, setReconnecting] = useState(false);
  const [pollingTimedOut, setPollingTimedOut] = useState(false);
  const startedAtRef = useRef<number>(Date.now());

  const status = connection.tokenStatus;

  // Auto-poll while pending_exchange.
  useEffect(() => {
    if (status !== "pending_exchange") return;
    startedAtRef.current = Date.now();
    setPollingTimedOut(false);

    const intervalId = setInterval(() => {
      if (Date.now() - startedAtRef.current >= PENDING_TIMEOUT_MS) {
        setPollingTimedOut(true);
        clearInterval(intervalId);
        return;
      }
      router.refresh();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [status, router]);

  async function handleReconnect() {
    setReconnecting(true);
    try {
      const res = await fetch(
        `/api/whatsapp/connections/${connection.id}/refresh-token`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.needs_reauthorization && data.ess_redirect_url) {
        window.location.href = data.ess_redirect_url;
      } else {
        toast({
          title: "Reconnect failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
        setReconnecting(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      toast({ title: "Reconnect failed", description: msg, variant: "destructive" });
      setReconnecting(false);
    }
  }

  // Manual flow has no token-status tracking — skip the banner entirely.
  if (connection.connectionMethod !== "embedded_signup") return null;
  if (!status) return null;

  if (status === "active") {
    return (
      <div className="rounded-lg border border-green-500/40 bg-green-50 dark:bg-green-950/40 p-3 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
        <div className="text-sm text-green-900 dark:text-green-200">
          <span className="font-medium">Connection healthy.</span>{" "}
          <span className="text-green-700 dark:text-green-300">
            Last validated: {relativeTime(connection.tokenLastValidatedAt)}.
          </span>
        </div>
      </div>
    );
  }

  if (status === "pending_exchange") {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 p-3 flex items-center gap-3">
        {pollingTimedOut ? (
          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <Loader2 className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 animate-spin" />
        )}
        <div className="flex-1 text-sm text-amber-900 dark:text-amber-200">
          {pollingTimedOut ? (
            <>
              <span className="font-medium">Setup is taking longer than expected.</span>{" "}
              This usually means the token exchange is still in progress. You can
              refresh status, or contact support if the problem persists.
            </>
          ) : (
            <>
              <span className="font-medium">Setup in progress…</span>{" "}
              Refreshing automatically.
            </>
          )}
        </div>
        {pollingTimedOut && (
          <Button size="sm" variant="outline" onClick={() => router.refresh()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh status
          </Button>
        )}
      </div>
    );
  }

  // exchange_failed | expired | revoked → red, with Reconnect.
  const message =
    status === "revoked"
      ? "Customer revoked access from Meta Business Manager. Please reconnect."
      : status === "expired"
      ? "Connection expired. Please reconnect."
      : `Token exchange failed${
          connection.tokenExchangeError ? `: ${connection.tokenExchangeError}` : "."
        }`;

  return (
    <div className="rounded-lg border border-red-500/40 bg-red-50 dark:bg-red-950/40 p-3 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-red-900 dark:text-red-200">
        <p className="font-medium mb-0.5">Connection unhealthy</p>
        <p className="text-red-800 dark:text-red-300 break-words">{message}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleReconnect}
        disabled={reconnecting}
      >
        {reconnecting ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        )}
        Reconnect
      </Button>
    </div>
  );
}
