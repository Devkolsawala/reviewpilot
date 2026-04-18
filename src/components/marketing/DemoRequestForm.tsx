"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function DemoRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const data = {
      firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
      lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/demo/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please email us directly at dev.kolsawala45@gmail.com");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))] ring-1 ring-accent/30">
          <CheckCircle2 className="h-6 w-6 text-accent" />
        </div>
        <h3 className="mt-4 font-sans text-xl font-semibold tracking-tight">
          Demo request received
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll reach out within 24 hours to schedule your personalized demo.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-sans text-xl font-semibold tracking-tight">
        Request a demo
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        See ReviewPilot in action with a personalized walkthrough.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-xs font-medium">
              First name
            </Label>
            <Input id="firstName" name="firstName" placeholder="Rahul" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-xs font-medium">
              Last name
            </Label>
            <Input id="lastName" name="lastName" placeholder="Sharma" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-medium">
            Work email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="rahul@company.in"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company" className="text-xs font-medium">
            Company name
          </Label>
          <Input id="company" name="company" placeholder="Your business" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="message" className="text-xs font-medium">
            What are you looking for?
          </Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Tell us about your review-management needs…"
            rows={3}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
          {loading ? "Submitting…" : "Request demo"}
        </Button>
      </form>
    </div>
  );
}
