"use client";

import { useState } from "react";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TourResetButton } from "@/components/dashboard/ProductTour";
import { ContactSupportDialog } from "@/components/dashboard/ContactSupportDialog";
import {
 Link2,
 Bot,
 MessageSquare,
 Megaphone,
 ChevronDown,
 Play,
 CheckCircle2,
 Lightbulb,
 Zap,
 HelpCircle,
 ExternalLink,
 BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
 {
 number: 1,
 icon: Link2,
 color: "text-accent dark:text-accent",
 bg: "bg-accent/10 dark:bg-accent/10",
 border: "border-accent/40 dark:border-accent/40",
 title: "Connect Your Review Source",
 description:
 "Link your Google Business Profile or Google Play Store app to start pulling in reviews automatically.",
 steps: [
 "Go to Settings → Connections in the sidebar",
 "Click 'Add Connection' and choose Google Business Profile or Play Store",
 "Authorize ReviewPilot to read reviews (read-only access)",
 "Your reviews will sync within a few minutes",
 ],
 tip: "You can connect multiple sources — one GBP location and one Play Store app on the Free plan.",
 },
 {
 number: 2,
 icon: Bot,
 color: "text-violet-600 dark:text-violet-400",
 bg: "bg-violet-50 dark:bg-violet-950/40",
 border: "border-violet-200 dark:border-violet-800",
 title: "Configure Your AI Profile",
 description:
 "Teach the AI about your business so replies sound like they came from your team, not a robot.",
 steps: [
 "Go to Settings → AI Configuration",
 "Describe your business in 2–3 sentences",
 "Add your key services, product highlights, and any common issues",
 "Set your preferred reply tone (Friendly, Professional, Apologetic, Casual)",
 ],
 tip: "The more context you provide, the better the AI replies. Be specific about your services and what makes you different.",
 },
 {
 number: 3,
 icon: MessageSquare,
 color: "text-blue-600 dark:text-blue-400",
 bg: "bg-blue-50 dark:bg-blue-950/40",
 border: "border-blue-200 dark:border-blue-800",
 title: "Reply to Reviews",
 description:
 "Use the Review Inbox to view, generate, and publish AI-powered replies to your reviews.",
 steps: [
 "Open the Review Inbox from the sidebar",
 "Click any review to open the detail panel",
 "Choose a tone and click 'Generate Reply'",
 "Edit the reply if needed, then click 'Publish' to post it live",
 ],
 tip: "Use J/K keyboard shortcuts to navigate reviews quickly. Press R to generate a reply without clicking.",
 },
 {
 number: 4,
 icon: Megaphone,
 color: "text-orange-600 dark:text-orange-400",
 bg: "bg-orange-50 dark:bg-orange-950/40",
 border: "border-orange-200 dark:border-orange-800",
 title: "Collect More Reviews",
 description:
 "Send SMS or email campaigns to your customers to proactively generate new positive reviews.",
 steps: [
 "Go to Campaigns in the sidebar",
 "Click 'New Campaign' and choose SMS or Email",
 "Upload your customer contact list (CSV)",
 "Customize your review request message and send",
 ],
 tip: "Send campaigns within 24–48 hours of a customer interaction for the best response rates.",
 comingSoon: true,
 },
];

const FAQS = [
 {
 question: "How does the AI know about my business?",
 answer:
 "The AI uses the context you provide in Settings → AI Configuration. When you describe your business, services, and tone preferences, the AI incorporates this into every reply it generates. The more detail you provide, the more personalized and accurate the replies will be.",
 },
 {
 question: "Are replies published automatically?",
 answer:
 "No — you always stay in control. ReviewPilot generates a suggested reply, but you review and edit it before clicking Publish. Nothing goes live without your explicit approval. You can also save a draft to come back to later.",
 },
 {
 question: "Can I edit AI replies before publishing?",
 answer:
 "Absolutely. The reply appears in a text editor where you can make any changes you want. Think of the AI as a first draft — you refine it to match your voice exactly before publishing.",
 },
 {
 question: "Can I manage multiple apps or locations?",
 answer:
 "Yes. You can connect multiple sources. The Free plan supports 1 GBP location and 1 Play Store app. Upgrading to Pro or Agency unlocks unlimited connections so you can manage all your locations and apps from one dashboard.",
 },
 {
 question: "What platforms are supported?",
 answer:
 "Currently ReviewPilot supports Google Business Profile (for local businesses) and Google Play Store (for app developers). We're actively working on App Store (iOS) and Yelp integrations — stay tuned.",
 },
 {
 question: "How many AI replies do I get per month?",
 answer:
 "The Free plan includes 10 AI replies per month. The Pro plan ($49/mo) includes 500 replies, and the Agency plan ($149/mo) includes unlimited replies. Replies reset on your billing date each month.",
 },
 {
 question: "Is my data secure?",
 answer:
 "Yes. ReviewPilot uses read-only OAuth access to your review platforms — we never store your passwords. Review data is encrypted at rest and in transit. We never sell or share your data with third parties.",
 },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
 const [open, setOpen] = useState(false);
 return (
 <div className={cn("border rounded-xl overflow-hidden transition-all duration-200", open && "shadow-sm")}>
 <button
 onClick={() => setOpen(!open)}
 className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
 >
 <span className="font-medium text-sm pr-4">{question}</span>
 <ChevronDown
 className={cn(
 "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
 open && "rotate-180"
 )}
 />
 </button>
 <div
 className={cn(
 "overflow-hidden transition-all duration-200",
 open ? "max-h-96" : "max-h-0"
 )}
 >
 <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t pt-3">
 {answer}
 </p>
 </div>
 </div>
 );
}

export default function DocsPage() {
 return (
 <PageTransition>
 <div className="max-w-4xl mx-auto space-y-10 pb-12">
 {/* Header */}
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <BookOpen className="h-5 w-5 text-accent" />
 <Badge variant="secondary" className="text-xs">Help Center</Badge>
 </div>
 <h1 className="font-sans text- font-semibold tracking-tight">Getting Started</h1>
 <p className="text-muted-foreground mt-1.5 text-sm max-w-lg">
 Everything you need to get ReviewPilot up and running in under 10 minutes.
 </p>
 </div>
 <TourResetButton />
 </div>

 {/* Getting Started Steps */}
 <div>
 <h2 className="font-sans tracking-tight text-xl font-semibold mb-5 flex items-center gap-2">
 <Zap className="h-5 w-5 text-accent" />
 Quick Start Guide
 </h2>
 <div className="space-y-4">
 {STEPS.map((step) => (
 <Card key={step.number} className={cn("border-l-4 overflow-hidden", step.border)}>
 <CardContent className="p-0">
 <div className={cn("p-5", step.comingSoon && "relative")}>
 <div className={cn("flex items-start gap-4", step.comingSoon && "opacity-60")}>
 {/* Step number + icon */}
 <div className="shrink-0">
 <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", step.bg)}>
 <step.icon className={cn("h-6 w-6", step.color)} />
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
 Step {step.number}
 </span>
 </div>
 <div className="flex items-center gap-2 mb-1 flex-wrap">
 <h3 className="font-sans font-semibold tracking-tight text-base">{step.title}</h3>
 {step.comingSoon && (
 <span className="inline-flex items-center rounded-full bg-violet-500/15 dark:bg-violet-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/30">
 Coming Soon
 </span>
 )}
 </div>
 <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

 {/* Numbered checklist */}
 <ol className="space-y-2">
 {step.steps.map((s, i) => (
 <li key={i} className="flex items-start gap-3 text-sm">
 <span className={cn(
 "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5",
 step.bg, step.color
 )}>
 {i + 1}
 </span>
 <span>{s}</span>
 </li>
 ))}
 </ol>

 {/* Tip */}
 <div className="mt-4 flex items-start gap-2 rounded-lg bg-secondary/60 px-3 py-2.5">
 <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
 <p className="text-xs text-muted-foreground">{step.tip}</p>
 </div>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>

 {/* Video Tutorial */}
 <a
 href="https://youtu.be/WXVq7twjiVw"
 target="_blank"
 rel="noopener noreferrer"
 className="group block"
 aria-label="Watch the full ReviewPilot walkthrough on YouTube"
 >
 <Card className="overflow-hidden border transition-all duration-300 group-hover:scale-[1.01] group-hover:shadow-2xl">
 <CardContent className="p-0">
 <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-900">
 <img
 src="https://img.youtube.com/vi/WXVq7twjiVw/maxresdefault.jpg"
 alt="ReviewPilot walkthrough video thumbnail"
 className="absolute inset-0 w-full h-full object-cover"
 onError={(e) => {
 const img = e.currentTarget;
 if (!img.dataset.fallback) {
 img.dataset.fallback = "true";
 img.src = "https://img.youtube.com/vi/WXVq7twjiVw/hqdefault.jpg";
 }
 }}
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30 transition-colors duration-300 group-hover:from-black/70" />
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="h-16 w-16 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/25">
 <Play className="h-7 w-7 text-white ml-1 fill-white" />
 </div>
 </div>
 <div className="absolute bottom-3 left-4 right-4 text-white">
 <p className="text-sm font-medium drop-shadow">Watch the full ReviewPilot walkthrough</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </a>

 {/* Keyboard Shortcuts Quick Reference */}
 <Card>
 <CardHeader className="pb-3">
 <CardTitle className="text-base font-semibold flex items-center gap-2">
 <Zap className="h-4 w-4 text-accent" />
 Keyboard Shortcuts
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid sm:grid-cols-2 gap-3">
 {[
 { keys: ["⌘", "K"], label: "Open global search" },
 { keys: ["J"], label: "Next review" },
 { keys: ["K"], label: "Previous review" },
 { keys: ["R"], label: "Generate AI reply" },
 { keys: ["⌘", "↵"], label: "Publish reply" },
 { keys: ["?"], label: "Show all shortcuts" },
 { keys: ["Esc"], label: "Close modal / cancel" },
 ].map(({ keys, label }) => (
 <div key={label} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
 <span className="text-sm text-muted-foreground">{label}</span>
 <div className="flex items-center gap-1">
 {keys.map((k) => (
 <kbd
 key={k}
 className="inline-flex items-center justify-center rounded bg-background border shadow-sm px-1.5 py-0.5 text-[11px] font-mono font-medium min-w-[22px]"
 >
 {k}
 </kbd>
 ))}
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 {/* FAQ */}
 <div>
 <h2 className="font-sans tracking-tight text-xl font-semibold mb-5 flex items-center gap-2">
 <HelpCircle className="h-5 w-5 text-accent" />
 Frequently Asked Questions
 </h2>
 <div className="space-y-3">
 {FAQS.map((faq) => (
 <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
 ))}
 </div>
 </div>

 {/* Still need help */}
 <Card className="bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#d946ef] border-accent/40 dark:border-accent/40">
 <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
 <div>
 <h3 className="font-sans font-semibold tracking-tight mb-1">Still have questions?</h3>
 <p className="text-sm text-muted-foreground">
 Our support team typically responds within a few hours.
 </p>
 </div>
 <div className="flex gap-2 shrink-0">
 <ContactSupportDialog
 trigger={
 <Button variant="outline" size="sm" className="gap-2">
 <ExternalLink className="h-3.5 w-3.5" />
 Contact Support
 </Button>
 }
 />
 <Button size="sm" className="gap-2">
 <CheckCircle2 className="h-3.5 w-3.5" />
 Connect a Source
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 </PageTransition>
 );
}
