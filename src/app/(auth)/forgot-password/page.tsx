"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SECONDS = 60;

function BrandLogo() {
  return (
    <div className="lg:hidden flex items-center gap-2 mb-10">
      <img src="/favicon.svg" alt="ReviewPilot logo" className="h-8 w-8 shrink-0" aria-hidden="true" />
      <span className="font-sans text-[15px] font-semibold tracking-tight">
        ReviewPilot
      </span>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function sendReset() {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await sendReset();
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  async function handleResend() {
    setError("");
    setResending(true);
    const err = await sendReset();
    setResending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  if (sent) {
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
            If an account exists for{" "}
            <span className="font-medium text-foreground">{email}</span>, a
            reset link is on its way. The link expires in 60 minutes.
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
              : "Resend reset link"}
          </Button>

          <p className="mt-6 text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-accent hover:underline"
            >
              ← Back to login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BrandLogo />

      <h1 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
        Reset your password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your account email and we&apos;ll send you a link to set a new
        password.
      </p>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-accent hover:underline"
          >
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
