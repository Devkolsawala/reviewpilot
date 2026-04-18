"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConnectionWizard } from "./ConnectionWizard";
import { CheckCircle2, ArrowRight, Link2, Bot, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
 { key: "connect", label: "Connect Account", icon: Link2 },
 { key: "configure", label: "Configure AI", icon: Bot },
 { key: "reply", label: "First Reply", icon: Star },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function OnboardingWizard({ onComplete }: { onComplete?: () => void }) {
 const [currentStep, setCurrentStep] = useState<StepKey>("connect");
 const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

 function completeStep(step: StepKey) {
 setCompletedSteps((prev) => new Set([...Array.from(prev), step]));
 const stepIndex = STEPS.findIndex((s) => s.key === step);
 if (stepIndex < STEPS.length - 1) {
 setCurrentStep(STEPS[stepIndex + 1].key);
 } else {
 onComplete?.();
 }
 }

 return (
 <Card>
 <CardContent className="p-6">
 {/* Step indicators */}
 <div className="flex items-center justify-center gap-2 mb-8">
 {STEPS.map((step, i) => (
 <div key={step.key} className="flex items-center gap-2">
 <button
 onClick={() => setCurrentStep(step.key)}
 className={cn(
 "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
 currentStep === step.key
 ? "bg-accent text-white"
 : completedSteps.has(step.key)
 ? "bg-accent/10 text-accent dark:bg-accent/10 dark:text-accent"
 : "bg-secondary text-muted-foreground"
 )}
 >
 {completedSteps.has(step.key) ? (
 <CheckCircle2 className="h-4 w-4" />
 ) : (
 <step.icon className="h-4 w-4" />
 )}
 {step.label}
 </button>
 {i < STEPS.length - 1 && (
 <ArrowRight className="h-4 w-4 text-muted-foreground" />
 )}
 </div>
 ))}
 </div>

 {/* Step content */}
 {currentStep === "connect" && (
 <div>
 <h3 className="font-sans text- font-semibold tracking-tight mb-4 text-center">
 Connect Your First Account
 </h3>
 <ConnectionWizard onComplete={() => completeStep("connect")} />
 </div>
 )}

 {currentStep === "configure" && (
 <div className="text-center">
 <Bot className="h-12 w-12 text-accent mx-auto mb-4" />
 <h3 className="font-sans text- font-semibold tracking-tight mb-2">
 Configure AI Replies
 </h3>
 <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
 Tell the AI about your business so it can write relevant replies.
 You can do this now or later in Settings.
 </p>
 <div className="flex gap-3 justify-center">
 <Button variant="outline" onClick={() => completeStep("configure")}>
 Skip for Now
 </Button>
 <Button onClick={() => completeStep("configure")}>
 Configure AI
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 </div>
 )}

 {currentStep === "reply" && (
 <div className="text-center">
 <Star className="h-12 w-12 text-amber-500 mx-auto mb-4" />
 <h3 className="font-sans text- font-semibold tracking-tight mb-2">
 Reply to Your First Review
 </h3>
 <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
 Head to the inbox to generate AI replies for your reviews. You can
 edit, approve, and publish them.
 </p>
 <Button onClick={() => completeStep("reply")}>
 Go to Inbox
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 )}
 </CardContent>
 </Card>
 );
}
