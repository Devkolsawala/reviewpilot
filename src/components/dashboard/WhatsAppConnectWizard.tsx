"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Connection } from "@/types/connection";

const WA_GREEN = "#25D366";

interface PhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
}

export function WhatsAppConnectWizard({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete?: (conn: Connection) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [readyChecked, setReadyChecked] = useState(false);
  const [wabaId, setWabaId] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [phones, setPhones] = useState<PhoneNumber[]>([]);
  const [selectedPhoneId, setSelectedPhoneId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [savedConnection, setSavedConnection] = useState<Connection | null>(null);
  const [copied, setCopied] = useState(false);

  const webhookUrl =
    (process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com") +
    "/api/webhooks/whatsapp";

  async function handleVerify() {
    if (!wabaId || !token) return;
    setVerifying(true);
    setVerifyError("");
    setPhones([]);
    try {
      const res = await fetch("/api/connections/whatsapp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wabaId, systemUserToken: token }),
      });
      const data = await res.json();
      if (!data.success) {
        setVerifyError(
          data.error || "Could not verify. Check your WABA ID and token."
        );
        return;
      }
      if (!data.phones || data.phones.length === 0) {
        setVerifyError(
          "No phone numbers found on this WhatsApp Business Account."
        );
        return;
      }
      setPhones(data.phones);
      setSelectedPhoneId(data.phones[0].id);
      setStep(3);
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setVerifying(false);
    }
  }

  async function handleConnect() {
    const phone = phones.find((p) => p.id === selectedPhoneId);
    if (!phone) return;
    setConnecting(true);
    setConnectError("");
    try {
      const res = await fetch("/api/connections/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wabaId,
          systemUserToken: token,
          phoneNumberId: phone.id,
          displayPhoneNumber: phone.display_phone_number,
          verifiedName: phone.verified_name,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setConnectError(
          data.message || data.error || "Failed to save connection."
        );
        return;
      }
      setSavedConnection(data.connection as Connection);
      setStep(4);
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setConnecting(false);
    }
  }

  function handleCopyWebhook() {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Step 1 — before you begin ─────────────────────────────────────────────
  if (step === 1) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <StepBadge current={1} total={3} />
            <CardTitle className="text-base">Before you begin</CardTitle>
          </div>
          <CardDescription>
            A few things you&apos;ll need on the Meta side before connecting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: `${WA_GREEN}14`,
              borderColor: `${WA_GREEN}55`,
            }}
          >
            <p className="text-sm font-semibold mb-2" style={{ color: WA_GREEN }}>
              You&apos;ll need:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>• A Meta App with the WhatsApp product enabled</li>
              <li>• A WhatsApp Business Account (WABA) with a phone number</li>
              <li>• A permanent System User access token (not a temporary one)</li>
            </ul>
          </div>

          <ol className="space-y-3 text-sm">
            {[
              <>
                Set up WhatsApp Cloud API via{" "}
                <a
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline inline-flex items-center gap-0.5"
                >
                  Meta&apos;s Getting Started guide <ExternalLink className="h-3 w-3" />
                </a>
              </>,
              <>
                Create a <strong>System User</strong> in Meta Business Manager → Business Settings → Users → System Users → Generate token
              </>,
              <>
                Note your <strong>WABA ID</strong> from Meta Business Manager → WhatsApp Accounts
              </>,
              <>
                Need more help? See the{" "}
                <a
                  href="/dashboard/docs"
                  className="text-accent hover:underline"
                >
                  ReviewPilot WhatsApp setup guide
                </a>
              </>,
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <span className="text-muted-foreground leading-snug">{item}</span>
              </li>
            ))}
          </ol>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={readyChecked}
              onChange={(e) => setReadyChecked(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm">
              I have a WABA ID and a permanent System User token
            </span>
          </label>

          <p className="text-xs text-muted-foreground">
            Not sure about the setup? Book a 10-minute call and we&apos;ll do it with you.
          </p>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:hello@reviewpilot.co.in?subject=ReviewPilot%20WhatsApp%20setup%20call&body=Hi%2C%0A%0AI%27d%20like%20to%20book%20a%2010-minute%20WhatsApp%20setup%20call.%0A%0AMy%20preferred%20times%3A%0A%0AThanks%2C">
                Book a setup call
              </a>
            </Button>
            <Button onClick={() => setStep(2)} disabled={!readyChecked}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Step 2 — credentials ──────────────────────────────────────────────────
  if (step === 2) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <StepBadge current={2} total={3} />
            <CardTitle className="text-base">Enter your credentials</CardTitle>
          </div>
          <CardDescription>
            We&apos;ll verify your WABA and list your phone numbers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>WhatsApp Business Account ID</Label>
            <Input
              placeholder="e.g. 102290129340398"
              value={wabaId}
              onChange={(e) => setWabaId(e.target.value.trim())}
            />
            <p className="text-xs text-muted-foreground">
              Find in Meta Business Manager → WhatsApp Accounts → (select your WABA)
            </p>
          </div>

          <div className="space-y-2">
            <Label>System User Access Token</Label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                placeholder="EAAG…"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-secondary"
                aria-label={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use a <strong>permanent</strong> System User token, not a 24-hour
              temporary token. Stored encrypted at rest.
            </p>
          </div>

          {verifyError && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 flex items-start gap-2.5 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-red-700 dark:text-red-400 break-words">
                  {verifyError}
                </p>
                <a
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-0.5 text-xs text-red-600 dark:text-red-400 underline"
                >
                  Meta troubleshooting docs <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={verifying}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!wabaId || !token || verifying}
              className="flex-1 text-white"
              style={{ backgroundColor: WA_GREEN }}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
                </>
              ) : (
                <>
                  Verify connection <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Step 3 — pick a phone number & connect ────────────────────────────────
  if (step === 3) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <StepBadge current={3} total={3} />
            <CardTitle className="text-base">Select your phone number</CardTitle>
          </div>
          <CardDescription>
            Choose the WhatsApp number ReviewPilot should manage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {phones.map((p) => (
              <label
                key={p.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors",
                  selectedPhoneId === p.id
                    ? "border-[color:var(--wa)] bg-[color:var(--wa-bg)]"
                    : "border-border hover:border-[color:var(--wa)]"
                )}
                style={
                  {
                    ["--wa" as string]: WA_GREEN,
                    ["--wa-bg" as string]: `${WA_GREEN}14`,
                  } as React.CSSProperties
                }
              >
                <input
                  type="radio"
                  name="phone"
                  checked={selectedPhoneId === p.id}
                  onChange={() => setSelectedPhoneId(p.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">
                    {p.verified_name || "Unverified"}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {p.display_phone_number}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {connectError && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 flex items-start gap-2.5 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 dark:text-red-400 break-words flex-1">
                {connectError}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              disabled={connecting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleConnect}
              disabled={!selectedPhoneId || connecting}
              className="flex-1 text-white"
              style={{ backgroundColor: WA_GREEN }}
            >
              {connecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting…
                </>
              ) : (
                <>
                  Connect <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Step 4 — success + webhook instructions ───────────────────────────────
  return (
    <Card>
      <CardContent className="p-8 space-y-5">
        <div className="text-center">
          <div
            className="rounded-2xl p-5 w-fit mx-auto mb-4"
            style={{ backgroundColor: `${WA_GREEN}22` }}
          >
            <CheckCircle2 className="h-10 w-10" style={{ color: WA_GREEN }} />
          </div>
          <h3 className="font-sans text-lg font-semibold tracking-tight mb-1">
            WhatsApp connected
          </h3>
          <p className="text-sm text-muted-foreground">
            {savedConnection?.name || "Your WhatsApp number"} is now linked to
            ReviewPilot.
          </p>
        </div>

        <div className="rounded-lg border bg-secondary/40 p-4 space-y-3">
          <p className="text-sm font-semibold">Final step — configure the webhook in Meta</p>
          <p className="text-xs text-muted-foreground">
            Open Meta App Dashboard → WhatsApp → Configuration → Webhook and
            paste:
          </p>

          <div>
            <Label className="text-xs text-muted-foreground">Callback URL</Label>
            <div className="mt-1 flex items-center gap-2 rounded-md border bg-background px-3 py-2">
              <code className="flex-1 text-xs font-mono break-all">{webhookUrl}</code>
              <button
                onClick={handleCopyWebhook}
                className="shrink-0 rounded p-1 hover:bg-secondary"
                title="Copy URL"
              >
                {copied ? (
                  <Check className="h-4 w-4" style={{ color: WA_GREEN }} />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Verify token:</strong> in your own Meta App, you control
              the verify token — pick any random string, paste it both in Meta
              and in your <code>WHATSAPP_WEBHOOK_VERIFY_TOKEN</code> env var, then redeploy.
              For the shared ReviewPilot demo number, ask your admin for the
              token.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Then subscribe the <strong>messages</strong> field under Webhook
            fields to start receiving customer messages.
          </p>
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          <Button
            className="text-white"
            style={{ backgroundColor: WA_GREEN }}
            onClick={() => savedConnection && onComplete?.(savedConnection)}
          >
            Go to Review Inbox <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "/dashboard/settings/ai-config";
            }}
          >
            Configure AI Replies
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StepBadge({ current, total }: { current: number; total: number }) {
  return (
    <Badge
      variant="secondary"
      className="text-[10px]"
      style={{ backgroundColor: `${WA_GREEN}22`, color: WA_GREEN }}
    >
      Step {current}/{total}
    </Badge>
  );
}
