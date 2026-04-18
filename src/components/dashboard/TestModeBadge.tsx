"use client";

import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

export function TestModeBadge() {
 const [resetting, setResetting] = useState(false);

 if (process.env.NEXT_PUBLIC_TEST_MODE !== "true") return null;

 async function handleReset() {
 setResetting(true);
 try {
 const res = await fetch("/api/test/reset-usage", { method: "POST" });
 const data = await res.json();
 if (data.success) {
 toast({ title: "Usage reset", description: "Your limits are fresh now." });
 } else {
 toast({ title: "Reset failed", description: data.error, variant: "destructive" });
 }
 } catch {
 toast({ title: "Reset failed", variant: "destructive" });
 } finally {
 setResetting(false);
 }
 }

 return (
 <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
 <button
 onClick={handleReset}
 disabled={resetting}
 className="text-[11px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-full px-3 py-1 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors disabled:opacity-50"
 >
 {resetting ? "Resetting…" : "Reset Usage"}
 </button>
 <div className="bg-purple-600 text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-lg animate-pulse select-none">
 ⚡ Test Mode — limits reset every minute
 </div>
 </div>
 );
}
