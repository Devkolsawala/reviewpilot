"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export function SecurityTrustBanner() {
 return (
 <motion.div
 initial={{ opacity: 0, y: 6 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.25, ease: "easeOut" }}
 className="mb-4 flex items-start gap-3 rounded-xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 p-3 sm:mb-5 sm:gap-4 sm:p-4 dark:border-indigo-500/20 dark:from-indigo-500/[0.08] dark:via-violet-500/[0.08] dark:to-fuchsia-500/[0.08]"
 >
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
 <ShieldCheck className="h-4 w-4" aria-hidden="true" />
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
 Your data is safe with us
 </p>
 <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
 Everything you enter is encrypted in transit and at rest, isolated to your workspace, and used only to fetch your reviews from Google. We never share or sell your data — and you can disconnect anytime to revoke access instantly.
 </p>
 <Link
 href="/privacy"
 className="mt-2 block text-xs text-indigo-600 underline-offset-2 hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
 >
 Read our security &amp; privacy approach →
 </Link>
 </div>
 </motion.div>
 );
}
