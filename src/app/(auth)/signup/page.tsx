"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

// Common disposable / obviously-fake email domains
const BLOCKED_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.info", "guerrillamail.net",
  "guerrillamail.org", "guerrillamailblock.com", "grr.la", "sharklasers.com",
  "spam4.me", "yopmail.com", "yopmail.fr", "cool.fr.nf", "jetable.fr.nf",
  "nospam.ze.tc", "nomail.xl.cx", "mega.zik.dj", "speed.1s.fr",
  "trashmail.com", "trashmail.me", "trashmail.net", "trashmail.at",
  "trashmail.io", "trashmail.xyz", "trash-mail.at", "dispostable.com",
  "maildrop.cc", "fakeinbox.com", "spamgourmet.com", "spamgourmet.net",
  "10minutemail.com", "10minutemail.net", "10minutemail.org", "minutemail.com",
  "discard.email", "mailnull.com", "spamex.com", "throwam.com",
  "throwaway.email", "tempmail.com", "tempmail.net", "temp-mail.org",
  "temp-mail.ru", "getairmail.com", "filzmail.com", "ezztt.com",
  "example.com", "example.net", "example.org", "test.com", "fake.com",
]);

function isBlockedDomain(email: string): boolean {
  const parts = email.split("@");
  if (parts.length !== 2) return false;
  return BLOCKED_DOMAINS.has(parts[1].toLowerCase());
}

const RESEND_COOLDOWN_SECONDS = 30;

function BrandLogo() {
  return (
    <div className="lg:hidden flex items-center gap-2 mb-10">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)] text-xs font-bold text-white shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)]">
        RP
      </div>
      <span className="font-sans text-[15px] font-semibold tracking-tight">
        ReviewPilot
      </span>
    </div>
  );
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (resendCooldown <= 0 || verified) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown, verified]);

  useEffect(() => {
    if (!emailSent || verified) return;

    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) setVerified(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!cancelled && event === "SIGNED_IN" && session) {
          setVerified(true);
        }
      }
    );

    const poll = setInterval(async () => {
      if (cancelled) return;

      const { data } = await supabase.auth.getSession();
      if (!cancelled && data.session) {
        setVerified(true);
        return;
      }

      try {
        const res = await fetch("/api/auth/check-verified", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) return;
        const result = (await res.json()) as { verified?: boolean };
        if (!cancelled && result.verified) setVerified(true);
      } catch {
        // Network hiccup — retry next tick
      }
    }, 3000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearInterval(poll);
    };
  }, [emailSent, verified, email]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isBlockedDomain(email)) {
      setError("Please use a real email — disposable or placeholder domains are not accepted.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/verified`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setEmailSent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleResend() {
    setError("");
    setResending(true);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/verified`,
      },
    });

    setResending(false);

    if (resendError) {
      setError(resendError.message);
    } else {
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }

  async function handleGoogleSignup() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback/google`,
      },
    });
  }

  if (verified) {
    return (
      <div>
        <BrandLogo />
        <div className="flex flex-col items-center text-center mt-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))] mb-6 ring-1 ring-accent/30">
            <svg
              className="h-7 w-7 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight">
            Email verified
          </h1>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground leading-relaxed">
            Your account is active. You may close this page or proceed to log in.
          </p>

          <Button
            variant="gradient"
            className="mt-8 w-full max-w-xs"
            onClick={() => {
              router.push("/login");
              router.refresh();
            }}
          >
            Proceed to log in
          </Button>
        </div>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div>
        <BrandLogo />
        <div className="flex flex-col items-center text-center mt-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))] mb-6 ring-1 ring-accent/30">
            <svg
              className="h-7 w-7 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>

          <h1 className="font-sans text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{email}</span>. Click it
            to activate your account.
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Didn&apos;t receive it? Check spam or junk.
          </p>

          {error && (
            <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button
            variant="subtle"
            className="mt-8 w-full max-w-xs"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
          >
            {resending
              ? "Sending…"
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend confirmation email"}
          </Button>

          <p className="mt-6 text-sm text-muted-foreground">
            Wrong email?{" "}
            <button
              type="button"
              onClick={() => {
                setEmailSent(false);
                setError("");
                setResendCooldown(0);
              }}
              className="font-medium text-accent hover:underline"
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BrandLogo />

      <h1 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Start your 7-day free trial. No credit card required.
      </p>

      <div className="mt-8">
        <Button
          variant="subtle"
          className="w-full"
          onClick={handleGoogleSignup}
          type="button"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
            <span className="bg-background px-3 text-muted-foreground">
              or sign up with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-xs font-medium">
              Full name
            </Label>
            <Input
              id="fullName"
              placeholder="Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">
              Work email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="rahul@company.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
