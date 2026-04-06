"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Smartphone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Upload,
  Loader2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Connection } from "@/types/connection";

type Mode = "choose" | "playstore" | "gbp";

// ------------- Play Store Wizard -------------

type PSStep = 1 | 2 | 3 | 4;

interface VerifyState {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  reviewCount?: number;
  step?: string;
}

export function ConnectionWizard({
  onComplete,
}: {
  onComplete?: (connection: Connection) => void;
}) {
  const [mode, setMode] = useState<Mode>("choose");

  if (mode === "choose") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-bold">Add a Review Source</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose where your reviews come from.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setMode("playstore")}
            className="text-left rounded-xl border-2 border-transparent hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 bg-card p-6 transition-all"
          >
            <Smartphone className="h-10 w-10 text-teal-500 mb-4" />
            <h3 className="font-heading text-base font-semibold mb-1">Google Play Store</h3>
            <p className="text-sm text-muted-foreground">Manage Android app reviews with a service account.</p>
            <Badge variant="secondary" className="mt-3 text-xs">Service Account JSON</Badge>
          </button>

          <button
            onClick={() => setMode("gbp")}
            className="text-left rounded-xl border-2 border-transparent hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 bg-card p-6 transition-all"
          >
            <Globe className="h-10 w-10 text-teal-500 mb-4" />
            <h3 className="font-heading text-base font-semibold mb-1">Google Business Profile</h3>
            <p className="text-sm text-muted-foreground">Manage local business reviews via Google OAuth.</p>
            <Badge variant="secondary" className="mt-3 text-xs">OAuth Connection</Badge>
          </button>
        </div>
      </div>
    );
  }

  if (mode === "gbp") {
    return <GBPWizard onBack={() => setMode("choose")} onComplete={onComplete} />;
  }

  return <PlayStoreWizard onBack={() => setMode("choose")} onComplete={onComplete} />;
}

// ─── Play Store Wizard ───────────────────────────────────────────────────────

function PlayStoreWizard({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete?: (connection: Connection) => void;
}) {
  const [step, setStep] = useState<PSStep>(1);
  const [step1Checked, setStep1Checked] = useState(false);
  const [step2Checked, setStep2Checked] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, unknown> | null>(null);
  const [credError, setCredError] = useState("");
  const [packageName, setPackageName] = useState("");
  const [appName, setAppName] = useState("");
  const [verify, setVerify] = useState<VerifyState>({ status: "idle", message: "" });
  const [savedConnection, setSavedConnection] = useState<Connection | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCredError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.client_email || !json.private_key) {
          setCredError("This doesn't look like a valid service account JSON. Make sure you downloaded the JSON key (not a .p12 file).");
          setCredentials(null);
          return;
        }
        setCredentials(json);
        if (!appName) setAppName(file.name.replace(".json", "").replace(/-/g, " "));
      } catch {
        setCredError("Could not parse this file. Make sure it's a valid JSON file.");
        setCredentials(null);
      }
    };
    reader.readAsText(file);
  }

  async function handleVerify() {
    if (!credentials || !packageName || !appName) return;
    setVerify({ status: "loading", message: "Validating credentials...", step: "credentials" });

    await new Promise((r) => setTimeout(r, 400));
    setVerify({ status: "loading", message: "Checking API access...", step: "api" });

    try {
      const res = await fetch("/api/reviews/verify-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "play_store", credentials, packageName, appName }),
      });
      const data = await res.json();

      if (!data.valid) {
        setVerify({ status: "error", message: data.error });
        return;
      }

      // The API route now saves the connection server-side.
      // Fetch the saved connection so we can pass it to onComplete.
      const supabase = createClient();
      const { data: conn } = await supabase
        .from("connections")
        .select("*")
        .eq("id", data.connectionId)
        .single();

      setVerify({
        status: "success",
        message: data.message,
        reviewCount: data.reviewCount,
      });
      setSavedConnection((conn as Connection) || {
        id: data.connectionId,
        user_id: "",
        type: "play_store" as const,
        name: appName,
        external_id: packageName,
        is_active: true,
        created_at: new Date().toISOString(),
      });
      setStep(4);
    } catch (err) {
      console.error("[ConnectionWizard] Verification error:", err);
      setVerify({ status: "error", message: "Unexpected error during verification. Please try again." });
    }
  }

  // Step 1
  if (step === 1) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <StepBadge current={1} total={4} />
            <CardTitle className="text-base">Create a Service Account</CardTitle>
          </div>
          <CardDescription>First, set up a service account in Google Cloud (takes ~2 minutes)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 p-3.5">
            <p className="text-xs font-medium text-teal-800 dark:text-teal-300 mb-1">💡 What is a service account?</p>
            <p className="text-xs text-teal-700/80 dark:text-teal-400/70">
              It&apos;s like a robot assistant that ReviewPilot uses to read your reviews and post replies. You control exactly what it can access.
            </p>
          </div>

          <ol className="space-y-3 text-sm">
            {[
              <>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="h-3 w-3" /></a></>,
              <>Go to <strong>IAM &amp; Admin</strong> → <strong>Service Accounts</strong> → <strong>Create Service Account</strong></>,
              <>Name it <strong>&quot;ReviewPilot&quot;</strong>, skip the role step, click <strong>Done</strong></>,
              <>Click on the service account → <strong>Keys</strong> tab → <strong>Add Key</strong> → <strong>Create new key</strong> → <strong>JSON</strong></>,
              <>A JSON file will download to your computer — you&apos;ll upload it in Step 3</>,
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
              checked={step1Checked}
              onChange={(e) => setStep1Checked(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm">I&apos;ve downloaded the JSON key file</span>
          </label>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(2)} disabled={!step1Checked}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <a href="https://cloud.google.com/iam/docs/service-accounts-create" target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-muted-foreground hover:text-teal-600 underline underline-offset-2">Need help?</a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2
  if (step === 2) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <StepBadge current={2} total={4} />
            <CardTitle className="text-base">Grant Review Permissions</CardTitle>
          </div>
          <CardDescription>Give ReviewPilot permission to read and reply to your reviews</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3.5">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">🔒 Permission scope</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/70">
              We only request read access to reviews + ability to post replies. We cannot access your app code, finances, or account settings.
            </p>
          </div>

          <ol className="space-y-3 text-sm">
            {[
              <>Go to <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline inline-flex items-center gap-0.5">Google Play Console <ExternalLink className="h-3 w-3" /></a></>,
              <>Click <strong>Users and Permissions</strong> in the left sidebar</>,
              <>Click <strong>Invite new users</strong></>,
              <>In the email field, paste the <strong>client_email</strong> from your downloaded JSON file</>,
              <>Enable only: <strong>View app information (read-only)</strong> and <strong>Reply to reviews</strong></>,
              <>Click <strong>Invite user</strong> → <strong>Send invitation</strong></>,
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
              checked={step2Checked}
              onChange={(e) => setStep2Checked(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm">I&apos;ve invited the service account and granted permissions</span>
          </label>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!step2Checked}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <a href="https://support.google.com/googleplay/android-developer/answer/9844686" target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-muted-foreground hover:text-teal-600 underline underline-offset-2">Need help?</a>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 3: Upload & Verify
  if (step === 3) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <StepBadge current={3} total={4} />
            <CardTitle className="text-base">Upload &amp; Verify</CardTitle>
          </div>
          <CardDescription>Upload your service account key and enter your app details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File upload */}
          <div className="space-y-2">
            <Label>Service Account JSON Key</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                credentials
                  ? "border-teal-400 bg-teal-50/50 dark:bg-teal-950/20"
                  : "border-border hover:border-teal-400 hover:bg-teal-50/30 dark:hover:bg-teal-950/10"
              )}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
              {credentials ? (
                <div className="flex items-center justify-center gap-2 text-teal-700 dark:text-teal-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Service account loaded</p>
                    <p className="text-xs text-muted-foreground">{credentials.client_email as string}</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Drop your service-account.json here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                </>
              )}
            </div>
            {credError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <XCircle className="h-3 w-3" /> {credError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>App Name</Label>
            <Input
              placeholder="My Awesome App"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Package Name</Label>
            <Input
              placeholder="com.yourcompany.appname"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in Play Console → Your App → Dashboard. Example: <code>com.example.myapp</code>
            </p>
          </div>

          {/* Verification status */}
          {verify.status !== "idle" && (
            <div className={cn(
              "rounded-lg border p-3 flex items-start gap-2.5 text-sm",
              verify.status === "loading" && "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800",
              verify.status === "success" && "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800",
              verify.status === "error" && "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800",
            )}>
              {verify.status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-blue-500 mt-0.5 shrink-0" />}
              {verify.status === "success" && <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />}
              {verify.status === "error" && <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
              <p className={cn(
                verify.status === "loading" && "text-blue-700 dark:text-blue-400",
                verify.status === "success" && "text-green-700 dark:text-green-400",
                verify.status === "error" && "text-red-700 dark:text-red-400",
              )}>
                {verify.message}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} disabled={verify.status === "loading"}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!credentials || !packageName || !appName || verify.status === "loading"}
              className="flex-1"
            >
              {verify.status === "loading" ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {verify.message}</>
              ) : (
                <>Verify &amp; Connect <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 4: Success
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="rounded-2xl bg-green-50 dark:bg-green-950/30 p-5 w-fit mx-auto mb-5">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        </div>
        <h3 className="font-heading text-xl font-bold mb-2">Connected!</h3>
        <p className="text-sm text-muted-foreground mb-1">
          <strong>{appName}</strong> on Play Store
        </p>
        {typeof verify.reviewCount === "number" && (
          <p className="text-xs text-muted-foreground mb-6">
            {verify.reviewCount > 0 ? `${verify.reviewCount} reviews found and ready to manage.` : "Ready to fetch reviews. Click 'Sync Now' to load them."}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <Button onClick={() => onComplete?.(savedConnection!)}>
            Go to Review Inbox <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => { /* navigate to AI config */ window.location.href = "/dashboard/settings/ai-config"; }}>
            Configure AI Replies
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── GBP Wizard ──────────────────────────────────────────────────────────────

function GBPWizard({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete?: (connection: Connection) => void;
}) {
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConnect() {
    if (!businessName) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    // Ensure profile row exists
    await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

    const { data: conn, error } = await supabase
      .from("connections")
      .insert({
        user_id: user.id,
        type: "google_business",
        name: businessName,
        is_active: true,
        review_count: 0,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error("[GBP connect] Insert error:", error);
      return;
    }

    onComplete?.(conn as Connection);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-5 w-5 text-teal-500" />
          Connect Google Business Profile
        </CardTitle>
        <CardDescription>
          OAuth-based connection. Full setup requires GBP API approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            GBP API access is pending approval. Save your business name now and we&apos;ll activate live syncing once approved. Reviews will show mock data in the meantime.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Business Name</Label>
          <Input
            placeholder="My Restaurant / Clinic / Shop"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={handleConnect} disabled={saving || !businessName}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <>Save Connection <ArrowRight className="ml-2 h-4 w-4" /></>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StepBadge({ current, total }: { current: number; total: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-teal-100 dark:bg-teal-950/40 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
      Step {current}/{total}
    </span>
  );
}
