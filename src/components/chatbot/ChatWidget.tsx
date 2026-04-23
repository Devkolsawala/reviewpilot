"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatPanel } from "./ChatPanel";

const PULSE_SEEN_KEY = "reviewpilot:chat:pulse-seen";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(PULSE_SEEN_KEY)) {
        setShowPulse(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setShowPulse(false);
    try {
      sessionStorage.setItem(PULSE_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <ChatPanel open={open} onClose={() => setOpen(false)} onMinimize={() => setOpen(false)} />

      {/* FAB */}
      <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.button
            key={open ? "close" : "open"}
            type="button"
            onClick={() => (open ? setOpen(false) : handleOpen())}
            aria-label={open ? "Close chat" : "Open ReviewPilot chat"}
            aria-expanded={open}
            initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0, rotate: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-full",
              "bg-gradient-to-br from-brand-600 via-violet-600 to-fuchsia-500 text-white",
              "shadow-lg shadow-brand-600/30 ring-1 ring-white/10",
              "transition hover:shadow-xl hover:shadow-brand-600/40",
              "focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40"
            )}
          >
            {showPulse && !open && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-brand-500/40"
              />
            )}
            {open ? (
              <X className="relative h-6 w-6" />
            ) : (
              <MessageCircle className="relative h-6 w-6" />
            )}
          </motion.button>
        </AnimatePresence>
      </div>
    </>
  );
}
