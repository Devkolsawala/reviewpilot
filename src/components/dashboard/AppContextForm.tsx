"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Bot, Sparkles, Clock, Shield, Calendar, Loader2, Zap } from "lucide-react";
import { UpgradeGate } from "@/components/dashboard/UpgradeGate";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";

const MOCK_OVERRIDES_PREFIX = "reviewpilot_mock_overrides";
const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

const TONES = [
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "professional", label: "Professional", description: "Polished and formal" },
  { value: "casual", label: "Casual", description: "Relaxed and personable" },
  { value: "apologetic", label: "Apologetic", description: "Empathetic and sincere" },
  { value: "custom", label: "Custom", description: "Your own style" },
] as const;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i % 12 === 0 ? 12 : i % 12;
  const ampm = i < 12 ? "AM" : "PM";
  return { value: String(i).padStart(2, "0") + ":00", label: `${h}:00 ${ampm}` };
});

const REVIEW_AGE_OPTIONS = [
  { value: "12", label: "Last 12 hours" },
  { value: "24", label: "Last 24 hours" },
  { value: "48", label: "Last 48 hours" },
  { value: "168", label: "Last 7 days" },
];

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

interface AppContextFormProps {
  /** When provided (multi-app scenario), use this connection instead of auto-detecting. */
  connectionId?: string;
  /** When true, all save/edit actions are disabled (read-only role). */
  disabled?: boolean;
}

export function AppContextForm({ connectionId: connectionIdProp, disabled = false }: AppContextFormProps = {}) {
  const [connectionId, setConnectionId] = useState<string | null>(connectionIdProp ?? null);
  const [contextId, setContextId] = useState<string | null>(null);
  const [mockUserId, setMockUserId] = useState<string>("anon");
  const [loadingData, setLoadingData] = useState(true);

  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([""]);
  const [questions, setQuestions] = useState<string[]>([""]);
  const [issues, setIssues] = useState<string[]>([""]);
  const [tone, setTone] = useState<string>("friendly");
  const [customTone, setCustomTone] = useState("");
  const [supportUrl, setSupportUrl] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  // sync_interval removed — reviews now auto-sync every 2h for all plans

  /** manual | semi (draft_for_review) | full (auto_publish) */
  const [replyMode, setReplyMode] = useState<"manual" | "semi" | "full">("manual");
  const [draftLowSafety, setDraftLowSafety] = useState(true);
  const [ratingRange, setRatingRange] = useState([1, 5]);

  // Scheduled auto-reply
  const [scheduledEnabled, setScheduledEnabled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [timezone, setTimezone] = useState(detectTimezone());
  const [activeDays, setActiveDays] = useState<boolean[]>([true, true, true, true, true, true, true]);
  const [reviewAge, setReviewAge] = useState("24");
  const [safetyToggle, setSafetyToggle] = useState(true);

  const [saving, setSaving] = useState(false);
  const [applyingAutoReply, setApplyingAutoReply] = useState(false);
  const [autoReplyProgress, setAutoReplyProgress] = useState<{ current: number; total: number } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testReply, setTestReply] = useState("");

  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK === "true";

  // Load existing app context from Supabase
  useEffect(() => {
    async function loadContext() {
      setLoadingData(true);
      // Reset fields so stale data from the previous connection doesn't bleed through
      setContextId(null);
      setDescription(""); setFeatures([""]); setQuestions([""]); setIssues([""]);
      setTone("friendly"); setCustomTone(""); setSupportUrl(""); setAdditionalInstructions("");
      setReplyMode("manual"); setDraftLowSafety(true); setRatingRange([1, 5]);
      setScheduledEnabled(false); setScheduleTime("08:00"); setTimezone(detectTimezone());
      setActiveDays([true, true, true, true, true, true, true]);
      setReviewAge("24"); setSafetyToggle(true);

      try {
        const supabase = createClient();

        // Fetch user ID for per-user localStorage namespacing (mock mode)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setMockUserId(user.id);

        // Use prop if provided (multi-app), else auto-detect first active connection
        let connId: string | null = connectionIdProp ?? null;
        if (!connId) {
          const { data: connections } = await supabase
            .from("connections")
            .select("id")
            .eq("is_active", true)
            .limit(1);

          if (!connections || connections.length === 0) {
            setLoadingData(false);
            return;
          }
          connId = connections[0].id;
        }
        setConnectionId(connId);

        const { data: ctx } = await supabase
          .from("app_contexts")
          .select("*")
          .eq("connection_id", connId)
          .single();

        if (ctx) {
          setContextId(ctx.id);
          setDescription(ctx.description || "");
          setFeatures(ctx.key_features?.length ? ctx.key_features : [""]);
          setQuestions(ctx.common_questions?.length ? ctx.common_questions : [""]);
          setIssues(ctx.known_issues?.length ? ctx.known_issues : [""]);
          setTone(ctx.tone || "friendly");
          setCustomTone(ctx.custom_tone_example || "");
          setSupportUrl(ctx.support_url || "");
          setAdditionalInstructions(ctx.additional_instructions || "");
          if (ctx.auto_reply_enabled && ctx.auto_reply_mode === "auto_publish") {
            setReplyMode("full");
          } else if (ctx.auto_reply_enabled) {
            setReplyMode("semi");
          } else {
            setReplyMode("manual");
          }
          setDraftLowSafety(ctx.auto_reply_draft_low_ratings !== false);
          setRatingRange([ctx.auto_reply_min_rating || 1, ctx.auto_reply_max_rating || 5]);
          setScheduledEnabled(ctx.schedule_enabled || false);
          setScheduleTime(ctx.schedule_time || "08:00");
          setTimezone(ctx.schedule_timezone || detectTimezone());
          setActiveDays(ctx.schedule_days || [true, true, true, true, true, true, true]);
          setReviewAge(String(ctx.schedule_review_age_hours || 24));
          setSafetyToggle(ctx.schedule_safety_toggle !== false);
        }
      } catch (err) {
        console.error("[AppContextForm] Load error:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadContext();
  }, [connectionIdProp]); // eslint-disable-line react-hooks/exhaustive-deps

  function addItem(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, ""]);
  }

  function updateItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) {
    setter((prev) => prev.map((item, i) => (i === index ? value : item)));
  }

  function removeItem(setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleDay(i: number) {
    setActiveDays((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  const selectedDayCount = activeDays.filter(Boolean).length;

  // ── Auto-reply trigger: run after saving config ──────────────────────────────

  /** Real mode: call the fetch/sync route which now processes existing pending reviews */
  async function triggerRealAutoReply(connId: string) {
    setApplyingAutoReply(true);
    setAutoReplyProgress({ current: 0, total: 1 }); // indeterminate — server does the work
    toast({ title: "Applying auto-reply to pending reviews…", description: "AI is generating replies. This may take a moment." });
    try {
      const res = await fetch("/api/reviews/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connId }),
      });
      const data = await res.json() as { autoDrafted?: number; autoPublished?: number; syncError?: string };
      const total = (data.autoDrafted ?? 0) + (data.autoPublished ?? 0);
      setAutoReplyProgress({ current: 1, total: 1 });
      if (total > 0) {
        toast({
          title: "Auto-reply complete!",
          description: `${data.autoPublished ?? 0} published · ${data.autoDrafted ?? 0} drafted for review. Check your inbox.`,
        });
      } else {
        toast({ title: "Auto-reply ready", description: "No pending reviews to process right now." });
      }
      // Signal inbox + sidebar to refresh
      window.dispatchEvent(new CustomEvent("reviewpilot:auto-reply-complete", { detail: { published: data.autoPublished ?? 0, drafted: data.autoDrafted ?? 0 } }));
    } catch (e) {
      console.error("[auto-reply trigger]", e);
    } finally {
      setApplyingAutoReply(false);
      setAutoReplyProgress(null);
    }
  }

  /** Mock mode: process pending mock reviews client-side via AI API + localStorage */
  async function runMockAutoReply(
    currentTone: string,
    currentReplyMode: "manual" | "semi" | "full",
    currentDraftLowSafety: boolean,
    currentRatingRange: number[],
  ) {
    setApplyingAutoReply(true);
    const mockKey = `${MOCK_OVERRIDES_PREFIX}_${mockUserId}`;
    try {
      // Load current overrides (per-user key)
      let overrides: Record<string, Record<string, unknown>> = {};
      try {
        const s = localStorage.getItem(mockKey);
        if (s) overrides = JSON.parse(s) as Record<string, Record<string, unknown>>;
      } catch { /* ignore */ }

      // Dynamically import mock review data
      const [{ mockPlayReviews }, { mockGBPReviews }] = await Promise.all([
        import("@/lib/mock/mock-reviews"),
        import("@/lib/mock/mock-gbp-reviews"),
      ]);

      // Build unified list
      const allReviews = [
        ...mockPlayReviews.map((r) => ({
          id: r.id,
          source: r.source as "play_store" | "google_business",
          author_name: r.author_name,
          rating: r.rating,
          review_text: r.review_text,
          base_status: r.reply_status as string,
        })),
        ...mockGBPReviews.map((gbp, idx) => ({
          id: `gbp-mock-${idx}`,
          source: "google_business" as const,
          author_name: gbp.reviewer.displayName,
          rating: STAR_MAP[gbp.starRating] ?? 3,
          review_text: gbp.comment,
          base_status: gbp.reviewReply ? "published" : "pending",
        })),
      ];

      // Filter: only pending reviews within the rating range
      const [minRating, maxRating] = currentRatingRange;
      const pending = allReviews.filter((r) => {
        const override = overrides[r.id] as { reply_status?: string } | undefined;
        const status = override?.reply_status ?? r.base_status;
        return status === "pending" && r.rating >= minRating && r.rating <= maxRating;
      });

      if (pending.length === 0) {
        toast({ title: "Nothing to process", description: "No pending reviews match your rating filter." });
        setApplyingAutoReply(false);
        setAutoReplyProgress(null);
        return;
      }

      // Show initial progress
      setAutoReplyProgress({ current: 0, total: pending.length });

      let drafted = 0;
      let published = 0;
      let limitHit = false;
      const updatedOverrides = { ...overrides };

      for (let i = 0; i < pending.length; i++) {
        const review = pending[i];
        // Update progress before each API call
        setAutoReplyProgress({ current: i, total: pending.length });
        try {
          const res = await fetch("/api/ai/generate-reply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              review: {
                author_name: review.author_name,
                rating: review.rating,
                review_text: review.review_text,
              },
              tone: currentTone,
              source: review.source,
              appContext: {
                description,
                key_features: features.filter((f) => f.trim()),
                common_questions: questions.filter((q) => q.trim()),
                known_issues: issues.filter((i) => i.trim()),
                tone: currentTone,
                support_url: supportUrl || undefined,
                additional_instructions: additionalInstructions || undefined,
              },
            }),
          });

          // Hit usage limit — stop processing and notify
          if (res.status === 429) {
            limitHit = true;
            window.dispatchEvent(new CustomEvent("reviewpilot:usage-updated"));
            break;
          }

          if (!res.ok) continue;
          const data = await res.json() as { reply?: string };
          if (!data.reply) continue;

          // Apply safety net: always draft 1-2★ in auto_publish mode when draftLowSafety is on
          const safetyDraft = currentDraftLowSafety && review.rating <= 2 && currentReplyMode === "full";
          const newStatus = (currentReplyMode === "semi" || safetyDraft) ? "drafted" : "published";

          updatedOverrides[review.id] = {
            ...(updatedOverrides[review.id] ?? {}),
            reply_text: data.reply,
            reply_status: newStatus,
            is_auto_replied: true,
            ...(newStatus === "published" ? { reply_published_at: new Date().toISOString() } : {}),
          };

          if (newStatus === "drafted") drafted++;
          else published++;

          // Save incrementally so partial progress survives errors (per-user key)
          localStorage.setItem(mockKey, JSON.stringify(updatedOverrides));

          // Update usage counter in sidebar after each successful reply
          window.dispatchEvent(new CustomEvent("reviewpilot:usage-updated"));
        } catch (e) {
          console.error("[mock auto-reply] error for review", review.id, e);
        }
      }

      // Mark complete
      setAutoReplyProgress({ current: pending.length, total: pending.length });

      const processed = drafted + published;
      if (limitHit && processed === 0) {
        toast({
          title: "AI reply limit reached",
          description: "You've used all your AI replies for this period. Upgrade your plan or wait for the limit to reset.",
          variant: "destructive",
        });
      } else if (limitHit) {
        toast({
          title: `Replied to ${processed} review${processed !== 1 ? "s" : ""} — limit reached`,
          description: `${published} published · ${drafted} drafted. You've hit your AI reply limit. Upgrade or wait for the reset to process the rest.`,
        });
      } else {
        toast({
          title: "Auto-reply complete!",
          description: `${published} published · ${drafted} drafted for review. Go to Review Inbox to see them.`,
        });
      }

      // Signal inbox + sidebar to refresh
      window.dispatchEvent(new CustomEvent("reviewpilot:auto-reply-complete", {
        detail: { published, drafted },
      }));
    } catch (e) {
      console.error("[mock auto-reply] fatal error:", e);
    } finally {
      setApplyingAutoReply(false);
      // Keep progress at 100% briefly then clear
      setTimeout(() => setAutoReplyProgress(null), 1500);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const cleanFeatures = features.filter((f) => f.trim());
      const cleanQuestions = questions.filter((q) => q.trim());
      const cleanIssues = issues.filter((i) => i.trim());

      const payload = {
        description,
        key_features: cleanFeatures,
        common_questions: cleanQuestions,
        known_issues: cleanIssues,
        tone,
        custom_tone_example: tone === "custom" ? customTone : null,
        support_url: supportUrl || null,
        additional_instructions: additionalInstructions || null,
        auto_reply_enabled: replyMode !== "manual",
        auto_reply_mode:
          replyMode === "semi"
            ? "draft_for_review"
            : replyMode === "full"
              ? "auto_publish"
              : "manual",
        auto_reply_draft_low_ratings: draftLowSafety,
        auto_reply_min_rating: ratingRange[0],
        auto_reply_max_rating: ratingRange[1],
        schedule_enabled: scheduledEnabled,
        schedule_time: scheduleTime,
        schedule_timezone: timezone,
        schedule_days: activeDays,
        schedule_review_age_hours: parseInt(reviewAge),
        schedule_safety_toggle: safetyToggle,
        updated_at: new Date().toISOString(),
      };

      if (contextId) {
        const { error } = await supabase
          .from("app_contexts")
          .update(payload)
          .eq("id", contextId);
        if (error) throw error;
      } else if (connectionId) {
        const { data, error } = await supabase
          .from("app_contexts")
          .insert({ ...payload, connection_id: connectionId })
          .select("id")
          .single();
        if (error) throw error;
        if (data) setContextId(data.id);
      } else {
        toast({
          title: "No connection found",
          description: "Please connect a review source first in Settings → Connections.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const autoEnabled = replyMode !== "manual";
      toast({
        title: "Configuration saved",
        description: scheduledEnabled
          ? `Auto-replies scheduled daily at ${HOURS.find((h) => h.value === scheduleTime)?.label ?? scheduleTime} (${timezone})`
          : autoEnabled
            ? "AI configuration saved. Applying auto-reply to pending reviews now…"
            : "AI configuration updated successfully.",
      });

      // After saving, immediately process pending reviews if auto-reply is enabled
      if (autoEnabled) {
        setSaving(false);
        if (!isMockMode && connectionId) {
          // Real mode: process pending Supabase reviews via the sync/fetch route
          triggerRealAutoReply(connectionId).catch(console.error);
        } else {
          // Mock mode: process pending mock reviews client-side
          runMockAutoReply(tone, replyMode, draftLowSafety, ratingRange).catch(console.error);
        }
        return; // setSaving already called above
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error("[AppContextForm] Save error:", e);
      toast({
        title: "Save failed",
        description: e.message || "Could not save configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestReply() {
    if (disabled) {
      toast({
        title: "Read-only access",
        description: "You have read-only access. Ask the workspace owner to upgrade your permissions.",
        variant: "destructive",
      });
      return;
    }
    setTesting(true);
    setTestReply("");
    try {
      const res = await fetch("/api/ai/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review: {
            author_name: "Test User",
            rating: 3,
            review_text: "The app is okay but could be better. Some features are missing and it crashes sometimes.",
          },
          tone,
          source: "play_store",
          appContext: {
            description,
            key_features: features.filter((f) => f.trim()),
            common_questions: questions.filter((q) => q.trim()),
            known_issues: issues.filter((i) => i.trim()),
            tone,
            custom_tone_example: customTone || undefined,
            support_url: supportUrl || undefined,
            additional_instructions: additionalInstructions || undefined,
          },
        }),
      });
      const data = await res.json();
      setTestReply(data.reply || "Could not generate a test reply. Check your AI configuration.");
    } catch {
      setTestReply("Failed to generate test reply. Make sure the dev server is running.");
    } finally {
      setTesting(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {!connectionId && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-400">
            No connection found. Please{" "}
            <a href="/dashboard/settings/connections" className="font-semibold underline">
              connect a review source
            </a>{" "}
            first, then come back to configure AI settings.
          </p>
        </div>
      )}
      {/* Business context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-teal-500" />
            App/Business Context
          </CardTitle>
          <CardDescription>
            Help the AI understand your business so it can write better replies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>What does your app/business do?</Label>
            <Textarea
              placeholder="e.g., We're a dental clinic in Mumbai specializing in cosmetic dentistry and orthodontics..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DynamicList
            label="Key Features"
            placeholder="e.g., Online appointment booking"
            items={features}
            onAdd={() => addItem(setFeatures)}
            onUpdate={(i, v) => updateItem(setFeatures, i, v)}
            onRemove={(i) => removeItem(setFeatures, i)}
          />
          <DynamicList
            label="Common Customer Questions"
            placeholder="e.g., Do you accept insurance?"
            items={questions}
            onAdd={() => addItem(setQuestions)}
            onUpdate={(i, v) => updateItem(setQuestions, i, v)}
            onRemove={(i) => removeItem(setQuestions, i)}
          />
          <DynamicList
            label="Known Issues Being Worked On"
            placeholder="e.g., App crashes on Android 12 — fix in v2.4"
            items={issues}
            onAdd={() => addItem(setIssues)}
            onUpdate={(i, v) => updateItem(setIssues, i, v)}
            onRemove={(i) => removeItem(setIssues, i)}
          />
        </CardContent>
      </Card>

      {/* Tone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reply Tone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  tone === t.value
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30"
                    : "hover:border-teal-300"
                )}
              >
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-[11px] text-muted-foreground">{t.description}</p>
              </button>
            ))}
          </div>
          {tone === "custom" && (
            <div className="space-y-2">
              <Label>Custom Tone Example</Label>
              <Textarea
                placeholder="Paste an example reply in your preferred tone..."
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Support URL</Label>
            <Input
              placeholder="https://support.yourapp.com"
              value={supportUrl}
              onChange={(e) => setSupportUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Additional Instructions for AI</Label>
            <Textarea
              placeholder="e.g., Never mention competitor names, always suggest contacting support for refunds..."
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5 rounded-lg border bg-secondary/30 px-3.5 py-3">
            <p className="text-sm font-medium">Auto-sync schedule</p>
            <p className="text-xs text-muted-foreground">
              Reviews are automatically synced every 2 hours. Use{" "}
              <a href="/dashboard/settings/connections" className="underline">Sync Now</a>{" "}
              on the Connections page for an immediate sync.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Review Reply Mode + Scheduled Auto-Reply — gated behind inbox_auto_reply */}
      <UpgradeGate feature="inbox_auto_reply">
      {/* Review Reply Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Reply Mode</CardTitle>
          <CardDescription>
            Choose how ReviewPilot handles new reviews after sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="flex gap-3 cursor-pointer rounded-lg border p-3 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/50 dark:has-[:checked]:bg-teal-950/20">
              <input
                type="radio"
                name="replyMode"
                className="mt-1"
                checked={replyMode === "manual"}
                onChange={() => setReplyMode("manual")}
              />
              <div>
                <p className="text-sm font-medium">Manual</p>
                <p className="text-xs text-muted-foreground">
                  I&apos;ll review and reply to each review myself. AI generates suggestions when I click
                  &quot;Generate Reply&quot;.
                </p>
              </div>
            </label>
            <label className="flex gap-3 cursor-pointer rounded-lg border p-3 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/50 dark:has-[:checked]:bg-teal-950/20">
              <input
                type="radio"
                name="replyMode"
                className="mt-1"
                checked={replyMode === "semi"}
                onChange={() => setReplyMode("semi")}
              />
              <div>
                <p className="text-sm font-medium">Semi-Automated</p>
                <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">Recommended for most users</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI automatically drafts replies for new reviews. I review and approve before posting.
                </p>
              </div>
            </label>
            <label className="flex gap-3 cursor-pointer rounded-lg border p-3 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50/50 dark:has-[:checked]:bg-amber-950/20">
              <input
                type="radio"
                name="replyMode"
                className="mt-1"
                checked={replyMode === "full"}
                onChange={() => setReplyMode("full")}
              />
              <div>
                <p className="text-sm font-medium">Fully Automated</p>
                <p className="text-xs text-muted-foreground">
                  AI replies are posted automatically without my review. I can edit replies after they&apos;re live.
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Use with caution — replies go live instantly (except low-star safety below).
                </p>
              </div>
            </label>
          </div>

          {replyMode !== "manual" && (
            <>
              <div>
                <Label className="text-sm">
                  Reply to reviews rated: {ratingRange[0]}★ to {ratingRange[1]}★
                </Label>
                <Slider
                  value={ratingRange}
                  onValueChange={setRatingRange}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div className="flex items-start justify-between gap-4 rounded-lg border bg-secondary/30 p-4">
                <div>
                  <p className="text-sm font-medium">Safety net: Always draft 1–2★ reviews</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Even in fully automated mode, very negative reviews wait in your inbox as drafts.
                  </p>
                </div>
                <Switch checked={draftLowSafety} onCheckedChange={setDraftLowSafety} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Auto-Reply */}
      <Card className={cn(scheduledEnabled && "border-teal-200 dark:border-teal-800")}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-500" />
                Scheduled Auto-Replies
              </CardTitle>
              <CardDescription className="mt-1">
                Run auto-replies on a schedule — once per day at your chosen time.
              </CardDescription>
            </div>
            <Switch checked={scheduledEnabled} onCheckedChange={setScheduledEnabled} />
          </div>
        </CardHeader>

        {scheduledEnabled && (
          <CardContent className="space-y-5 pt-0">
            {/* Time + Timezone */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Run daily at
                </Label>
                <Select value={scheduleTime} onValueChange={setScheduleTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="e.g., Asia/Kolkata"
                />
                <p className="text-[11px] text-muted-foreground">
                  Auto-detected from your browser
                </p>
              </div>
            </div>

            {/* Day selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Active days
                <span className="text-[11px] text-muted-foreground font-normal ml-1">
                  ({selectedDayCount} of 7)
                </span>
              </Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(i)}
                    className={cn(
                      "h-9 w-10 rounded-lg text-xs font-medium transition-all border",
                      activeDays[i]
                        ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:border-teal-300"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Review age filter */}
            <div className="space-y-2">
              <Label>Only reply to reviews from</Label>
              <Select value={reviewAge} onValueChange={setReviewAge}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_AGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Reviews older than this window will be skipped during the scheduled run.
              </p>
            </div>

            {/* Safety toggle */}
            <div className="rounded-xl border bg-secondary/30 p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-orange-500" />
                    Require approval for negative reviews
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When ON: 1–2★ reviews get a draft saved for your review instead of publishing automatically.
                  </p>
                </div>
                <Switch checked={safetyToggle} onCheckedChange={setSafetyToggle} />
              </div>
              {safetyToggle && (
                <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 px-3 py-2">
                  <p className="text-xs text-orange-700 dark:text-orange-400">
                    Negative reviews (1–2★) will be <strong>drafted</strong> — you&apos;ll approve them manually in the inbox before they go live.
                  </p>
                </div>
              )}
              {!safetyToggle && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-3 py-2">
                  <p className="text-xs text-red-700 dark:text-red-400">
                    ⚠️ All reviews including 1–2★ will be <strong>published automatically</strong>. Make sure your AI context is complete.
                  </p>
                </div>
              )}
            </div>

            {/* Schedule summary */}
            <div className="rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 px-4 py-3">
              <p className="text-xs font-medium text-teal-800 dark:text-teal-300">Schedule summary</p>
              <p className="text-xs text-teal-700/80 dark:text-teal-400/80 mt-1">
                Auto-replies will run at{" "}
                <strong>
                  {HOURS.find((h) => h.value === scheduleTime)?.label ?? scheduleTime}
                </strong>{" "}
                on{" "}
                <strong>
                  {selectedDayCount === 7
                    ? "every day"
                    : DAYS.filter((_, i) => activeDays[i]).join(", ")}
                </strong>
                {" "}· Reviews from the <strong>last {REVIEW_AGE_OPTIONS.find(o => o.value === reviewAge)?.label.toLowerCase()}</strong>
                {" "}· Rating range: <strong>{ratingRange[0]}–{ratingRange[1]}★</strong>
                {safetyToggle ? " · Negative reviews drafted for approval" : " · All reviews published automatically"}
              </p>
            </div>
          </CardContent>
        )}
      </Card>
      </UpgradeGate>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={disabled || saving || applyingAutoReply} className="flex-1" title={disabled ? "Your role is read-only" : undefined}>
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
          ) : applyingAutoReply ? (
            <><Zap className="mr-2 h-4 w-4 animate-pulse" />Applying auto-reply…</>
          ) : (
            "Save Configuration"
          )}
        </Button>
        <Button variant="outline" onClick={handleTestReply} disabled={testing || saving || applyingAutoReply}>
          <Sparkles className="mr-2 h-4 w-4" />
          {testing ? "Generating..." : "Test AI Reply"}
          {disabled && <span className="ml-1 text-[10px] opacity-60">(read-only)</span>}
        </Button>
      </div>

      {/* ── Auto-reply progress bar ──────────────────────────────────────────── */}
      {autoReplyProgress && (
        <Card className="border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/20">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                <span className="text-xs font-medium text-teal-800 dark:text-teal-300">
                  {autoReplyProgress.current < autoReplyProgress.total
                    ? `Generating reply ${autoReplyProgress.current + 1} of ${autoReplyProgress.total}…`
                    : `Done! ${autoReplyProgress.total} replies generated.`}
                </span>
              </div>
              <span className="text-xs tabular-nums text-teal-700/70 dark:text-teal-400/70">
                {autoReplyProgress.total > 0
                  ? Math.round((autoReplyProgress.current / autoReplyProgress.total) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-teal-200/60 dark:bg-teal-900/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: autoReplyProgress.total > 0
                    ? `${(autoReplyProgress.current / autoReplyProgress.total) * 100}%`
                    : "0%",
                }}
              />
            </div>
            {autoReplyProgress.current === autoReplyProgress.total && autoReplyProgress.total > 0 && (
              <p className="text-xs text-teal-700 dark:text-teal-400">
                Inbox will refresh automatically — check the Review Inbox tab.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {testReply && (
        <Card className="border-teal-200 dark:border-teal-800">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-teal-600 mb-2">Test Reply Preview:</p>
            <p className="text-sm">{testReply}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DynamicList({
  label,
  placeholder,
  items,
  onAdd,
  onUpdate,
  onRemove,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={item}
            onChange={(e) => onUpdate(i, e.target.value)}
          />
          {items.length > 1 && (
            <Button variant="ghost" size="icon" onClick={() => onRemove(i)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={onAdd}>
        <Plus className="mr-2 h-3 w-3" />
        Add
      </Button>
    </div>
  );
}
