"use client";

import { useState } from "react";
import Link from "next/link";
import { Megaphone, ArrowLeft, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/dashboard/PageTransition";

export default function CampaignsPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    console.log("[Campaigns] Notify me:", email);
    setSubmitted(true);
  }

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <Card className="w-full max-w-lg border-dashed border-2 bg-card/50">
          <CardContent className="flex flex-col items-center text-center p-10">
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-100 dark:from-teal-950/40 dark:to-emerald-950/40 mb-5">
              <Megaphone className="h-8 w-8 text-teal-500" />
            </div>

            {/* Badge */}
            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-4">
              Coming Soon
            </span>

            {/* Heading */}
            <h1 className="font-heading text-2xl font-bold mb-3">
              Campaigns
            </h1>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              SMS and email review collection campaigns are being built. You&apos;ll be able to send automated review requests to your customers via SMS and email.
            </p>

            {/* Notify form */}
            {!submitted ? (
              <form onSubmit={handleNotify} className="w-full max-w-sm flex gap-2 mb-6">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  required
                />
                <Button type="submit" size="default">
                  <Bell className="h-4 w-4 mr-1.5" />
                  Notify me
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 font-medium mb-6 rounded-lg bg-teal-50 dark:bg-teal-950/30 px-4 py-2.5 w-full max-w-sm justify-center">
                <Bell className="h-4 w-4" />
                You&apos;re on the list! We&apos;ll notify you when campaigns launch.
              </div>
            )}

            {/* Back link */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Go back to Dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
