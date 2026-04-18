"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

export function OnboardingModal() {
 const [open, setOpen] = useState(false);
 const [fullName, setFullName] = useState("");
 const [companyName, setCompanyName] = useState("");
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState("");

 useEffect(() => {
 async function checkProfile() {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 const { data: profile } = await supabase
 .from("profiles")
 .select("full_name, company_name, onboarding_completed")
 .eq("id", user.id)
 .single();

 // Show modal if no full_name or onboarding not completed
 if (!profile?.onboarding_completed && !profile?.full_name) {
 setOpen(true);
 }
 }
 checkProfile();
 }, []);

 async function handleSave() {
 if (!fullName.trim()) {
 setError("Full name is required.");
 return;
 }
 setError("");
 setSaving(true);

 try {
 const supabase = createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 const { error: upsertError } = await supabase
 .from("profiles")
 .upsert({
 id: user.id,
 full_name: fullName.trim(),
 company_name: companyName.trim() || null,
 onboarding_completed: true,
 }, { onConflict: "id" });

 if (upsertError) throw upsertError;
 setOpen(false);
 } catch (err) {
 console.error("[OnboardingModal] save error:", err);
 setError("Failed to save. Please try again.");
 } finally {
 setSaving(false);
 }
 }

 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 {/* Backdrop */}
 <div className="absolute inset-0 bg-black/60" />

 {/* Modal */}
 <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border bg-background p-6 shadow-xl">
 <div className="flex items-center gap-3 mb-5">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shrink-0">
 <Sparkles className="h-5 w-5" />
 </div>
 <div>
 <h2 className="font-sans text- font-semibold tracking-tight">Welcome to ReviewPilot!</h2>
 <p className="text-xs text-muted-foreground mt-0.5">
 Let&apos;s set up your profile to get started.
 </p>
 </div>
 </div>

 <div className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="onboard-name">
 Full Name <span className="text-destructive">*</span>
 </Label>
 <Input
 id="onboard-name"
 placeholder="e.g. Dev Kumar"
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && handleSave()}
 autoFocus
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="onboard-company">Company / App Name</Label>
 <Input
 id="onboard-company"
 placeholder="e.g. CalculatorX, TechCorp"
 value={companyName}
 onChange={(e) => setCompanyName(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && handleSave()}
 />
 </div>

 {error && <p className="text-sm text-destructive">{error}</p>}

 <Button className="w-full" onClick={handleSave} disabled={saving}>
 {saving ? "Saving..." : "Get Started →"}
 </Button>
 </div>
 </div>
 </div>
 );
}
