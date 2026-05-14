"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const NAMESPACE = "reviewpilot:tools:char-counter";

function fullKey(key: string): string {
  return `${NAMESPACE}:${key}`;
}

function readValue<T>(key: string, initial: T): T {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(fullKey(key));
    if (raw === null) return initial;
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}

export function useToolStorage<T>(
  key: string,
  initial: T,
  debounceMs = 500
): [T, (next: T) => void] {
  // SSR returns initial; client hydrates from localStorage on mount.
  const [value, setValueState] = useState<T>(initial);
  const hydratedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate once on mount.
  useEffect(() => {
    const stored = readValue(key, initial);
    setValueState(stored);
    hydratedRef.current = true;
    // We intentionally read the latest `initial` only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = useCallback(
    (next: T) => {
      setValueState(next);
      if (typeof window === "undefined") return;
      if (timerRef.current) clearTimeout(timerRef.current);
      const write = () => {
        try {
          window.localStorage.setItem(fullKey(key), JSON.stringify(next));
        } catch {
          /* quota / private mode — silent */
        }
      };
      if (debounceMs <= 0) write();
      else timerRef.current = setTimeout(write, debounceMs);
    },
    [key, debounceMs]
  );

  // Flush pending write if unmounted.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return [value, setValue];
}

// Clears every key namespaced under this tool. Used by "Reset tool".
export function clearToolStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const ls = window.localStorage;
    const toDelete: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(`${NAMESPACE}:`)) toDelete.push(k);
    }
    toDelete.forEach((k) => ls.removeItem(k));
  } catch {
    /* silent */
  }
}
