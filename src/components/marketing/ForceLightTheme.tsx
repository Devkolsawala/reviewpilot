"use client";

import { useEffect } from "react";

// Marketing routes are always light, regardless of OS preference or the
// localStorage `theme` choice the user made inside the dashboard. This
// effect handles client-side navigation from app → marketing; the
// initial paint is already covered by the inline script in app/layout.tsx.
export function ForceLightTheme() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  return null;
}
