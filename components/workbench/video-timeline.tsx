"use client";

import * as React from "react";
import { VIDEO_LABELS } from "@/lib/config";
import { labelColor } from "@/lib/labels";
import { formatRulerLabel, formatSeconds, formatTimecode, rulerTicks } from "@/lib/timecode";
import type { Segment } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * VideoTimeline — the dope sheet: one track per action label, a timecode ruler,
 * the in/out band and a movable playhead (DESIGN.md §4.6). This is one of the two
 * places allowed to spend boldness, so it is built as a real editor surface:
 *
 * - one track per label; a segment sits at its time and carries its label text
 *   when it is wide enough, and a tooltip always;
 * - failure segments are hatched with a 2px red outline;
 * - a segment with a validation problem is outlined in red and flagged;
 * - the playhead is `role="slider"` with its value announced in timecode;
 * - click or drag anywhere on the tracks to scrub (AGENTS.md A3, DESIGN §7).
 */

const GUTTER = 72;

export function VideoTimeline({
  segments,
  durationMs,
  fps,
  currentMs,
  selectedId,
  inMs,
  outMs,
  problemIds,
  onSeek,
  onSelect,
  className,
}: {
  segments: Segment[];
  durationMs: number;
  fps: number;
  currentMs: number;
  selectedId: string | null;
  inMs: number;
  outMs: number;
  problemIds: Set<string>;
  onSeek: (ms: number) => void;
  onSelect: (id: string | null) => void;
  className?: string;
}) {
  const tracksRef = React.useRef<HTMLDivElement | null>(null);
  const [scrubbing, setScrubbing] = React.useState(false);
  const duration = durationMs > 0 ? durationMs : 1;
  const pct = (ms: number) => `${Math.max(0, Math.min(100, (ms / duration) * 100))}%`;

  const msFromEvent = React.useCallback(
    (clientX: number) => {
      const rect = tracksRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return 0;
      const ratio = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(duration, ratio * duration));
    },
    [duration],
  );

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    setScrubbing(true);
    tracksRef.current?.setPointerCapture(e.pointerId);
    onSeek(msFromEvent(e.clientX));
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!scrubbing) return;
    onSeek(msFromEvent(e.clientX));
  }
  function onPointerUp(e: React.PointerEvent) {
    setScrubbing(false);
    tracksRef.current?.releasePointerCapture?.(e.pointerId);
  }

  const inPct = (Math.min(inMs, outMs) / duration) * 100;
  const outPct = (Math.max(inMs, outMs) / duration) * 100;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex">
        {/* label gutter */}
        <div className="shrink-0" style={{ width: GUTTER }} aria-hidden>
          <div className="h-6" />
          {VIDEO_LABELS.map((label, i) => (
            <div
              key={label}
              className="flex h-7 items-center gap-1.5 border-b border-rule pr-2"
            >
              <span
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ background: labelColor(label, i) }}
              />
              <span className="truncate text-xs text-ink-muted">{label}</span>
            </div>
          ))}
          <div className="h-6" />
        </div>

        {/* time area */}
        <div className="min-w-0 flex-1">
          <div
            ref={tracksRef}
            data-testid="video-timeline"
            className={cn(
              "relative select-none border-l border-rule",
              scrubbing ? "cursor-grabbing" : "cursor-pointer",
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* in/out band */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-6 bottom-6 left-0 rounded-[2px] bg-brand-tint/70"
              style={{ left: `${inPct}%`, width: `${Math.max(0, outPct - inPct)}%` }}
            />

            {/* tracks */}
            <div className="relative">
              <div className="flex h-6 items-center justify-between px-1 text-xs text-ink-muted">
                <span className="machine">in {formatTimecode(Math.min(inMs, outMs), fps)}</span>
                <span className="machine">out {formatTimecode(Math.max(inMs, outMs), fps)}</span>
              </div>

              {VIDEO_LABELS.map((label) => (
                <div key={label} className="relative h-7 border-b border-rule">
                  {segments
                    .filter((s) => s.action_label === label)
                    .map((s) => {
                      const selected = s.id === selectedId;
                      const problem = problemIds.has(s.id);
                      const failure = s.outcome === "failure";
                      const widthPct = Math.max(0, ((s.end_ms - s.start_ms) / duration) * 100);
                      const color = labelColor(label, VIDEO_LABELS.indexOf(label));
                      return (
                        <button
                          key={s.id}
                          type="button"
                          title={`${s.action_label}\n${formatSeconds(s.start_ms)} to ${formatSeconds(s.end_ms)}\n${s.object || "No object named"}\nOutcome: ${s.outcome}`}
                          aria-label={`Segment ${s.action_label} from ${formatTimecode(s.start_ms, fps)} to ${formatTimecode(s.end_ms, fps)}, ${s.outcome}`}
                          aria-pressed={selected}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => {
                            onSelect(s.id);
                            onSeek(s.start_ms);
                          }}
                          className={cn(
                            "absolute top-1 bottom-1 flex items-center overflow-hidden rounded-[2px] px-1.5 text-left text-xs text-white transition-[box-shadow,transform]",
                            selected ? "z-10 ring-2 ring-ink" : "hover:brightness-110",
                          )}
                          style={{
                            left: `${(s.start_ms / duration) * 100}%`,
                            width: `${widthPct}%`,
                            minWidth: 6,
                            background: color,
                            boxShadow: failure
                              ? "inset 0 0 0 2px var(--rejected-ink)"
                              : problem
                                ? "inset 0 0 0 2px var(--rejected-ink)"
                                : undefined,
                          }}
                        >
                          {failure && (
                            <span
                              aria-hidden
                              className="absolute inset-0"
                              style={{
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, rgba(0,0,0,.42) 0 3px, rgba(0,0,0,0) 3px 7px)",
                              }}
                            />
                          )}
                          {widthPct > 4 && (
                            <span className="relative truncate font-medium">{s.action_label}</span>
                          )}
                          {problem && (
                            <span
                              aria-hidden
                              className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-rejected-ink ring-2 ring-white"
                            />
                          )}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>

            {/* ruler */}
            <div className="relative h-6 border-t border-rule">
              {rulerTicks(duration, 4).map((ms, i) => (
                <span
                  key={i}
                  className="absolute top-0 -translate-x-1/2 pt-0.5 text-xs text-ink-muted"
                  style={{ left: `${(ms / duration) * 100}%` }}
                >
                  {formatRulerLabel(ms)}
                </span>
              ))}
            </div>

            {/* playhead */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Playhead"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(currentMs)}
              aria-valuetext={formatTimecode(currentMs, fps)}
              className="absolute top-0 bottom-0 z-20 w-px bg-brand"
              style={{ left: pct(currentMs) }}
            >
              <span className="absolute -left-[5px] top-0 size-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-brand" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
