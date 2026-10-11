"use client";

import * as React from "react";
import type { Box } from "@/lib/api/types";
import { labelColor, labelInk } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * BoxOverlay — draws image-boxes-v1 boxes as an SVG-free overlay of positioned
 * divs on top of the media (AGENTS.md A4: an overlay with pointer events, no
 * canvas library). Coordinates arrive in image pixels and are drawn as
 * percentages, so the overlay always tracks the rendered media.
 *
 * Every box shows its class as text, so colour is never the only signal. A box
 * that is selected gets a thicker ring in the brand tint.
 */
export function BoxOverlay({
  boxes,
  imageWidth,
  imageHeight,
  classes,
  selectedId,
  onSelect,
  interactive = false,
  hidden,
  reference = false,
  flagById,
}: {
  boxes: Box[];
  imageWidth: number;
  imageHeight: number;
  classes: string[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  interactive?: boolean;
  /** Ids to draw as outlined-only (e.g. reference boxes under the submitted ones). */
  hidden?: Set<string>;
  /** Draw as a reference label: dashed, translucent, prefixed "Ref". */
  reference?: boolean;
  /** Force a flagged outline: an extra box or a wrong-class box. */
  flagById?: Record<string, "extra" | "wrong">;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {boxes.map((box) => {
        const idx = Math.max(0, classes.indexOf(box.class));
        const color = labelColor(box.class, idx);
        const selected = box.id === selectedId;
        const faint = hidden?.has(box.id);
        const flag = flagById?.[box.id];
        const flagged = Boolean(flag);
        return (
          <div
            key={box.id}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`${reference ? "Reference: " : ""}${box.class}, confidence ${box.confidence} of 5`}
            onPointerDown={
              interactive && onSelect
                ? (e) => {
                    e.stopPropagation();
                    onSelect(box.id);
                  }
                : undefined
            }
            onKeyDown={
              interactive && onSelect
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(box.id);
                    }
                  }
                : undefined
            }
            className={cn(
              "absolute rounded-[4px] border",
              interactive && "pointer-events-auto cursor-pointer",
              selected && "ring-2 ring-white/80",
            )}
            style={{
              left: `${(box.x / imageWidth) * 100}%`,
              top: `${(box.y / imageHeight) * 100}%`,
              width: `${(box.w / imageWidth) * 100}%`,
              height: `${(box.h / imageHeight) * 100}%`,
              borderColor: flagged ? "var(--rejected-ink)" : reference ? "#ffffff" : color,
              borderStyle: flagged ? "solid" : reference || faint ? "dashed" : "solid",
              borderWidth: flagged ? 2 : selected ? 2 : 1.5,
              background: reference
                ? "rgba(255,255,255,0.06)"
                : faint
                  ? "transparent"
                  : `${color}22`,
            }}
          >
            <span
              className="absolute -top-px left-0 max-w-full -translate-y-full truncate rounded-t-[4px] px-1 py-0.5 text-xs leading-none font-medium"
              style={{
                background: flagged ? "var(--rejected-ink)" : reference ? "#3a4350" : color,
                color: flagged
                  ? "#ffffff"
                  : reference
                    ? "#e6eaf0"
                    : labelInk(box.class, idx),
              }}
            >
              {reference && <span className="opacity-80">Ref </span>}
              {box.class}
              {!reference && <span className="ml-1 tabular-nums opacity-80">{box.confidence}/5</span>}
              {flag === "extra" && <span className="ml-1">extra</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
