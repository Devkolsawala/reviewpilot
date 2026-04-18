"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function SonnerToaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/95 group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/60 group-[.toaster]:shadow-[0_16px_48px_-16px_rgba(0,0,0,0.5)] group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] group-[.toast]:text-white group-[.toast]:rounded-md",
          cancelButton:
            "group-[.toast]:bg-muted/60 group-[.toast]:text-muted-foreground group-[.toast]:rounded-md",
          success: "group-[.toaster]:!text-accent",
          error: "group-[.toaster]:!text-destructive",
        },
      }}
      {...props}
    />
  );
}
