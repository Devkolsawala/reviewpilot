"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-teal-500 mx-auto mb-4" />
          <h3 className="font-heading text-xl font-bold mb-2">
            Demo Request Received!
          </h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ll reach out within 24 hours to schedule your personalized demo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h3 className="font-heading text-xl font-bold">Request a Demo</h3>
        <p className="text-sm text-muted-foreground">
          See ReviewPilot in action with a personalized walkthrough.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" placeholder="Rahul" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" placeholder="Sharma" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="rahul@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" name="company" placeholder="Your Business" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">What are you looking for?</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us about your review management needs..."
              rows={3}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Request Demo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
