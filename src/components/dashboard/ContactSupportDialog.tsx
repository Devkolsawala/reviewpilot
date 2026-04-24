"use client";

import { useState } from "react";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LifeBuoy, Check, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const SUPPORT_CATEGORIES = [
 { value: "billing", label: "Billing" },
 { value: "technical", label: "Technical issue" },
 { value: "account", label: "Account" },
 { value: "feature", label: "Feature request" },
 { value: "other", label: "Other" },
] as const;

type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]["value"];

const SUBJECT_MAX = 120;
const MESSAGE_MAX = 2000;

export function ContactSupportDialog({
 trigger,
 open: controlledOpen,
 onOpenChange: controlledOnOpenChange,
}: {
 trigger?: React.ReactNode;
 open?: boolean;
 onOpenChange?: (open: boolean) => void;
}) {
 const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
 const isControlled = controlledOpen !== undefined;
 const open = isControlled ? controlledOpen : uncontrolledOpen;
 const setOpen = (v: boolean) => {
 if (!isControlled) setUncontrolledOpen(v);
 controlledOnOpenChange?.(v);
 };

 const [category, setCategory] = useState<SupportCategory>("technical");
 const [subject, setSubject] = useState("");
 const [message, setMessage] = useState("");
 const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

 const reset = () => {
 setCategory("technical");
 setSubject("");
 setMessage("");
 setStatus("idle");
 };

 const handleSubmit = async () => {
 if (subject.trim().length < 3) {
 toast({ title: "Subject too short", description: "Please enter at least 3 characters.", variant: "destructive" });
 return;
 }
 if (message.trim().length < 20) {
 toast({ title: "Message too short", description: "Please write at least 20 characters so we can help.", variant: "destructive" });
 return;
 }

 setStatus("sending");
 try {
 const res = await fetch("/api/support", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ category, subject, message }),
 });
 const data = await res.json();

 if (!res.ok) {
 toast({ title: "Error", description: data.error || "Failed to send message", variant: "destructive" });
 setStatus("idle");
 return;
 }

 setStatus("success");
 setTimeout(() => {
 setOpen(false);
 reset();
 }, 2000);
 } catch {
 toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
 setStatus("idle");
 }
 };

 const canSubmit = subject.trim().length >= 3 && message.trim().length >= 20 && status !== "sending";

 return (
 <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
 {trigger !== undefined ? (
 <DialogTrigger asChild>{trigger}</DialogTrigger>
 ) : (
 <DialogTrigger asChild>
 <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
 <LifeBuoy className="h-4 w-4" />
 Contact Support
 </button>
 </DialogTrigger>
 )}
 <DialogContent className="sm:max-w-md">
 {status === "success" ? (
 <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
 <div className="h-12 w-12 rounded-full bg-[linear-gradient(135deg,rgba(99,102,241,0.15),rgba(217,70,239,0.15))] ring-1 ring-accent/30 flex items-center justify-center">
 <Check className="h-6 w-6 text-accent" />
 </div>
 <p className="text-sm font-medium px-4">Thanks! We&apos;ve received your message and will reply to your account email shortly.</p>
 </div>
 ) : (
 <>
 <DialogHeader>
 <DialogTitle className="font-sans text-lg font-semibold tracking-tight">Contact Support</DialogTitle>
 <p className="text-sm text-muted-foreground">Tell us what&apos;s going on — our team usually responds within a few hours.</p>
 </DialogHeader>

 <div className="space-y-4 pt-2">
 {/* Category selector */}
 <div className="flex flex-wrap gap-2">
 {SUPPORT_CATEGORIES.map((c) => (
 <button
 key={c.value}
 onClick={() => setCategory(c.value)}
 className={cn(
 "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
 category === c.value
 ? "bg-accent/10 border-accent/40 text-accent"
 : "border-border/60 text-muted-foreground hover:border-accent/30 hover:text-foreground"
 )}
 >
 {c.label}
 </button>
 ))}
 </div>

 {/* Subject */}
 <div>
 <Input
 placeholder="Brief summary of your issue"
 value={subject}
 onChange={(e) => {
 if (e.target.value.length <= SUBJECT_MAX) setSubject(e.target.value);
 }}
 maxLength={SUBJECT_MAX}
 />
 <div className="flex justify-end mt-1">
 <span className="text-[10px] text-muted-foreground">{subject.length}/{SUBJECT_MAX}</span>
 </div>
 </div>

 {/* Message */}
 <div>
 <Textarea
 placeholder="Describe the issue in detail. Include steps to reproduce if it's a bug."
 value={message}
 onChange={(e) => {
 if (e.target.value.length <= MESSAGE_MAX) setMessage(e.target.value);
 }}
 rows={5}
 className="resize-none"
 />
 <div className="flex items-center justify-between mt-1">
 <span className="text-[10px] text-muted-foreground">{message.length}/{MESSAGE_MAX}</span>
 <Button
 onClick={handleSubmit}
 disabled={!canSubmit}
 variant="gradient"
 size="sm"
 >
 {status === "sending" ? (
 <>
 <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
 Sending...
 </>
 ) : (
 "Send message"
 )}
 </Button>
 </div>
 </div>
 </div>
 </>
 )}
 </DialogContent>
 </Dialog>
 );
}
