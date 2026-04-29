"use client";

import { useState } from "react";

export function ResubscribeButton({ token, list }: { token: string; list: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function resubscribe() {
    setState("loading");
    try {
      const res = await fetch("/api/digest/resubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, list }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <span style={{ color: "#16A34A", fontWeight: 600 }}>✓ Resubscribed</span>
    );
  }
  return (
    <button
      onClick={resubscribe}
      disabled={state === "loading"}
      style={{
        background: "#0F172A",
        color: "#fff",
        border: 0,
        padding: "8px 16px",
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 600,
        cursor: state === "loading" ? "wait" : "pointer",
      }}
    >
      {state === "loading" ? "Resubscribing…" : "Resubscribe"}
      {state === "error" && <span style={{ marginLeft: 8 }}>(retry)</span>}
    </button>
  );
}
