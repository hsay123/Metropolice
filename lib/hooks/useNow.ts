"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * useNow — a live clock safe for SSR.
 *
 * Next.js flags `Date.now()` called during a render pass as an unstable value,
 * so the timestamp is never produced inside a render. Instead a module-level
 * variable is written only from the subscription callbacks, which React invokes
 * on the client. getSnapshot returns a plain field read and getServerSnapshot
 * returns null, so the server HTML is deterministic and the first client paint
 * matches it.
 *
 * Subscribe keeps a stable identity (React resubscribes when it changes) and
 * never calls onStoreChange synchronously — both would trigger the
 * "Maximum update depth exceeded" loop. The first tick goes through a
 * setTimeout(0) so the countdown appears right after hydration.
 */
let latestNow: number | null = null;

function notify(intervalMs: number, onStoreChange: () => void) {
  const timer = setTimeout(() => {
    latestNow = Date.now();
    onStoreChange();
  }, 0);
  const id = setInterval(() => {
    latestNow = Date.now();
    onStoreChange();
  }, intervalMs);
  return () => {
    clearTimeout(timer);
    clearInterval(id);
  };
}

export function useNow(intervalMs = 1000): number | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => notify(intervalMs, onStoreChange),
    [intervalMs],
  );
  const now = useSyncExternalStore(subscribe, () => latestNow, () => null);
  return now;
}