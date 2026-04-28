"use client";

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
 ArrowRight,
 ArrowLeft,
 Inbox,
 BarChart3,
 Megaphone,
 Settings,
 Bot,
 Sparkles,
 MousePointerClick,
 Brain,
 Hand,
 Wand2,
 Zap,
 ShieldCheck,
} from "lucide-react";

type Placement = "top" | "bottom" | "left" | "right" | "center";

interface TourStep {
 title: string;
 description: string;
 icon: React.ReactNode;
 target?: string; // CSS selector
 action?: boolean; // show "click here" indicator
 comingSoon?: boolean;
 variant?: "default" | "ai-config" | "finale";
}

const TOUR_STEPS: TourStep[] = [
 {
 title: "Welcome to ReviewPilot",
 description: "A 60-second tour. Let's go.",
 icon: <Sparkles className="h-7 w-7 text-white" />,
 },
 {
 title: "Sidebar navigation",
 description: "Everything lives here. The badge on Inbox shows reviews waiting on you.",
 icon: <Inbox className="h-6 w-6 text-white" />,
 target: 'aside[class*="border-r"]',
 },
 {
 title: "Review Inbox",
 description: "All your Google and Play Store reviews, in one place.",
 icon: <Inbox className="h-6 w-6 text-white" />,
 target: 'a[href="/dashboard/inbox"]',
 action: true,
 },
 {
 title: "AI-powered replies",
 description: "Pick a tone, generate, edit, publish. Seconds, not hours.",
 icon: <Bot className="h-6 w-6 text-white" />,
 target: 'a[href="/dashboard/inbox"]',
 },
 {
 title: "Analytics",
 description: "Ratings, sentiment, and trending keywords — tracked over time.",
 icon: <BarChart3 className="h-6 w-6 text-white" />,
 target: 'a[href="/dashboard/analytics"]',
 },
 {
 title: "Campaigns",
 description: "Send SMS and email review requests in one click.",
 icon: <Megaphone className="h-6 w-6 text-white" />,
 target: 'a[href="/dashboard/campaigns"]',
 comingSoon: true,
 },
 {
 title: "Settings",
 description: "Connect review sources, manage billing, and tune your AI — which is up next.",
 icon: <Settings className="h-6 w-6 text-white" />,
 target: 'aside nav button',
 },
 {
 title: "AI Configuration — set this up first",
 description:
 "The AI reads your business context to write replies that actually sound like you. Two minutes here = better replies forever.",
 icon: <Brain className="h-7 w-7 text-white" />,
 variant: "ai-config",
 },
 {
 title: "You're set",
 description: "The fastest path to great replies — finish these three and the rest takes care of itself.",
 icon: <Sparkles className="h-7 w-7 text-white" />,
 variant: "finale",
 },
];

interface Rect {
 top: number;
 left: number;
 width: number;
 height: number;
}

function rectFrom(el: Element): Rect {
 const r = el.getBoundingClientRect();
 return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function pickPlacement(target: Rect, tooltipW: number, tooltipH: number, vw: number, vh: number): Placement {
 const gap = 16;
 const space = {
 top: target.top - gap,
 bottom: vh - (target.top + target.height) - gap,
 left: target.left - gap,
 right: vw - (target.left + target.width) - gap,
 };
 const order: Placement[] = (Object.entries(space) as [Placement, number][])
 .sort((a, b) => b[1] - a[1])
 .map(([k]) => k);
 for (const p of order) {
 if (p === "top" && space.top >= tooltipH) return p;
 if (p === "bottom" && space.bottom >= tooltipH) return p;
 if (p === "left" && space.left >= tooltipW) return p;
 if (p === "right" && space.right >= tooltipW) return p;
 }
 return order[0] ?? "bottom";
}

function tooltipPosition(target: Rect, placement: Placement, tooltipW: number, tooltipH: number, vw: number, vh: number) {
 const gap = 16;
 let top = 0;
 let left = 0;
 switch (placement) {
 case "top":
 top = target.top - tooltipH - gap;
 left = target.left + target.width / 2 - tooltipW / 2;
 break;
 case "bottom":
 top = target.top + target.height + gap;
 left = target.left + target.width / 2 - tooltipW / 2;
 break;
 case "left":
 left = target.left - tooltipW - gap;
 top = target.top + target.height / 2 - tooltipH / 2;
 break;
 case "right":
 left = target.left + target.width + gap;
 top = target.top + target.height / 2 - tooltipH / 2;
 break;
 case "center":
 top = vh / 2 - tooltipH / 2;
 left = vw / 2 - tooltipW / 2;
 break;
 }
 const margin = 12;
 left = Math.max(margin, Math.min(vw - tooltipW - margin, left));
 top = Math.max(margin, Math.min(vh - tooltipH - margin, top));
 return { top, left };
}

function buildArrowPath(tooltip: Rect, target: Rect, placement: Placement) {
 const tCenter = { x: target.left + target.width / 2, y: target.top + target.height / 2 };
 let from = { x: 0, y: 0 };
 let to = { x: 0, y: 0 };
 const pad = 8;
 if (placement === "top") {
 from = { x: tooltip.left + tooltip.width / 2, y: tooltip.top + tooltip.height };
 to = { x: tCenter.x, y: target.top - pad };
 } else if (placement === "bottom") {
 from = { x: tooltip.left + tooltip.width / 2, y: tooltip.top };
 to = { x: tCenter.x, y: target.top + target.height + pad };
 } else if (placement === "left") {
 from = { x: tooltip.left + tooltip.width, y: tooltip.top + tooltip.height / 2 };
 to = { x: target.left - pad, y: tCenter.y };
 } else {
 from = { x: tooltip.left, y: tooltip.top + tooltip.height / 2 };
 to = { x: target.left + target.width + pad, y: tCenter.y };
 }
 const mx = (from.x + to.x) / 2;
 const my = (from.y + to.y) / 2;
 const dx = to.x - from.x;
 const dy = to.y - from.y;
 const isHorizontal = placement === "left" || placement === "right";
 const cp1 = isHorizontal
 ? { x: from.x + dx * 0.5, y: from.y }
 : { x: from.x, y: from.y + dy * 0.5 };
 const cp2 = isHorizontal
 ? { x: to.x - dx * 0.5, y: to.y }
 : { x: to.x, y: to.y - dy * 0.5 };
 return {
 d: `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`,
 from,
 to,
 mid: { x: mx, y: my },
 };
}

export function ProductTour() {
 const [active, setActive] = useState(false);
 const [step, setStep] = useState(0);
 const [targetRect, setTargetRect] = useState<Rect | null>(null);
 const [tooltipRect, setTooltipRect] = useState<Rect | null>(null);
 const [placement, setPlacement] = useState<Placement>("center");
 const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
 const [viewport, setViewport] = useState({ w: 0, h: 0 });
 const [arrowReady, setArrowReady] = useState(false);
 const tooltipRef = useRef<HTMLDivElement>(null);
 const router = useRouter();

 const currentStep = TOUR_STEPS[step];
 const isLast = step === TOUR_STEPS.length - 1;
 const isFirst = step === 0;
 const isMobile = viewport.w > 0 && viewport.w < 768;
 const isSmall = viewport.w > 0 && viewport.w < 480;

 useEffect(() => {
 const seen = localStorage.getItem("reviewpilot-tour-seen");
 if (!seen) {
 const timer = setTimeout(() => setActive(true), 800);
 return () => clearTimeout(timer);
 }
 }, []);

 useEffect(() => {
 if (!active) return;
 const update = () => {
 // Prefer visualViewport.height when available so we match the dynamic
 // viewport (excludes mobile browser chrome) used by CSS dvh units.
 const h = window.visualViewport?.height ?? window.innerHeight;
 const w = window.visualViewport?.width ?? window.innerWidth;
 setViewport({ w, h });
 };
 update();
 window.addEventListener("resize", update);
 window.visualViewport?.addEventListener("resize", update);
 return () => {
 window.removeEventListener("resize", update);
 window.visualViewport?.removeEventListener("resize", update);
 };
 }, [active]);

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

 const goToAiConfig = useCallback(() => {
 close();
 router.push("/dashboard/settings/ai-config");
 }, [close, router]);

 const prev = useCallback(() => {
 if (step > 0) setStep((s) => s - 1);
 }, [step]);

 // Step entry choreography: scroll target into view, then measure
 useEffect(() => {
 if (!active) {
 setTargetRect(null);
 setArrowReady(false);
 return;
 }
 setArrowReady(false);
 let cancelled = false;

 const sel = currentStep.target;
 if (!sel || isMobile) {
 setTargetRect(null);
 setPlacement("center");
 return;
 }
 const el = document.querySelector(sel) as HTMLElement | null;
 if (!el) {
 setTargetRect(null);
 setPlacement("center");
 return;
 }

 const r = el.getBoundingClientRect();
 const fullyInView =
 r.top >= 80 && r.left >= 0 && r.bottom <= window.innerHeight - 80 && r.right <= window.innerWidth;
 if (!fullyInView) {
 try {
 el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
 } catch {
 el.scrollIntoView();
 }
 }

 const settle = setTimeout(() => {
 if (cancelled) return;
 setTargetRect(rectFrom(el));
 }, 420);

 return () => {
 cancelled = true;
 clearTimeout(settle);
 };
 }, [step, active, currentStep.target, isMobile]);

 // Recompute target on scroll/resize
 useEffect(() => {
 if (!active || !currentStep.target || isMobile) return;
 let raf = 0;
 const recompute = () => {
 if (raf) return;
 raf = requestAnimationFrame(() => {
 raf = 0;
 const el = document.querySelector(currentStep.target!) as HTMLElement | null;
 if (el) setTargetRect(rectFrom(el));
 });
 };
 window.addEventListener("scroll", recompute, true);
 window.addEventListener("resize", recompute);
 return () => {
 window.removeEventListener("scroll", recompute, true);
 window.removeEventListener("resize", recompute);
 if (raf) cancelAnimationFrame(raf);
 };
 }, [active, currentStep.target, isMobile]);

 // Compute tooltip placement + position. Measures via double rAF so the read
 // happens after layout settles (post-mount, post-style-recalc), preventing a
 // stale tooltipH that would push the footer off-screen on first paint.
 useLayoutEffect(() => {
 if (!active || !tooltipRef.current || viewport.w === 0) return;

 let raf1 = 0;
 let raf2 = 0;

 const measure = () => {
 const tEl = tooltipRef.current;
 if (!tEl) return;
 const tooltipW = tEl.offsetWidth || 384;
 const tooltipH = tEl.offsetHeight || 280;

 if (!targetRect || isMobile) {
 const pos = tooltipPosition(
 { top: 0, left: 0, width: 0, height: 0 },
 "center",
 tooltipW,
 tooltipH,
 viewport.w,
 viewport.h
 );
 setPlacement("center");
 setTooltipPos(pos);
 setTooltipRect({ top: pos.top, left: pos.left, width: tooltipW, height: tooltipH });
 setArrowReady(false);
 return;
 }

 const p = pickPlacement(targetRect, tooltipW, tooltipH, viewport.w, viewport.h);
 const pos = tooltipPosition(targetRect, p, tooltipW, tooltipH, viewport.w, viewport.h);
 setPlacement(p);
 setTooltipPos(pos);
 setTooltipRect({ top: pos.top, left: pos.left, width: tooltipW, height: tooltipH });
 };

 measure();
 raf1 = requestAnimationFrame(() => {
 raf2 = requestAnimationFrame(measure);
 });

 const arrowTimer = setTimeout(() => setArrowReady(true), 280);
 return () => {
 if (raf1) cancelAnimationFrame(raf1);
 if (raf2) cancelAnimationFrame(raf2);
 clearTimeout(arrowTimer);
 };
 }, [targetRect, viewport, isMobile, active, step]);

 // Re-measure after web fonts load. Font swap shifts content height after
 // initial paint; without this the modal stays positioned for the pre-swap
 // height and clips the footer.
 useEffect(() => {
 if (!active) return;
 if (typeof document === "undefined" || !document.fonts?.ready) return;
 let cancelled = false;
 document.fonts.ready.then(() => {
 if (!cancelled) window.dispatchEvent(new Event("resize"));
 });
 return () => {
 cancelled = true;
 };
 }, [active]);

 // Final safety net: 50ms after step mount, dispatch a synthetic resize so
 // any layout shift from sidebar collapse, scrollbar appearance, or
 // animation completion folds back into the position calc.
 useEffect(() => {
 if (!active) return;
 const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 50);
 return () => clearTimeout(t);
 }, [active, step]);

 // Keyboard
 useEffect(() => {
 if (!active) return;
 const handler = (e: KeyboardEvent) => {
 if (e.key === "Escape") close();
 if (e.key === "ArrowRight" || e.key === "Enter") next();
 if (e.key === "ArrowLeft") prev();
 };
 document.addEventListener("keydown", handler);
 return () => document.removeEventListener("keydown", handler);
 }, [active, next, prev, close]);

 if (!active) return null;

 const progressPct = ((step + 1) / TOUR_STEPS.length) * 100;
 const arrow =
 targetRect && tooltipRect && placement !== "center" && !isMobile
 ? buildArrowPath(tooltipRect, targetRect, placement)
 : null;

 return (
 <div className="fixed inset-0 z-[9998]" aria-live="polite">
 {/* Top progress strip */}
 <div className="fixed top-0 left-0 right-0 h-[3px] bg-black/20 dark:bg-white/10 z-[10001] pointer-events-none">
 <motion.div
 initial={false}
 animate={{ width: `${progressPct}%` }}
 transition={{ type: "spring", stiffness: 180, damping: 26 }}
 className="h-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#d946ef]"
 />
 </div>

 {/* Backdrop */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.25 }}
 className="absolute inset-0"
 style={{
 backgroundColor: "rgba(10, 10, 20, 0.55)",
 backdropFilter: "blur(2px)",
 WebkitBackdropFilter: "blur(2px)",
 }}
 onClick={close}
 />

 {/* Spotlight ring + sonar */}
 <AnimatePresence>
 {targetRect && !isMobile && (
 <motion.div
 key={`spot-${step}`}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.25 }}
 className="pointer-events-none fixed z-[9999]"
 style={{
 top: targetRect.top - 6,
 left: targetRect.left - 6,
 width: targetRect.width + 12,
 height: targetRect.height + 12,
 borderRadius: 12,
 boxShadow:
 "0 0 0 2px rgba(139,92,246,0.9), 0 0 0 9999px rgba(10,10,20,0.0), 0 0 32px 8px rgba(139,92,246,0.45)",
 }}
 >
 {/* Sonar rings */}
 <span className="rp-sonar rp-sonar-1" />
 <span className="rp-sonar rp-sonar-2" />
 {/* Click indicator */}
 {currentStep.action && (
 <div className="absolute -bottom-2 -right-2 flex items-center justify-center rp-bounce">
 <div className="bg-gradient-to-br from-[#8b5cf6] to-[#d946ef] rounded-full p-1.5 shadow-lg shadow-violet-500/50 ring-2 ring-white/80 dark:ring-white/30">
 <MousePointerClick className="h-3.5 w-3.5 text-white" />
 </div>
 </div>
 )}
 </motion.div>
 )}
 </AnimatePresence>

 {/* Animated SVG arrow */}
 <svg
 className="pointer-events-none fixed inset-0 z-[9999]"
 width="100%"
 height="100%"
 style={{ overflow: "visible" }}
 >
 <defs>
 <marker
 id="rp-arrowhead"
 viewBox="0 0 10 10"
 refX="8"
 refY="5"
 markerWidth="6"
 markerHeight="6"
 orient="auto-start-reverse"
 >
 <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
 </marker>
 </defs>
 <AnimatePresence>
 {arrow && arrowReady && (
 <motion.path
 key={`arrow-${step}`}
 d={arrow.d}
 fill="none"
 stroke="#8b5cf6"
 strokeWidth={2.5}
 strokeLinecap="round"
 strokeDasharray="1"
 markerEnd="url(#rp-arrowhead)"
 initial={{ pathLength: 0, opacity: 0 }}
 animate={{ pathLength: 1, opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ pathLength: { duration: 0.5, ease: "easeOut" }, opacity: { duration: 0.2 } }}
 style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.6))" }}
 />
 )}
 </AnimatePresence>
 </svg>

 {/* Tooltip card */}
 <AnimatePresence mode="wait">
 <motion.div
 key={step}
 ref={tooltipRef}
 initial={{ opacity: 0, y: 12, scale: currentStep.variant === "ai-config" ? 0.92 : isFirst ? 0.95 : 1 }}
 animate={{ opacity: tooltipPos ? 1 : 0, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -8, scale: 1 }}
 transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.7 }}
 className={
 currentStep.variant === "ai-config"
 ? isSmall
 ? "rp-no-scrollbar fixed left-2 right-2 bottom-2 bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-[10000] pointer-events-auto flex flex-col overflow-hidden"
 : "rp-no-scrollbar fixed bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-[10000] pointer-events-auto flex flex-col overflow-hidden"
 : isMobile
 ? "fixed left-0 right-0 bottom-0 bg-card/95 backdrop-blur-xl rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-white/10 z-[10000] pointer-events-auto max-h-[85dvh] overflow-y-auto overscroll-contain rp-no-scrollbar"
 : "fixed bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-[10000] pointer-events-auto w-[min(92vw,384px)] max-h-[90dvh] overflow-y-auto overscroll-contain rp-no-scrollbar"
 }
 style={
 currentStep.variant === "ai-config"
 ? isSmall
 ? {
 maxHeight: "85dvh",
 boxShadow:
 "0 -8px 32px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(139, 92, 246, 0.08), 0 0 32px -8px rgba(139, 92, 246, 0.25)",
 }
 : {
 // Browser-native centering: inset:0 + margin:auto centers a fixed
 // element of known width and capped max-height inside the viewport
 // without any JS measurement. Avoids the race where tooltipH was
 // read while framer-motion was still mounting / fonts hadn't swapped,
 // which left the modal positioned for a stale height and clipped the
 // footer on first paint until a zoom triggered relayout.
 inset: 0,
 margin: "auto",
 width: "min(560px, calc(100vw - 32px))",
 maxHeight: "min(640px, calc(100dvh - 48px))",
 boxShadow:
 "0 24px 48px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(139, 92, 246, 0.08), 0 0 32px -8px rgba(139, 92, 246, 0.25)",
 }
 : isMobile
 ? {
 boxShadow:
 "0 -8px 32px -8px rgba(0,0,0,0.35), 0 0 0 1px rgba(139, 92, 246, 0.08)",
 }
 : {
 top: tooltipPos?.top ?? -9999,
 left: tooltipPos?.left ?? -9999,
 boxShadow:
 "0 24px 48px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(139, 92, 246, 0.08), 0 0 32px -8px rgba(139, 92, 246, 0.25)",
 }
 }
 >
 {/* Top bar */}
 <div className={`flex items-center justify-between ${currentStep.variant === "ai-config" ? "px-5 pt-4 shrink-0" : "px-6 pt-5"}`}>
 <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent ring-1 ring-accent/20">
 Step {step + 1} / {TOUR_STEPS.length}
 </span>
 <button
 onClick={close}
 className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
 >
 Skip tour
 </button>
 </div>

 {/* Icon */}
 <div className={`flex justify-center ${currentStep.variant === "ai-config" ? "px-5 pt-3 shrink-0" : "px-6 pt-5"}`}>
 <div className={`rounded-2xl bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#d946ef] ${currentStep.variant === "ai-config" ? "p-2.5" : "p-4"} shadow-lg shadow-violet-500/30`}>
 {currentStep.icon}
 </div>
 </div>

 {/* Content */}
 <div className={`text-center ${currentStep.variant === "ai-config" ? "px-5 pt-2 pb-1 shrink-0" : `px-6 pt-5 pb-2`}`}>
 <div className={`flex items-center justify-center gap-2 flex-wrap ${currentStep.variant === "ai-config" ? "mb-1" : "mb-2"}`}>
 <h3 className={`font-sans font-semibold tracking-tight ${currentStep.variant === "ai-config" ? "text-lg" : "text-xl"}`}>{currentStep.title}</h3>
 {currentStep.comingSoon && (
 <span className="inline-flex items-center rounded-full bg-violet-500/15 dark:bg-violet-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/30">
 Coming Soon
 </span>
 )}
 </div>
 <p className={`${currentStep.variant === "ai-config" ? "text-[12.5px]" : "text-sm"} text-muted-foreground`} style={{ lineHeight: currentStep.variant === "ai-config" ? 1.5 : 1.6 }}>
 {currentStep.description}
 </p>
 {currentStep.target && !targetRect && !isMobile && (
 <p className="mt-3 text-[11px] text-muted-foreground/70 italic">
 (Highlight unavailable on this page — continue the tour to learn more.)
 </p>
 )}
 </div>

 {/* AI Config rich body */}
 {currentStep.variant === "ai-config" && (
 <div className="px-5 pt-2 pb-2 text-left flex-1 min-h-0 overflow-y-auto rp-no-scrollbar">
 {/* Section A — App Context Profile */}
 <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-secondary/40 p-2.5 mb-2.5">
 <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
 App Context Profile
 </p>
 <div className={`grid ${isSmall ? "grid-cols-1" : "grid-cols-2"} gap-1.5 mb-1.5`}>
 {[
 "📝 Business / app description",
 "⭐ Key features",
 "❓ Common questions",
 "🎯 Preferred reply tone",
 ].map((label) => (
 <span
 key={label}
 className="inline-flex items-center rounded-full bg-card border border-slate-200 dark:border-white/10 px-2.5 py-1 text-[11px] text-foreground/80 truncate"
 >
 {label}
 </span>
 ))}
 </div>
 <p className="text-[11px] text-muted-foreground leading-snug">
 Skip this and replies are generic. Fill it in and they feel hand-written.
 </p>
 </div>

 {/* Section B — Reply Modes */}
 <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
 Reply modes
 </p>
 <div className={`grid gap-2 mb-2.5 ${isSmall ? "grid-cols-1" : "grid-cols-3"}`}>
 {/* Manual */}
 <div className={`relative rounded-xl border border-slate-200 dark:border-white/10 bg-card p-3 ${isSmall ? "pr-20" : "pt-7"} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
 <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-secondary/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
 Default
 </span>
 <div className={`${isSmall ? "flex items-start gap-2.5" : ""}`}>
 <div className={`flex items-center gap-1.5 ${isSmall ? "shrink-0 mt-0.5" : "mb-1"}`}>
 <Hand className="h-5 w-5 text-slate-500 dark:text-slate-400" />
 {!isSmall && <span className="text-sm font-semibold">Manual</span>}
 </div>
 <div className={isSmall ? "min-w-0" : ""}>
 {isSmall && <span className="block text-sm font-semibold mb-0.5">Manual</span>}
 <p className="text-[12px] text-muted-foreground" style={{ lineHeight: 1.45 }}>
 You click <em>Generate Reply</em> on each review. Full control, zero surprises.
 </p>
 </div>
 </div>
 </div>

 {/* Semi-Automated — recommended */}
 <div
 className={`relative rounded-xl border-2 border-violet-500/60 dark:border-violet-400/50 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-3 ${isSmall ? "pr-28" : "pt-7"} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
 style={{ boxShadow: "0 0 24px -4px rgba(139,92,246,0.35)" }}
 >
 <span className="absolute top-2 right-2 inline-flex items-center rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#d946ef] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow-sm">
 Recommended
 </span>
 <div className={`${isSmall ? "flex items-start gap-2.5" : ""}`}>
 <div className={`flex items-center gap-1.5 ${isSmall ? "shrink-0 mt-0.5" : "mb-1"}`}>
 <Wand2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
 {!isSmall && <span className="text-sm font-semibold">Semi-Automated</span>}
 </div>
 <div className={isSmall ? "min-w-0" : ""}>
 {isSmall && <span className="block text-sm font-semibold mb-0.5">Semi-Automated</span>}
 <p className="text-[12px] text-muted-foreground" style={{ lineHeight: 1.45 }}>
 AI drafts replies as new reviews arrive. You approve or edit before publishing.
 </p>
 </div>
 </div>
 </div>

 {/* Fully Automated */}
 <div className={`relative rounded-xl border border-slate-200 dark:border-white/10 bg-card p-3 ${isSmall ? "pr-28" : "pt-7"} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
 <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30">
 ⚠ Instant posting
 </span>
 <div className={`${isSmall ? "flex items-start gap-2.5" : ""}`}>
 <div className={`flex items-center gap-1.5 ${isSmall ? "shrink-0 mt-0.5" : "mb-1"}`}>
 <Zap className="h-5 w-5 text-amber-500" />
 {!isSmall && <span className="text-sm font-semibold">Fully Automated</span>}
 </div>
 <div className={isSmall ? "min-w-0" : ""}>
 {isSmall && <span className="block text-sm font-semibold mb-0.5">Fully Automated</span>}
 <p className="text-[12px] text-muted-foreground" style={{ lineHeight: 1.45 }}>
 AI generates and posts replies instantly, no review needed. Hands-off.
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Section C — Safety net */}
 <div className="flex items-start gap-2 text-[11px] text-muted-foreground/80 leading-snug">
 <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
 <span>Safety net: always draft replies for 1–2★ reviews, even in Fully Automated mode.</span>
 </div>
 </div>
 )}

 {/* Finale rich body */}
 {currentStep.variant === "finale" && (
 <div className="px-6 pt-2 pb-1">
 <ol className="space-y-2 mb-1">
 {[
 "Connect a review source",
 "Fill in AI Configuration",
 "Pick your reply mode",
 ].map((label, i) => (
 <li key={label} className="flex items-center gap-3 text-sm">
 <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#d946ef] text-white text-[11px] font-bold">
 {i + 1}
 </span>
 <span className="text-foreground/90">{label}</span>
 </li>
 ))}
 </ol>
 </div>
 )}

 {/* Progress dots */}
 <div className={`flex justify-center gap-1.5 ${currentStep.variant === "ai-config" ? "pt-2 pb-2 shrink-0" : "pt-5 pb-3"}`}>
 {TOUR_STEPS.map((_, i) => (
 <button
 key={i}
 onClick={() => setStep(i)}
 aria-label={`Go to step ${i + 1}`}
 className={`h-1.5 rounded-full transition-all duration-300 ${
 i === step
 ? "w-6 bg-gradient-to-r from-[#8b5cf6] to-[#d946ef]"
 : "w-1.5 bg-border hover:bg-muted-foreground/30"
 }`}
 />
 ))}
 </div>

 {/* Actions */}
 <div className={`flex items-center justify-between gap-3 flex-wrap ${currentStep.variant === "ai-config" ? "px-5 pb-2 shrink-0" : "px-6 pb-3"}`}>
 <Button
 variant="ghost"
 size="sm"
 onClick={prev}
 disabled={isFirst}
 className="text-muted-foreground disabled:opacity-30"
 >
 <ArrowLeft className="mr-1 h-3 w-3" /> Back
 </Button>
 {currentStep.variant === "ai-config" ? (
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={next}
 >
 Continue tour
 </Button>
 <Button
 size="sm"
 onClick={goToAiConfig}
 className="bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#d946ef] text-white border-0 hover:opacity-90"
 >
 Take me to AI Config
 <ArrowRight className="ml-1 h-3 w-3" />
 </Button>
 </div>
 ) : currentStep.variant === "finale" ? (
 <div className="flex items-center gap-3 flex-wrap">
 <button
 onClick={goToAiConfig}
 className="text-xs text-accent hover:underline"
 >
 Or set up AI Config first →
 </button>
 <Button
 size="sm"
 onClick={next}
 className="bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#d946ef] text-white border-0 hover:opacity-90"
 >
 Connect a source
 <ArrowRight className="ml-1 h-3 w-3" />
 </Button>
 </div>
 ) : (
 <Button
 size="sm"
 onClick={next}
 className="bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#d946ef] text-white border-0 hover:opacity-90"
 >
 {isLast ? "Connect a Source" : "Next"}
 {!isLast && <ArrowRight className="ml-1 h-3 w-3" />}
 </Button>
 )}
 </div>

 {/* Keyboard hint */}
 <div className={`text-center ${currentStep.variant === "ai-config" ? "px-5 pb-3 shrink-0" : "px-6 pb-4"}`}>
 <p className="text-[10px] text-muted-foreground/70">
 Press <kbd className="px-1 py-0.5 rounded border bg-secondary/60 font-mono text-[9px]">→</kbd> to continue,{" "}
 <kbd className="px-1 py-0.5 rounded border bg-secondary/60 font-mono text-[9px]">Esc</kbd> to skip
 </p>
 </div>
 </motion.div>
 </AnimatePresence>

 <style jsx global>{`
 @keyframes rp-sonar-pulse {
 0% {
 transform: scale(1);
 opacity: 0.5;
 }
 100% {
 transform: scale(1.6);
 opacity: 0;
 }
 }
 @keyframes rp-bounce-y {
 0%, 100% { transform: translateY(0); }
 50% { transform: translateY(-4px); }
 }
 .rp-sonar {
 position: absolute;
 inset: 0;
 border-radius: inherit;
 border: 2px solid rgba(139, 92, 246, 0.55);
 pointer-events: none;
 animation: rp-sonar-pulse 1.5s ease-out infinite;
 }
 .rp-sonar-2 {
 animation-delay: 0.75s;
 }
 .rp-bounce {
 animation: rp-bounce-y 1.2s ease-in-out infinite;
 }
 .rp-no-scrollbar {
 scrollbar-width: none;
 -ms-overflow-style: none;
 }
 .rp-no-scrollbar::-webkit-scrollbar {
 display: none;
 }
 `}</style>
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
