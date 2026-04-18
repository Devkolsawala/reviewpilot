"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#0a0a0b",
          color: "#e6e6e7",
        }}
      >
        <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
          <div
            style={{
              margin: "0 auto 2rem",
              height: 64,
              width: 64,
              borderRadius: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#d946ef 100%)",
              boxShadow: "0 0 40px -8px rgba(139,92,246,0.6)",
              fontSize: 28,
            }}
          >
            !
          </div>
          <p
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(230,230,231,0.5)",
              margin: "0 0 0.75rem",
            }}
          >
            Fatal error
          </p>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              margin: "0 0 1rem",
            }}
          >
            Something broke.
          </h1>
          <p
            style={{
              color: "rgba(230,230,231,0.7)",
              margin: "0 0 2rem",
              lineHeight: 1.6,
            }}
          >
            The application hit an unrecoverable error. Try reloading — if it persists, please contact support.
          </p>
          {error?.digest && (
            <p
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 10,
                color: "rgba(230,230,231,0.4)",
                margin: "0 0 1.5rem",
              }}
            >
              ref: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 8,
              padding: "0.625rem 1.25rem",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              background:
                "linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#d946ef 100%)",
              boxShadow: "0 0 20px -4px rgba(139,92,246,0.6)",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
