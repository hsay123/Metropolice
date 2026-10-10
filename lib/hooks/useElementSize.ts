"use client";

import * as React from "react";

type Size = { width: number; height: number };

/**
 * useElementSize — tracks an element's rendered size with a ResizeObserver. Used
 * to fit media inside the stage and to map pointer positions to image pixels.
 * Returns a ref callback and the current size. Size is {0,0} until the observer
 * reports, so callers should treat zero as "not measured yet".
 */
export function useElementSize<T extends HTMLElement>() {
  const [size, setSize] = React.useState<Size>({ width: 0, height: 0 });
  const observerRef = React.useRef<ResizeObserver | null>(null);

  const ref = React.useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(node);
    observerRef.current = observer;
    const rect = node.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
  }, []);

  React.useEffect(() => () => observerRef.current?.disconnect(), []);

  return { ref, size };
}

/** Fit a natural width/height inside a box, preserving aspect ratio (object-contain). */
export function fitContain(
  boxW: number,
  boxH: number,
  naturalW: number,
  naturalH: number,
): { x: number; y: number; width: number; height: number } {
  if (boxW <= 0 || boxH <= 0 || naturalW <= 0 || naturalH <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const scale = Math.min(boxW / naturalW, boxH / naturalH);
  const width = naturalW * scale;
  const height = naturalH * scale;
  return { x: (boxW - width) / 2, y: (boxH - height) / 2, width, height };
}
