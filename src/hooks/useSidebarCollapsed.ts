"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "rp:sidebar:collapsed";

export function useSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setCollapsedState(true);
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  const persist = useCallback((value: boolean) => {
    try { window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0"); } catch { /* ignore */ }
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value);
    persist(value);
  }, [persist]);

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      persist(next);
      return next;
    });
  }, [persist]);

  return { collapsed, hydrated, toggle, setCollapsed };
}
