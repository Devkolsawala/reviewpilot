"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft, Inbox, BarChart3, Megaphone, Settings, Bot, Sparkles } from "lucide-react";

interface TourStep {
 title: string;
 description: string;
 icon: React.ReactNode;
 position?: "center" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
 {
 title: "Welcome to ReviewPilot!",
 description: "Let's take a quick tour to help you get the most out of your review management dashboard. This will only take a minute.",
 icon: <Sparkles className="h-8 w-8 text-accent" />,
 position: "center",
 },
 {
 title: "Your Sidebar Navigation",
 description: "Navigate between your inbox, analytics, campaigns, and settings from here. The badge shows how many reviews need your attention.",
 icon: <Inbox className="h-6 w-6 text-accent" />,
 position: "left",
 },
 {
 title: "Review Inbox",
 description: "Your reviews from Google Business Profile and Play Store appear here. Click any review to see details and generate an AI-powered reply.",
 icon: <Inbox className="h-6 w-6 text-accent" />,
 position: "center",
 },
 {
 title: "AI-Powered Replies",
 description: "Select a review, choose your tone (Friendly, Professional, Apologetic), and click 'Generate Reply'. The AI creates contextual replies you can edit and publish.",
 icon: <Bot className="h-6 w-6 text-accent" />,
 position: "center",
 },
 {
 title: "Analytics Dashboard",
 description: "Track your rating trends, sentiment analysis, review volume, and top keywords. Watch your ratings improve over time as you respond faster.",
 icon: <BarChart3 className="h-6 w-6 text-accent" />,
 position: "center",
 },
 {
 title: "SMS & Email Campaigns",
 description: "Proactively collect reviews by sending SMS or email campaigns to your customers. Upload contacts, customize the message, and send in minutes.",
 icon: <Megaphone className="h-6 w-6 text-accent" />,
 position: "center",
 },
 {
 title: "AI Configuration",
 description: "Teach the AI about your business — describe your services, key features, and common issues. The more context you provide, the better the AI replies.",
 icon: <Settings className="h-6 w-6 text-accent" />,
 position: "center",
 },
 {
 title: "You're All Set!",
 description: "Start by connecting your first review source. The AI will begin generating replies as soon as reviews start flowing in.",
 icon: <Sparkles className="h-8 w-8 text-accent" />,
 position: "center",
 },
];

export function ProductTour() {
 const [active, setActive] = useState(false);
 const [step, setStep] = useState(0);
 const router = useRouter();

 useEffect(() => {
 const seen = localStorage.getItem("reviewpilot-tour-seen");
 if (!seen) {
 // Show tour on first visit (small delay so page renders first)
 const timer = setTimeout(() => setActive(true), 800);
 return () => clearTimeout(timer);
 }
 }, []);

 const close = useCallback(() => {
 setActive(false);
 localStorage.setItem("reviewpilot-tour-seen", "true");
 }, []);

 const next = useCallback(() => {
 if (step < TOUR_STEPS.length - 1) {
 setStep((s) => s + 1);
 } else {
 close();
 router.push("/dashboard/settings/connections");
 }
 }, [step, close, router]);

 const prev = useCallback(() => {
 if (step > 0) setStep((s) => s - 1);
 }, [step]);

 // Keyboard nav
 useEffect(() => {
 if (!active) return;
 const handler = (e: KeyboardEvent) => {
 if (e.key === "Escape") close();
 if (e.key === "ArrowRight") next();
 if (e.key === "ArrowLeft") prev();
 };
 document.addEventListener("keydown", handler);
 return () => document.removeEventListener("keydown", handler);
 }, [active, next, prev, close]);

 if (!active) return null;

 const currentStep = TOUR_STEPS[step];
 const isLast = step === TOUR_STEPS.length - 1;
 const isFirst = step === 0;

 return (
 <div className="fixed inset-0 z-[100]">
 {/* Dark overlay */}
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

 {/* Tour card */}
 <div className="absolute inset-0 flex items-center justify-center p-6">
 <div className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
 {/* Close button */}
 <button
 onClick={close}
 className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors z-10"
 >
 <X className="h-4 w-4" />
 </button>

 {/* Header gradient */}
 <div className="bg-gradient-to-br from-accent/10 to-accent/5 px-8 pt-8 pb-4 flex justify-center">
 <div className="rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#d946ef] p-5">
 {currentStep.icon}
 </div>
 </div>

 {/* Content */}
 <div className="px-8 py-6 text-center">
 <h3 className="font-sans text- font-semibold tracking-tight mb-2">{currentStep.title}</h3>
 <p className="text-sm text-muted-foreground leading-relaxed">{currentStep.description}</p>
 </div>

 {/* Progress dots */}
 <div className="flex justify-center gap-1.5 pb-4">
 {TOUR_STEPS.map((_, i) => (
 <button
 key={i}
 onClick={() => setStep(i)}
 className={`h-1.5 rounded-full transition-all duration-200 ${
 i === step ? "w-6 bg-accent" : "w-1.5 bg-border hover:bg-muted-foreground/30"
 }`}
 />
 ))}
 </div>

 {/* Actions */}
 <div className="px-8 pb-8 flex items-center justify-between gap-3">
 <Button variant="ghost" size="sm" onClick={close} className="text-muted-foreground">
 Skip tour
 </Button>
 <div className="flex gap-2">
 {!isFirst && (
 <Button variant="outline" size="sm" onClick={prev}>
 <ArrowLeft className="mr-1 h-3 w-3" /> Back
 </Button>
 )}
 <Button size="sm" onClick={next}>
 {isLast ? "Connect a Source" : "Next"}
 {!isLast && <ArrowRight className="ml-1 h-3 w-3" />}
 </Button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

export function TourResetButton() {
 return (
 <button
 onClick={() => {
 localStorage.removeItem("reviewpilot-tour-seen");
 window.location.reload();
 }}
 className="text-xs text-accent hover:underline"
 >
 Restart Product Tour
 </button>
 );
}
