"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { usePlan } from "@/hooks/usePlan";
import { getDigestCcLimit } from "@/lib/plans";
import { X } from "lucide-react";

type Prefs = {
  user_id: string;
  daily_enabled: boolean;
  weekly_enabled: boolean;
  daily_send_hour: number;
  weekly_send_dow: number;
  weekly_send_hour: number;
  timezone: string;
  recipient_email: string | null;
  cc_emails: string[];
  skip_if_no_activity: boolean;
  include_lowest_rated: boolean;
  include_top_keywords: boolean;
  include_quota_usage: boolean;
};

type LogRow = {
  id: string;
  digest_type: "daily" | "weekly";
  status: string;
  recipient_email: string | null;
  created_at: string;
  period_start: string;
  error_message: string | null;
  is_test: boolean;
};

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function statusLabel(s: string): { text: string; variant: "default" | "secondary" | "destructive" } {
  switch (s) {
    case "sent":
      return { text: "Sent", variant: "default" };
    case "skipped_no_activity":
      return { text: "Skipped — no activity", variant: "secondary" };
    case "skipped_unsubscribed":
      return { text: "Skipped — unsubscribed", variant: "secondary" };
    case "disabled":
      return { text: "Disabled", variant: "secondary" };
    case "no_recipient":
      return { text: "No recipient", variant: "destructive" };
    case "failed":
      return { text: "Failed", variant: "destructive" };
    default:
      return { text: s, variant: "secondary" };
  }
}

export default function NotificationsPage() {
  const { planId } = usePlan();
  const ccLimit = getDigestCcLimit(planId);

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [testingDaily, setTestingDaily] = useState(false);
  const [testingWeekly, setTestingWeekly] = useState(false);
  const [ccDraft, setCcDraft] = useState("");

  async function refetchLogs() {
    try {
      const res = await fetch("/api/digest/logs", { cache: "no-store" });
      const data = await res.json();
      setLogs((data.logs || []).slice(0, 7));
    } catch {
      /* silent — main UI still works */
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [prefsRes, logsRes] = await Promise.all([
          fetch("/api/digest/preferences"),
          fetch("/api/digest/logs", { cache: "no-store" }),
        ]);
        const p = await prefsRes.json();
        const l = await logsRes.json();
        setPrefs(p.preferences);
        setLogs((l.logs || []).slice(0, 7));
      } catch {
        toast({ title: "Error", description: "Could not load notification settings.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function patch(update: Partial<Prefs>) {
    if (!prefs) return;
    const next = { ...prefs, ...update };
    setPrefs(next);
    setSaving(true);
    try {
      const res = await fetch("/api/digest/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Could not save", variant: "destructive" });
        return;
      }
      if (data.preferences) setPrefs(data.preferences);
    } catch {
      toast({ title: "Error", description: "Could not save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest(period: "daily" | "weekly") {
    const setBusy = period === "daily" ? setTestingDaily : setTestingWeekly;
    setBusy(true);
    try {
      const res = await fetch("/api/digest/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Test digest sent",
          description: `Check your inbox for the ${period} digest preview.`,
        });
        // Surface the new entry in the history immediately
        await refetchLogs();
      } else {
        toast({
          title: "Could not send test",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Could not send test", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  function addCc() {
    const email = ccDraft.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }
    if (!prefs) return;
    if (prefs.cc_emails.includes(email)) {
      setCcDraft("");
      return;
    }
    if (prefs.cc_emails.length >= ccLimit) {
      toast({
        title: "Plan limit reached",
        description: `Your plan allows ${ccLimit} CC recipient${ccLimit === 1 ? "" : "s"}.`,
        variant: "destructive",
      });
      return;
    }
    patch({ cc_emails: [...prefs.cc_emails, email] });
    setCcDraft("");
  }

  function removeCc(email: string) {
    if (!prefs) return;
    patch({ cc_emails: prefs.cc_emails.filter((e) => e !== email) });
  }

  if (loading || !prefs) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Email digests summarise your review activity so you don&apos;t have to check
            the dashboard every day.
          </p>
        </div>
        {saving && <span className="text-xs text-muted-foreground">Saving…</span>}
      </div>

      {/* ── Daily digest ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Daily digest</CardTitle>
              <CardDescription>
                A morning- or evening-friendly summary of new reviews, replies, and what
                still needs your attention.
              </CardDescription>
            </div>
            <Switch
              checked={prefs.daily_enabled}
              onCheckedChange={(v) => patch({ daily_enabled: v })}
              aria-label="Enable daily digest"
            />
          </div>
        </CardHeader>
        {prefs.daily_enabled && (
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="daily-hour">Send time</Label>
                <Select
                  value={String(prefs.daily_send_hour)}
                  onValueChange={(v) => patch({ daily_send_hour: parseInt(v, 10) })}
                >
                  <SelectTrigger id="daily-hour">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, h) => (
                      <SelectItem key={h} value={String(h)}>
                        {String(h).padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  We&apos;ll send at the next 2-hour tick after this time — up to 2 hours later.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tz">Timezone</Label>
                <Select
                  value={prefs.timezone}
                  onValueChange={(v) => patch({ timezone: v })}
                >
                  <SelectTrigger id="tz">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipient">Recipient email</Label>
              <Input
                id="recipient"
                type="email"
                value={prefs.recipient_email ?? ""}
                onChange={(e) => setPrefs({ ...prefs, recipient_email: e.target.value })}
                onBlur={() => {
                  const v = (prefs.recipient_email || "").trim();
                  if (v === "" || EMAIL_RE.test(v)) {
                    patch({ recipient_email: v || null });
                  } else {
                    toast({ title: "Invalid email", variant: "destructive" });
                  }
                }}
                placeholder="Defaults to your account email"
              />
            </div>

            {ccLimit === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
                Add CC recipients with the Starter plan or higher.{" "}
                <Link
                  href="/dashboard/settings/billing"
                  className="font-semibold text-accent hover:underline"
                >
                  Upgrade
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>CC recipients</Label>
                <p className="text-[11px] text-muted-foreground">
                  You can add up to {ccLimit} CC recipient{ccLimit === 1 ? "" : "s"} on
                  your {planId} plan.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {prefs.cc_emails.map((e) => (
                    <span
                      key={e}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs"
                    >
                      {e}
                      <button
                        onClick={() => removeCc(e)}
                        aria-label={`Remove ${e}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="cc@example.com"
                    value={ccDraft}
                    onChange={(e) => setCcDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCc();
                      }
                    }}
                    disabled={prefs.cc_emails.length >= ccLimit}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addCc}
                    disabled={prefs.cc_emails.length >= ccLimit}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2.5 pt-2 border-t">
              <ToggleRow
                label="Skip empty days"
                description="Don't send a digest if there were no new reviews or pending replies."
                checked={prefs.skip_if_no_activity}
                onChange={(v) => patch({ skip_if_no_activity: v })}
              />
              <ToggleRow
                label="Include lowest-rated review"
                checked={prefs.include_lowest_rated}
                onChange={(v) => patch({ include_lowest_rated: v })}
              />
              <ToggleRow
                label="Include top keywords"
                checked={prefs.include_top_keywords}
                onChange={(v) => patch({ include_top_keywords: v })}
              />
              <ToggleRow
                label="Include AI quota usage"
                checked={prefs.include_quota_usage}
                onChange={(v) => patch({ include_quota_usage: v })}
              />
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => sendTest("daily")}
                disabled={testingDaily}
              >
                {testingDaily ? "Sending…" : "Send test digest"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Weekly digest ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Weekly digest</CardTitle>
              <CardDescription>
                A bigger-picture summary delivered once a week.
              </CardDescription>
            </div>
            <Switch
              checked={prefs.weekly_enabled}
              onCheckedChange={(v) => patch({ weekly_enabled: v })}
              aria-label="Enable weekly digest"
            />
          </div>
        </CardHeader>
        {prefs.weekly_enabled && (
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="weekly-dow">Day of week</Label>
                <Select
                  value={String(prefs.weekly_send_dow)}
                  onValueChange={(v) => patch({ weekly_send_dow: parseInt(v, 10) })}
                >
                  <SelectTrigger id="weekly-dow">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weekly-hour">Send time</Label>
                <Select
                  value={String(prefs.weekly_send_hour)}
                  onValueChange={(v) => patch({ weekly_send_hour: parseInt(v, 10) })}
                >
                  <SelectTrigger id="weekly-hour">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, h) => (
                      <SelectItem key={h} value={String(h)}>
                        {String(h).padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => sendTest("weekly")}
                disabled={testingWeekly}
              >
                {testingWeekly ? "Sending…" : "Send test digest"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Recent history ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent digests</CardTitle>
          <CardDescription>The last 7 deliveries.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No digests sent yet. Click &ldquo;Send test digest&rdquo; to preview, or
              wait for your scheduled send.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {logs.map((row) => {
                const s = statusLabel(row.status);
                return (
                  <li key={row.id} className="py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-medium capitalize">{row.digest_type}</span>
                        {row.is_test && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Test
                          </Badge>
                        )}
                      </div>
                      <Badge variant={s.variant}>{s.text}</Badge>
                    </div>
                    {row.status === "failed" && row.error_message && (
                      <p className="text-[11px] text-muted-foreground mt-1 ml-1 truncate">
                        {row.error_message}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label className="text-sm">{label}</Label>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
