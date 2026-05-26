"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

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

type PageState = "loading" | "ready" | "expired" | "success";

export default function ResetPasswordPage() {
  const [state, setState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const mismatch = confirm.length > 0 && password !== confirm;

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let resolved = false;

    const markReady = () => {
      if (cancelled || resolved) return;
      resolved = true;
      setState("ready");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") markReady();
      }
    );

    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (cancelled || resolved) return;
        if (!error) markReady();
      });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled || resolved) return;
      if (data.session) markReady();
    });

    const timeout = setTimeout(() => {
      if (cancelled || resolved) return;
      resolved = true;
      setState("expired");
    }, 2000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }
    setState("success");
    setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 1500);
  }

  if (state === "loading") {
    return (
      <div>
        <BrandLogo />
        <div className="flex flex-col items-center text-center mt-4">
          <p className="text-sm text-muted-foreground">Verifying reset link…</p>
        </div>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div>
        <BrandLogo />

        <h1 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
          Link expired
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This reset link is invalid or has expired. Request a new one.
        </p>

        <div className="mt-8">
          <Link href="/forgot-password" className="block">
            <Button variant="gradient" className="w-full">
              Request new link
            </Button>
          </Link>

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

  if (state === "success") {
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
            Password updated
          </h1>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground leading-relaxed">
            Password updated. Redirecting…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BrandLogo />

      <h1 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">
        Set a new password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter a new password for your account.
      </p>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium">
              New password
            </Label>
            <PasswordField
              id="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-xs font-medium">
              Confirm new password
            </Label>
            <PasswordField
              id="confirm"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
            />
            {mismatch && (
              <p className="text-xs text-destructive">
                Passwords do not match.
              </p>
            )}
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
            disabled={submitting || mismatch || password.length === 0}
          >
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
