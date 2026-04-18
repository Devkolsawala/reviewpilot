"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Card,
 CardContent,
 CardHeader,
 CardTitle,
 CardDescription,
} from "@/components/ui/card";
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
 Copy,
 Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";
import { GBP_ENABLED, GBP_STATUS_LABEL, GBP_COMING_SOON_MESSAGE } from "@/lib/feature-flags";
import type { Connection } from "@/types/connection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Mode = "choose" | "playstore" | "gbp";
type PSMethod = "invite_email" | "own_service_account";

interface VerifyState {
 status: "idle" | "loading" | "success" | "error";
 message: string;
 reviewCount?: number;
}

// ---------------------------------------------------------------------------
// Root wizard — choose a source
// ---------------------------------------------------------------------------

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
 <h2 className="font-sans text- font-semibold tracking-tight">Add a Review Source</h2>
 <p className="text-sm text-muted-foreground mt-1">
 Choose where your reviews come from.
 </p>
 </div>
 <div className="grid gap-4 sm:grid-cols-2">
 <button
 onClick={() => setMode("playstore")}
 className="text-left rounded-xl border-2 border-transparent hover:border-accent/40 hover:bg-accent/10 dark:hover:bg-accent/15 bg-card p-6 transition-all"
 >
 <Smartphone className="h-10 w-10 text-accent mb-4" />
 <h3 className="font-sans tracking-tight text-base font-semibold mb-1">
 Google Play Store
 </h3>
 <p className="text-sm text-muted-foreground">
 Manage Android app reviews from Play Console.
 </p>
 <Badge variant="secondary" className="mt-3 text-xs">
 Quick setup
 </Badge>
 </button>

 <TooltipProvider delayDuration={150}>
 <Tooltip>
 <TooltipTrigger asChild>
 <button
 onClick={() => GBP_ENABLED && setMode("gbp")}
 disabled={!GBP_ENABLED}
 aria-disabled={!GBP_ENABLED}
 className={cn(
 "text-left rounded-xl border-2 border-transparent bg-card p-6 transition-all",
 GBP_ENABLED
 ? "hover:border-accent/40 hover:bg-accent/10 dark:hover:bg-accent/15"
 : "opacity-60 cursor-not-allowed"
 )}
 >
 <Globe className="h-10 w-10 text-accent mb-4" />
 <div className="flex items-center gap-2 mb-1 flex-wrap">
 <h3 className="font-sans tracking-tight text-base font-semibold">
 Google Business Profile
 </h3>
 {!GBP_ENABLED && (
 <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
 {GBP_STATUS_LABEL}
 </Badge>
 )}
 </div>
 <p className="text-sm text-muted-foreground">
 Manage local business reviews via Google OAuth.
 </p>
 <Badge variant="secondary" className="mt-3 text-xs">
 OAuth Connection
 </Badge>
 </button>
 </TooltipTrigger>
 {!GBP_ENABLED && (
 <TooltipContent side="top" className="max-w-xs">
 {GBP_COMING_SOON_MESSAGE}
 </TooltipContent>
 )}
 </Tooltip>
 </TooltipProvider>
 </div>
 </div>
 );
 }

 if (mode === "gbp") {
 return <GBPWizard onBack={() => setMode("choose")} onComplete={onComplete} />;
 }

 return (
 <PlayStoreWizard onBack={() => setMode("choose")} onComplete={onComplete} />
 );
}

// ---------------------------------------------------------------------------
// Play Store Wizard — two-tab approach
// ---------------------------------------------------------------------------

function PlayStoreWizard({
 onBack,
 onComplete,
}: {
 onBack: () => void;
 onComplete?: (connection: Connection) => void;
}) {
 const [method, setMethod] = useState<PSMethod>("invite_email");

 return (
 <div className="space-y-4">
 {/* Method tabs */}
 <div className="grid grid-cols-2 gap-2">
 <button
 onClick={() => setMethod("invite_email")}
 className={cn(
 "rounded-xl border-2 p-4 text-left transition-all",
 method === "invite_email"
 ? "border-accent/40 bg-accent/10 dark:bg-accent/10"
 : "border-border hover:border-accent/40 bg-card"
 )}
 >
 <div className="flex items-center gap-2 mb-1">
 <span
 className={cn(
 "h-3 w-3 rounded-full border-2",
 method === "invite_email"
 ? "border-accent/40 bg-accent"
 : "border-muted-foreground"
 )}
 />
 <span className="text-sm font-semibold">Invite Email</span>
 <Badge
 variant="secondary"
 className="text-[10px] bg-accent/10 text-accent dark:bg-accent/10 dark:text-accent"
 >
 Recommended
 </Badge>
 </div>
 <p className="text-xs text-muted-foreground pl-5">
 Quick &amp; easy — no service account setup
 </p>
 </button>

 <button
 onClick={() => setMethod("own_service_account")}
 className={cn(
 "rounded-xl border-2 p-4 text-left transition-all",
 method === "own_service_account"
 ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/20"
 : "border-border hover:border-blue-300 bg-card"
 )}
 >
 <div className="flex items-center gap-2 mb-1">
 <span
 className={cn(
 "h-3 w-3 rounded-full border-2",
 method === "own_service_account"
 ? "border-blue-500 bg-blue-500"
 : "border-muted-foreground"
 )}
 />
 <span className="text-sm font-semibold">Own Service Account</span>
 <Badge variant="secondary" className="text-[10px]">
 Advanced
 </Badge>
 </div>
 <p className="text-xs text-muted-foreground pl-5">
 Use your own Google Cloud credentials
 </p>
 </button>
 </div>

 {/* Wizard body */}
 {method === "invite_email" ? (
 <InviteEmailWizard onBack={onBack} onComplete={onComplete} />
 ) : (
 <OwnServiceAccountWizard onBack={onBack} onComplete={onComplete} />
 )}
 </div>
 );
}

// ---------------------------------------------------------------------------
// Method 1 — Invite Email (3 steps)
// ---------------------------------------------------------------------------

function InviteEmailWizard({
 onBack,
 onComplete,
}: {
 onBack: () => void;
 onComplete?: (connection: Connection) => void;
}) {
 const [step, setStep] = useState<1 | 2 | 3>(1);
 const [inviteChecked, setInviteChecked] = useState(false);
 const [packageName, setPackageName] = useState("");
 const [appName, setAppName] = useState("");
 const [verify, setVerify] = useState<VerifyState>({
 status: "idle",
 message: "",
 });
 const [savedConnection, setSavedConnection] = useState<Connection | null>(
 null
 );
 const [copied, setCopied] = useState(false);

 const serviceAccountEmail =
 process.env.NEXT_PUBLIC_PLAY_SERVICE_ACCOUNT_EMAIL || "Not configured yet";

 function handleCopy() {
 navigator.clipboard.writeText(serviceAccountEmail).then(() => {
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 });
 }

 async function handleVerify() {
 if (!packageName || !appName) return;
 setVerify({ status: "loading", message: "Checking credentials..." });

 await new Promise((r) => setTimeout(r, 800));
 setVerify({ status: "loading", message: "Connecting to Play Store..." });

 try {
 const res = await fetch("/api/reviews/verify-connection", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 type: "play_store",
 packageName,
 appName,
 connectionMethod: "invite_email",
 }),
 });
 const data = await res.json();

 if (!data.valid) {
 setVerify({ status: "error", message: data.error });
 return;
 }

 setVerify({
 status: "success",
 message: data.message,
 reviewCount: data.reviewCount,
 });

 const supabase = createClient();
 const { data: conn } = await supabase
 .from("connections")
 .select("*")
 .eq("id", data.connectionId)
 .single();

 setSavedConnection(
 (conn as Connection) || {
 id: data.connectionId,
 user_id: "",
 type: "play_store" as const,
 name: appName,
 external_id: packageName,
 is_active: true,
 created_at: new Date().toISOString(),
 }
 );
 setStep(3);
 } catch (err) {
 console.error("[ConnectionWizard] Verification error:", err);
 setVerify({
 status: "error",
 message: "Unexpected error. Please try again.",
 });
 }
 }

 // ── Step 1: Invite the email ──────────────────────────────────────────────
 if (step === 1) {
 return (
 <Card>
 <CardHeader>
 <div className="flex items-center gap-2 mb-1">
 <StepBadge current={1} total={3} />
 <CardTitle className="text-base">
 Invite ReviewPilot to your Play Console
 </CardTitle>
 </div>
 <CardDescription>
 Copy our service account email and invite it in Play Console
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {/* Email copy box */}
 <div className="space-y-1.5">
 <Label className="text-xs text-muted-foreground">
 ReviewPilot service account email
 </Label>
 <div className="flex items-center gap-2 rounded-lg border bg-secondary/40 px-3 py-2.5">
 <code className="flex-1 text-sm font-mono text-foreground break-all">
 {serviceAccountEmail}
 </code>
 <button
 onClick={handleCopy}
 className="shrink-0 rounded-md p-1.5 hover:bg-secondary transition-colors"
 title="Copy email"
 >
 {copied ? (
 <Check className="h-4 w-4 text-accent" />
 ) : (
 <Copy className="h-4 w-4 text-muted-foreground" />
 )}
 </button>
 </div>
 </div>

 {/* Instructions */}
 <ol className="space-y-3 text-sm">
 {[
 <>
 Open{" "}
 <a
 href="https://play.google.com/console"
 target="_blank"
 rel="noopener noreferrer"
 className="text-accent hover:underline inline-flex items-center gap-0.5"
 >
 Google Play Console <ExternalLink className="h-3 w-3" />
 </a>
 </>,
 <>
 Click <strong>Users and permissions</strong> in the left sidebar
 </>,
 <>
 Click <strong>Invite new users</strong>
 </>,
 <>
 Paste the email above into the email field
 </>,
 <>
 Under <strong>Account permissions</strong>, enable both:
 <ul className="mt-1.5 space-y-1 pl-2">
 <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
 View app information and download bulk reports (read-only)
 </li>
 <li className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
 Reply to reviews
 </li>
 </ul>
 </>,
 <>
 Click <strong>Invite user</strong> then{" "}
 <strong>Send invitation</strong>
 </>,
 ].map((item, i) => (
 <li key={i} className="flex gap-3">
 <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold mt-0.5">
 {i + 1}
 </span>
 <span className="text-muted-foreground leading-snug">
 {item}
 </span>
 </li>
 ))}
 </ol>

 {/* Privacy callout */}
 <div className="rounded-lg bg-accent/10 dark:bg-accent/10 border border-accent/40 dark:border-accent/40 p-3.5">
 <p className="text-xs text-accent dark:text-accent">
 This gives ReviewPilot read-only access to your reviews and the
 ability to post replies. We cannot access your app code, financial
 data, or publishing settings. You can revoke access anytime by
 removing the invited user.
 </p>
 </div>

 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={inviteChecked}
 onChange={(e) => setInviteChecked(e.target.checked)}
 className="rounded border-border"
 />
 <span className="text-sm">
 I&apos;ve invited the email and granted both permissions
 </span>
 </label>

 <div className="flex items-center gap-2">
 <Button variant="outline" onClick={onBack}>
 <ArrowLeft className="mr-2 h-4 w-4" /> Back
 </Button>
 <Button onClick={() => setStep(2)} disabled={!inviteChecked}>
 Next <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 </CardContent>
 </Card>
 );
 }

 // ── Step 2: Enter app details & verify ───────────────────────────────────
 if (step === 2) {
 return (
 <Card>
 <CardHeader>
 <div className="flex items-center gap-2 mb-1">
 <StepBadge current={2} total={3} />
 <CardTitle className="text-base">Enter your app details</CardTitle>
 </div>
 <CardDescription>
 Enter your package name and we&apos;ll verify the connection
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label>App package name</Label>
 <Input
 placeholder="com.example.myapp"
 value={packageName}
 onChange={(e) => setPackageName(e.target.value)}
 />
 <p className="text-xs text-muted-foreground">
 Find this in Play Console → All apps → select your app. The
 package name is shown at the top (e.g.,{" "}
 <code>com.whatsapp</code>)
 </p>
 </div>

 <div className="space-y-2">
 <Label>App name (for your reference)</Label>
 <Input
 placeholder="My Awesome App"
 value={appName}
 onChange={(e) => setAppName(e.target.value)}
 />
 </div>

 {/* Verification status */}
 {verify.status !== "idle" && (
 <div
 className={cn(
 "rounded-lg border p-3 flex items-start gap-2.5 text-sm",
 verify.status === "loading" &&
 "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800",
 verify.status === "success" &&
 "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800",
 verify.status === "error" &&
 "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
 )}
 >
 {verify.status === "loading" && (
 <Loader2 className="h-4 w-4 animate-spin text-blue-500 mt-0.5 shrink-0" />
 )}
 {verify.status === "success" && (
 <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
 )}
 {verify.status === "error" && (
 <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
 )}
 <div className="flex-1">
 <p
 className={cn(
 verify.status === "loading" &&
 "text-blue-700 dark:text-blue-400",
 verify.status === "success" &&
 "text-green-700 dark:text-green-400",
 verify.status === "error" &&
 "text-red-700 dark:text-red-400"
 )}
 >
 {verify.message}
 </p>
 {verify.status === "error" && (
 <button
 onClick={() =>
 setVerify({ status: "idle", message: "" })
 }
 className="mt-1.5 text-xs underline text-red-600 dark:text-red-400"
 >
 Try Again
 </button>
 )}
 </div>
 </div>
 )}

 <div className="flex gap-2">
 <Button
 variant="outline"
 onClick={() => setStep(1)}
 disabled={verify.status === "loading"}
 >
 <ArrowLeft className="mr-2 h-4 w-4" /> Back
 </Button>
 <Button
 onClick={handleVerify}
 disabled={
 !packageName || !appName || verify.status === "loading"
 }
 className="flex-1 bg-accent hover:bg-accent/90 text-white"
 >
 {verify.status === "loading" ? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
 {verify.message}
 </>
 ) : (
 <>
 Verify Connection <ArrowRight className="ml-2 h-4 w-4" />
 </>
 )}
 </Button>
 </div>
 </CardContent>
 </Card>
 );
 }

 // ── Step 3: Success ───────────────────────────────────────────────────────
 return (
 <SuccessScreen
 appName={appName}
 reviewCount={verify.reviewCount}
 savedConnection={savedConnection}
 onComplete={onComplete}
 />
 );
}

// ---------------------------------------------------------------------------
// Method 2 — Own Service Account (4 steps)
// ---------------------------------------------------------------------------

function OwnServiceAccountWizard({
 onBack,
 onComplete,
}: {
 onBack: () => void;
 onComplete?: (connection: Connection) => void;
}) {
 const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
 const [step1Checked, setStep1Checked] = useState(false);
 const [step2Checked, setStep2Checked] = useState(false);
 const [credentials, setCredentials] = useState<Record<
 string,
 unknown
 > | null>(null);
 const [credError, setCredError] = useState("");
 const [packageName, setPackageName] = useState("");
 const [appName, setAppName] = useState("");
 const [verify, setVerify] = useState<VerifyState>({
 status: "idle",
 message: "",
 });
 const [savedConnection, setSavedConnection] = useState<Connection | null>(
 null
 );
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
 setCredError(
 "This doesn't look like a valid service account JSON. Make sure you downloaded the JSON key (not a .p12 file)."
 );
 setCredentials(null);
 return;
 }
 setCredentials(json);
 if (!appName)
 setAppName(file.name.replace(".json", "").replace(/-/g, " "));
 } catch {
 setCredError(
 "Could not parse this file. Make sure it's a valid JSON file."
 );
 setCredentials(null);
 }
 };
 reader.readAsText(file);
 }

 async function handleVerify() {
 if (!credentials || !packageName || !appName) return;
 setVerify({ status: "loading", message: "Validating credentials..." });

 await new Promise((r) => setTimeout(r, 400));
 setVerify({ status: "loading", message: "Connecting to Play Store..." });

 try {
 const res = await fetch("/api/reviews/verify-connection", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 type: "play_store",
 packageName,
 appName,
 connectionMethod: "own_service_account",
 credentials,
 }),
 });
 const data = await res.json();

 if (!data.valid) {
 setVerify({ status: "error", message: data.error });
 return;
 }

 setVerify({
 status: "success",
 message: data.message,
 reviewCount: data.reviewCount,
 });

 const supabase = createClient();
 const { data: conn } = await supabase
 .from("connections")
 .select("*")
 .eq("id", data.connectionId)
 .single();

 setSavedConnection(
 (conn as Connection) || {
 id: data.connectionId,
 user_id: "",
 type: "play_store" as const,
 name: appName,
 external_id: packageName,
 is_active: true,
 created_at: new Date().toISOString(),
 }
 );
 setStep(4);
 } catch (err) {
 console.error("[ConnectionWizard] Verification error:", err);
 setVerify({
 status: "error",
 message: "Unexpected error. Please try again.",
 });
 }
 }

 // ── Step 1: Create service account ───────────────────────────────────────
 if (step === 1) {
 return (
 <Card>
 <CardHeader>
 <div className="flex items-center gap-2 mb-1">
 <StepBadge current={1} total={4} />
 <CardTitle className="text-base">Create a Service Account</CardTitle>
 </div>
 <CardDescription>
 Set up a service account in Google Cloud (~2 minutes)
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="rounded-lg bg-secondary/50 border p-3.5">
 <p className="text-xs text-muted-foreground">
 This takes about 2 minutes. Keep the downloaded JSON file safe —
 you&apos;ll upload it in Step 3.
 </p>
 </div>

 <ol className="space-y-3 text-sm">
 {[
 <>
 Go to{" "}
 <a
 href="https://console.cloud.google.com/iam-admin/serviceaccounts"
 target="_blank"
 rel="noopener noreferrer"
 className="text-accent hover:underline inline-flex items-center gap-0.5"
 >
 Google Cloud Console → IAM &amp; Admin → Service Accounts{" "}
 <ExternalLink className="h-3 w-3" />
 </a>
 </>,
 <>
 Click <strong>Create Service Account</strong>
 </>,
 <>
 Name it anything (e.g., <strong>&quot;ReviewPilot&quot;</strong>
 ), click <strong>Create and Continue</strong> → skip role →{" "}
 <strong>Done</strong>
 </>,
 <>
 Click on the new service account → <strong>Keys</strong> tab
 </>,
 <>
 <strong>Add Key</strong> → <strong>Create new key</strong> →{" "}
 <strong>JSON</strong> → <strong>Create</strong>
 </>,
 <>A JSON file will download — you&apos;ll upload it in Step 3</>,
 ].map((item, i) => (
 <li key={i} className="flex gap-3">
 <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold mt-0.5">
 {i + 1}
 </span>
 <span className="text-muted-foreground leading-snug">
 {item}
 </span>
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
 <span className="text-sm">
 I&apos;ve downloaded my JSON key file
 </span>
 </label>

 <div className="flex items-center gap-2">
 <Button variant="outline" onClick={onBack}>
 <ArrowLeft className="mr-2 h-4 w-4" /> Back
 </Button>
 <Button onClick={() => setStep(2)} disabled={!step1Checked}>
 Next <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 </CardContent>
 </Card>
 );
 }

 // ── Step 2: Grant permissions ─────────────────────────────────────────────
 if (step === 2) {
 return (
 <Card>
 <CardHeader>
 <div className="flex items-center gap-2 mb-1">
 <StepBadge current={2} total={4} />
 <CardTitle className="text-base">Grant Permissions in Play Console</CardTitle>
 </div>
 <CardDescription>
 Invite your service account email to your Play Console
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3.5">
 <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">
 🔒 Permission scope
 </p>
 <p className="text-xs text-amber-700/80 dark:text-amber-400/70">
 We only request read access to reviews + the ability to post
 replies. We cannot access your app code, finances, or account
 settings.
 </p>
 </div>

 <ol className="space-y-3 text-sm">
 {[
 <>
 Open{" "}
 <a
 href="https://play.google.com/console"
 target="_blank"
 rel="noopener noreferrer"
 className="text-accent hover:underline inline-flex items-center gap-0.5"
 >
 Google Play Console <ExternalLink className="h-3 w-3" />
 </a>{" "}
 → <strong>Users and permissions</strong>
 </>,
 <>
 Click <strong>Invite new users</strong>
 </>,
 <>
 Paste the <strong>client_email</strong> from your JSON file
 into the email field
 </>,
 <>
 Enable: <strong>View app information</strong> and{" "}
 <strong>Reply to reviews</strong>
 </>,
 <>
 Click <strong>Invite user</strong> → <strong>Send invitation</strong>
 </>,
 ].map((item, i) => (
 <li key={i} className="flex gap-3">
 <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold mt-0.5">
 {i + 1}
 </span>
 <span className="text-muted-foreground leading-snug">
 {item}
 </span>
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
 <span className="text-sm">
 I&apos;ve invited the service account and granted permissions
 </span>
 </label>

 <div className="flex items-center gap-2">
 <Button variant="outline" onClick={() => setStep(1)}>
 <ArrowLeft className="mr-2 h-4 w-4" /> Back
 </Button>
 <Button onClick={() => setStep(3)} disabled={!step2Checked}>
 Next <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 </CardContent>
 </Card>
 );
 }

 // ── Step 3: Upload & Verify ───────────────────────────────────────────────
 if (step === 3) {
 return (
 <Card>
 <CardHeader>
 <div className="flex items-center gap-2 mb-1">
 <StepBadge current={3} total={4} />
 <CardTitle className="text-base">Upload &amp; Verify</CardTitle>
 </div>
 <CardDescription>
 Upload your JSON key and enter your app details
 </CardDescription>
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
 ? "border-accent/40 bg-accent/10 dark:bg-accent/10"
 : "border-border hover:border-accent/40 hover:bg-accent/10 dark:hover:bg-accent/15"
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
 <div className="flex items-center justify-center gap-2 text-accent dark:text-accent">
 <CheckCircle2 className="h-5 w-5" />
 <div className="text-left">
 <p className="text-sm font-medium">Service account loaded</p>
 <p className="text-xs text-muted-foreground">
 {credentials.client_email as string}
 </p>
 </div>
 </div>
 ) : (
 <>
 <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
 <p className="text-sm font-medium">
 Drop your service-account.json here
 </p>
 <p className="text-xs text-muted-foreground mt-1">
 or click to browse
 </p>
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
 <Label>App package name</Label>
 <Input
 placeholder="com.example.myapp"
 value={packageName}
 onChange={(e) => setPackageName(e.target.value)}
 />
 <p className="text-xs text-muted-foreground">
 Find this in Play Console → All apps → select your app
 </p>
 </div>

 <div className="space-y-2">
 <Label>App name (for your reference)</Label>
 <Input
 placeholder="My Awesome App"
 value={appName}
 onChange={(e) => setAppName(e.target.value)}
 />
 </div>

 {/* Verification status */}
 {verify.status !== "idle" && (
 <div
 className={cn(
 "rounded-lg border p-3 flex items-start gap-2.5 text-sm",
 verify.status === "loading" &&
 "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800",
 verify.status === "success" &&
 "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800",
 verify.status === "error" &&
 "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
 )}
 >
 {verify.status === "loading" && (
 <Loader2 className="h-4 w-4 animate-spin text-blue-500 mt-0.5 shrink-0" />
 )}
 {verify.status === "success" && (
 <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
 )}
 {verify.status === "error" && (
 <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
 )}
 <div className="flex-1">
 <p
 className={cn(
 verify.status === "loading" &&
 "text-blue-700 dark:text-blue-400",
 verify.status === "success" &&
 "text-green-700 dark:text-green-400",
 verify.status === "error" &&
 "text-red-700 dark:text-red-400"
 )}
 >
 {verify.message}
 </p>
 {verify.status === "error" && (
 <button
 onClick={() =>
 setVerify({ status: "idle", message: "" })
 }
 className="mt-1.5 text-xs underline text-red-600 dark:text-red-400"
 >
 Try Again
 </button>
 )}
 </div>
 </div>
 )}

 <div className="flex gap-2">
 <Button
 variant="outline"
 onClick={() => setStep(2)}
 disabled={verify.status === "loading"}
 >
 <ArrowLeft className="mr-2 h-4 w-4" /> Back
 </Button>
 <Button
 onClick={handleVerify}
 disabled={
 !credentials || !packageName || !appName || verify.status === "loading"
 }
 className="flex-1"
 >
 {verify.status === "loading" ? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
 {verify.message}
 </>
 ) : (
 <>
 Verify &amp; Connect <ArrowRight className="ml-2 h-4 w-4" />
 </>
 )}
 </Button>
 </div>
 </CardContent>
 </Card>
 );
 }

 // ── Step 4: Success ───────────────────────────────────────────────────────
 return (
 <SuccessScreen
 appName={appName}
 reviewCount={verify.reviewCount}
 savedConnection={savedConnection}
 onComplete={onComplete}
 />
 );
}

// ---------------------------------------------------------------------------
// Shared success screen
// ---------------------------------------------------------------------------

function SuccessScreen({
 appName,
 reviewCount,
 savedConnection,
 onComplete,
}: {
 appName: string;
 reviewCount?: number;
 savedConnection: Connection | null;
 onComplete?: (connection: Connection) => void;
}) {
 return (
 <Card>
 <CardContent className="p-8 text-center">
 <div className="rounded-2xl bg-green-50 dark:bg-green-950/30 p-5 w-fit mx-auto mb-5">
 <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
 </div>
 <h3 className="font-sans text- font-semibold tracking-tight mb-2">
 You&apos;re all set!
 </h3>
 <p className="text-sm text-muted-foreground mb-1">
 ReviewPilot is now connected to <strong>{appName}</strong> on Play
 Store
 </p>
 {typeof reviewCount === "number" && (
 <p className="text-xs text-muted-foreground mb-6">
 {reviewCount > 0
 ? `${reviewCount} reviews found and ready to manage.`
 : "Ready to fetch reviews — click 'Sync Now' to load them."}
 </p>
 )}
 <div className="flex gap-2 justify-center flex-wrap">
 <Button
 className="bg-accent hover:bg-accent/90 text-white"
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

// ---------------------------------------------------------------------------
// GBP Wizard — 3-step manual connection flow
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GBP validation helpers
// ---------------------------------------------------------------------------

function validateGBPEmail(email: string): string {
 if (!email.trim()) return "Email is required";
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
 return "Enter a valid email address (e.g. owner@yourbusiness.com)";
 return "";
}

function validateMapsUrl(url: string): string {
 if (!url.trim()) return "Google Maps URL is required";
 const isGoogleMaps =
 /maps\.google\./i.test(url) ||
 /google\.[a-z.]+\/maps/i.test(url) ||
 /goo\.gl\/maps/i.test(url) ||
 /maps\.app\.goo\.gl/i.test(url);
 if (!isGoogleMaps)
 return "Must be a Google Maps link — search your business on Google Maps, click Share, and copy the link";
 return "";
}

function validateBusinessName(name: string): string {
 if (!name.trim()) return "Business name is required";
 if (name.trim().length < 2) return "Business name must be at least 2 characters";
 return "";
}

function GBPWizard({
 onBack,
 onComplete,
}: {
 onBack: () => void;
 onComplete?: (connection: Connection) => void;
}) {
 const [step, setStep] = useState<1 | 2 | 3>(1);
 const [businessName, setBusinessName] = useState("");
 const [mapsUrl, setMapsUrl] = useState("");
 const [address, setAddress] = useState("");
 const [contactEmail, setContactEmail] = useState("");
 const [touched, setTouched] = useState({ businessName: false, mapsUrl: false, contactEmail: false });
 const [saving, setSaving] = useState(false);
 const [saveError, setSaveError] = useState("");
 const [savedConnection, setSavedConnection] = useState<Connection | null>(null);

 const nameError = touched.businessName ? validateBusinessName(businessName) : "";
 const mapsError = touched.mapsUrl ? validateMapsUrl(mapsUrl) : "";
 const emailError = touched.contactEmail ? validateGBPEmail(contactEmail) : "";
 const step1Valid =
 !validateBusinessName(businessName) &&
 !validateMapsUrl(mapsUrl) &&
 !validateGBPEmail(contactEmail);

 function handleStep1Continue() {
 setTouched({ businessName: true, mapsUrl: true, contactEmail: true });
 if (!step1Valid) return;
 setStep(2);
 }

 async function handleSave() {
 if (!step1Valid) return;
 setSaving(true);
 setSaveError("");

 const supabase = createClient();
 const {
 data: { user },
 } = await supabase.auth.getUser();
 if (!user) {
 setSaving(false);
 setSaveError("You must be logged in.");
 return;
 }

 await supabase.from("profiles").upsert({ id: user.id }, { onConflict: "id" });

 const { data: conn, error } = await supabase
 .from("connections")
 .insert({
 user_id: user.id,
 type: "google_business",
 name: businessName,
 external_id: mapsUrl,
 credentials: {
 contact_email: contactEmail,
 maps_url: mapsUrl,
 address: address || null,
 status: "pending_verification",
 },
 is_active: true,
 review_count: 0,
 })
 .select()
 .single();

 setSaving(false);

 if (error) {
 console.error("[GBP connect] Insert error:", error);
 setSaveError("Failed to save connection. Please try again.");
 return;
 }

 setSavedConnection(conn as Connection);
 setStep(3);
 }

 // ── Step 1: Enter business details ────────────────────────────────────────
 if (step === 1) {
 return (
 <Card>
 <CardHeader>
 <div className="flex items-center gap-2 mb-1">
 <StepBadge current={1} total={3} />
 <CardTitle className="text-base">Enter your business details</CardTitle>
 </div>
 <CardDescription>
 Tell us about your Google Business Profile so we can fetch your reviews.
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3">
 <p className="text-xs text-blue-700 dark:text-blue-400">
 We need your Google Maps link to identify your business and fetch reviews once GBP API access is approved.
 </p>
 </div>

 <div className="space-y-2">
 <Label>
 Business Name <span className="text-destructive">*</span>
 </Label>
 <Input
 placeholder="Your business name as it appears on Google"
 value={businessName}
 onChange={(e) => setBusinessName(e.target.value)}
 onBlur={() => setTouched((t) => ({ ...t, businessName: true }))}
 className={nameError ? "border-destructive focus-visible:ring-destructive" : ""}
 />
 {nameError && <p className="text-xs text-destructive">{nameError}</p>}
 </div>

 <div className="space-y-2">
 <Label>
 Google Maps URL <span className="text-destructive">*</span>
 </Label>
 <Input
 placeholder="https://maps.google.com/?cid=XXXXXXXX"
 value={mapsUrl}
 onChange={(e) => setMapsUrl(e.target.value)}
 onBlur={() => setTouched((t) => ({ ...t, mapsUrl: true }))}
 className={mapsError ? "border-destructive focus-visible:ring-destructive" : ""}
 />
 {mapsError ? (
 <p className="text-xs text-destructive">{mapsError}</p>
 ) : (
 <p className="text-xs text-muted-foreground">
 Search your business on Google Maps → click <strong>Share</strong> → copy the link
 </p>
 )}
 </div>

 <div className="space-y-2">
 <Label>
 Business Address{" "}
 <span className="text-muted-foreground text-xs">(optional)</span>
 </Label>
 <Input
 placeholder="123 Main St, City, State"
 value={address}
 onChange={(e) => setAddress(e.target.value)}
 />
 </div>

 <div className="space-y-2">
 <Label>
 GBP Management Email <span className="text-destructive">*</span>
 </Label>
 <Input
 type="email"
 placeholder="owner@yourbusiness.com"
 value={contactEmail}
 onChange={(e) => setContactEmail(e.target.value)}
 onBlur={() => setTouched((t) => ({ ...t, contactEmail: true }))}
 className={emailError ? "border-destructive focus-visible:ring-destructive" : ""}
 />
 {emailError ? (
 <p className="text-xs text-destructive">{emailError}</p>
 ) : (
 <p className="text-xs text-muted-foreground">
 Email that manages this Google Business Profile — may differ from your login email.
 </p>
 )}
 </div>

 <div className="flex gap-2">
 <Button variant="outline" onClick={onBack}>
 <ArrowLeft className="mr-2 h-4 w-4" /> Back
 </Button>
 <Button onClick={handleStep1Continue}>
 Continue <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 </CardContent>
 </Card>
 );
 }

 // ── Step 2: Verify / confirm ───────────────────────────────────────────────
 if (step === 2) {
 return (
 <Card>
 <CardHeader>
 <div className="flex items-center gap-2 mb-1">
 <StepBadge current={2} total={3} />
 <CardTitle className="text-base">Verify your business</CardTitle>
 </div>
 <CardDescription>
 Confirm the details below and save your connection.
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="rounded-lg border bg-secondary/40 p-4 space-y-2 text-sm">
 <div className="flex gap-2">
 <span className="text-muted-foreground w-28 shrink-0">Business</span>
 <span className="font-medium">{businessName}</span>
 </div>
 <div className="flex gap-2">
 <span className="text-muted-foreground w-28 shrink-0">Maps URL</span>
 <span className="font-mono text-xs break-all">{mapsUrl}</span>
 </div>
 {address && (
 <div className="flex gap-2">
 <span className="text-muted-foreground w-28 shrink-0">Address</span>
 <span>{address}</span>
 </div>
 )}
 <div className="flex gap-2">
 <span className="text-muted-foreground w-28 shrink-0">GBP Email</span>
 <span>{contactEmail}</span>
 </div>
 </div>

 <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
 <p className="text-xs text-amber-700 dark:text-amber-400">
 Your connection will be saved with <strong>Pending Verification</strong> status. Reviews will appear
 in your inbox once our team verifies the connection (usually within 24 hours).
 </p>
 </div>

 {saveError && (
 <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
 <p className="text-xs text-destructive">{saveError}</p>
 </div>
 )}

 <div className="flex gap-2">
 <Button variant="outline" onClick={() => setStep(1)} disabled={saving}>
 <ArrowLeft className="mr-2 h-4 w-4" /> Back
 </Button>
 <Button onClick={handleSave} disabled={saving}>
 {saving ? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
 </>
 ) : (
 <>
 <CheckCircle2 className="mr-2 h-4 w-4" /> Verify Connection
 </>
 )}
 </Button>
 </div>
 </CardContent>
 </Card>
 );
 }

 // ── Step 3: Success ────────────────────────────────────────────────────────
 return (
 <Card>
 <CardHeader>
 <div className="flex items-center gap-2 mb-1">
 <StepBadge current={3} total={3} />
 <CardTitle className="text-base">Connection saved</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="space-y-4 text-center">
 <div className="flex flex-col items-center gap-2 py-2">
 <div className="h-12 w-12 rounded-full bg-accent/10 dark:bg-accent/10 flex items-center justify-center">
 <CheckCircle2 className="h-6 w-6 text-accent" />
 </div>
 <p className="font-semibold">{businessName}</p>
 <p className="text-sm text-muted-foreground max-w-xs">
 Your business has been saved. We&apos;ll start fetching reviews once the connection is verified.
 </p>
 <Badge
 variant="secondary"
 className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
 >
 Pending Verification
 </Badge>
 </div>
 <div className="flex gap-2 justify-center flex-wrap">
 <Button
 className="bg-accent hover:bg-accent/90 text-white"
 onClick={() => savedConnection && onComplete?.(savedConnection)}
 >
 Go to Review Inbox <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 <Button variant="outline" onClick={onBack}>
 Connect another source
 </Button>
 </div>
 </CardContent>
 </Card>
 );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StepBadge({ current, total }: { current: number; total: number }) {
 return (
 <span className="inline-flex items-center rounded-full bg-accent/10 dark:bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent dark:text-accent">
 Step {current}/{total}
 </span>
 );
}
