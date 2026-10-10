"use client";

import * as React from "react";
import { ImageOff, MousePointerSquareDashed } from "lucide-react";
import type { AvailableTask, Box } from "@/lib/api/types";
import { useWorkbench } from "@/lib/store/workbench";
import { fitContain, useElementSize } from "@/lib/hooks/useElementSize";
import { BoxOverlay } from "@/components/workbench/box-overlay";
import { labelColor } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * ImageEditor — the image-boxes-v1 workbench surface. Draw a box by dragging on
 * the media; click a box to select it; edit its class and confidence in the rail.
 * Coordinates are stored in image pixels (AGENTS.md A8) and drawn as percentages.
 *
 * Keyboard (AGENTS.md A2: keyboard-first): 1–9 pick a class, Delete removes the
 * selected box, Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z redoes, Escape deselects.
 */

const MIN_BOX_PX = 8;

function uid() {
  return `box_${Math.random().toString(36).slice(2, 9)}`;
}

export function ImageEditor({
  task,
  className,
}: {
  task: AvailableTask;
  className?: string;
}) {
  const boxes = useWorkbench((s) => s.boxes);
  const selectedId = useWorkbench((s) => s.selectedId);
  const activeClass = useWorkbench((s) => s.activeClass);
  const setActiveClass = useWorkbench((s) => s.setActiveClass);
  const select = useWorkbench((s) => s.select);
  const addBox = useWorkbench((s) => s.addBox);
  const undo = useWorkbench((s) => s.undo);
  const redo = useWorkbench((s) => s.redo);

  const { ref: stageRef, size } = useElementSize<HTMLDivElement>();
  const overlayRef = React.useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = React.useState<Box | null>(null);
  const startRef = React.useRef<{ x: number; y: number } | null>(null);
  const [broken, setBroken] = React.useState(false);

  const imageWidth = task.asset.width ?? 1280;
  const imageHeight = task.asset.height ?? 960;
  const classes = React.useMemo(() => task.classes ?? [], [task.classes]);
  const fit = fitContain(size.width, size.height, imageWidth, imageHeight);

  /** Map a client point to image pixel coordinates. */
  const toImage = React.useCallback(
    (clientX: number, clientY: number) => {
      const rect = overlayRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return { x: 0, y: 0 };
      const x = ((clientX - rect.left) / rect.width) * imageWidth;
      const y = ((clientY - rect.top) / rect.height) * imageHeight;
      return {
        x: Math.max(0, Math.min(imageWidth, x)),
        y: Math.max(0, Math.min(imageHeight, y)),
      };
    },
    [imageWidth, imageHeight],
  );

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    if (!activeClass) return;
    const p = toImage(e.clientX, e.clientY);
    startRef.current = p;
    setDraft({ id: "draft", x: p.x, y: p.y, w: 0, h: 0, class: activeClass, confidence: 3 });
    overlayRef.current?.setPointerCapture(e.pointerId);
    select(null);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!startRef.current) return;
    const s = startRef.current;
    const p = toImage(e.clientX, e.clientY);
    setDraft({
      id: "draft",
      x: Math.min(s.x, p.x),
      y: Math.min(s.y, p.y),
      w: Math.abs(p.x - s.x),
      h: Math.abs(p.y - s.y),
      class: activeClass,
      confidence: 3,
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    const s = startRef.current;
    startRef.current = null;
    overlayRef.current?.releasePointerCapture?.(e.pointerId);
    if (!s || !draft) {
      setDraft(null);
      return;
    }
    if (draft.w >= MIN_BOX_PX && draft.h >= MIN_BOX_PX) {
      addBox({
        id: uid(),
        x: Math.round(draft.x),
        y: Math.round(draft.y),
        w: Math.round(draft.w),
        h: Math.round(draft.h),
        class: activeClass,
        confidence: 3,
      });
    }
    setDraft(null);
  }

  // Document-level shortcuts. Ignore while typing in a field.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (typing) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (e.key === "Escape") {
        select(null);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        useWorkbench.getState().removeBox(selectedId);
        return;
      }
      const n = Number(e.key);
      if (!mod && n >= 1 && n <= 9 && classes[n - 1]) {
        setActiveClass(classes[n - 1]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [classes, selectedId, setActiveClass, select, undo, redo]);

  const activeColor = labelColor(activeClass, Math.max(0, classes.indexOf(activeClass)));

  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[6px] bg-stage p-4",
        className,
      )}
      ref={stageRef}
    >
      <div className="relative size-full">
        {broken ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-stage-ink/70">
            <ImageOff className="size-6" aria-hidden />
            <p className="text-sm">This media could not be loaded. Signed links expire.</p>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={task.asset.url}
              alt={`${task.jobTitle} media to label`}
              className="pointer-events-none absolute inset-0 size-full object-contain"
              onError={() => setBroken(true)}
            />
            <div
              ref={overlayRef}
              data-testid="image-annotator"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              className={cn(
                "absolute touch-none",
                activeClass ? "cursor-crosshair" : "cursor-not-allowed",
              )}
              style={{
                left: fit.x,
                top: fit.y,
                width: fit.width,
                height: fit.height,
              }}
            >
              <BoxOverlay
                boxes={boxes}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                classes={classes}
                selectedId={selectedId}
                interactive
                onSelect={select}
              />
              {draft && (
                <div
                  aria-hidden
                  className="absolute rounded-[2px] border-2 border-dashed"
                  style={{
                    left: `${(draft.x / imageWidth) * 100}%`,
                    top: `${(draft.y / imageHeight) * 100}%`,
                    width: `${(draft.w / imageWidth) * 100}%`,
                    height: `${(draft.h / imageHeight) * 100}%`,
                    borderColor: activeColor,
                    background: `${activeColor}22`,
                  }}
                />
              )}
              {boxes.length === 0 && !draft && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <span className="inline-flex items-center gap-2 rounded-[2px] bg-black/55 px-3 py-1.5 text-sm text-stage-ink">
                    <MousePointerSquareDashed className="size-4" aria-hidden />
                    Drag to draw a box. Pick a class first.
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
