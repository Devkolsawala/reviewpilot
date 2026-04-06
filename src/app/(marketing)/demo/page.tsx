import type { Metadata } from "next";
import { DemoRequestForm } from "@/components/marketing/DemoRequestForm";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Request a Demo",
  description: "See ReviewPilot in action with a personalized demo.",
};

const DEMO_BENEFITS = [
  "Personalized walkthrough of the dashboard",
  "See AI reply generation in real-time",
  "Learn how to set up SMS review collection",
  "Get pricing recommendations for your needs",
  "Ask questions to our product team",
];

export default function DemoPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-start">
          <div>
            <h1 className="font-heading text-4xl font-bold sm:text-5xl">
              See ReviewPilot in Action
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Get a personalized demo tailored to your business. Our team will
              show you exactly how ReviewPilot can transform your review
              management workflow.
            </p>
            <ul className="mt-8 space-y-4">
              {DEMO_BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0" />
                  <span className="text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <DemoRequestForm />
        </div>
      </div>
    </div>
  );
}
