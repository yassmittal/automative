"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

/**
 * Reads a query param without tripping hydration. The server snapshot is
 * always null, so the first client render matches the server and the real
 * value only lands on the subsequent commit.
 */
export function useQueryFlag(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get(key),
    () => null,
  );
}

export function useIsAuthoring(): boolean {
  return useQueryFlag("authoring") === "1";
}
