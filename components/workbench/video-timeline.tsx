"use client";

import * as React from "react";
import { VIDEO_LABELS } from "@/lib/config";
import { labelColor, labelInk } from "@/lib/labels";
import { formatRulerLabel, formatSeconds, formatTimecode } from "@/lib/timecode";
import type { Segment } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * VideoTimeline — the dope sheet, built to docs/MOODBOARD-SPEC.md §3: one
 * multi-colour bar 12px high, radius 6, a violet playhead with a 10px circle
 * handle, ruler ticks every 5 s, and a label chip per segment under the bar
 * (selected = violet fill, white text). This is one of the two places allowed to
 * spend boldness.
 *
 * Segment rules stay visible: a failure segment is hatched and outlined in red, and
 * a segment with a validation problem is outlined in red. Every segment carries its
 * text label, so colour is never the only cue. Click or drag the bar to scrub; the
 * playhead is a `role="slider"` with its value announced in timecode.
 */

const TICK_MS = 5000;

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
  onSelect: (id: string) => void;
  className?: string;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [scrubbing, setScrubbing] = React.useState(false);

  const duration = durationMs > 0 ? durationMs : 1;
  const pct = (ms: number) => `${Math.max(0, Math.min(100, (ms / duration) * 100))}%`;

  const msFromClientX = React.useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(duration, ratio * duration));
    },
    [duration],
  );

  const ticks = React.useMemo(() => {
    const out: number[] = [];
    for (let t = 0; t <= duration; t += TICK_MS) out.push(t);
    return out;
  }, [duration]);

  const inPct = (Math.min(inMs, outMs) / duration) * 100;
  const outPct = (Math.max(inMs, outMs) / duration) * 100;

  const ordered = React.useMemo(
    () => [...segments].sort((a, b) => a.start_ms - b.start_ms),
    [segments],
  );

  function handlePointerDown(e: React.PointerEvent) {
    setScrubbing(true);
    trackRef.current?.setPointerCapture(e.pointerId);
    onSeek(msFromClientX(e.clientX));
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!scrubbing) return;
    onSeek(msFromClientX(e.clientX));
  }
  function handlePointerUp(e: React.PointerEvent) {
    setScrubbing(false);
    if (trackRef.current?.hasPointerCapture(e.pointerId)) {
      trackRef.current.releasePointerCapture(e.pointerId);
    }
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* ruler — ticks every 5s, 11px, --fg-subtle, tabular */}
      <div className="relative h-6">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: pct(t), transform: "translateX(-50%)" }}
          >
            <span className="text-[11px] tabular-nums text-[var(--fg-subtle)]">
              {formatRulerLabel(t)}
            </span>
            <span className="mt-0.5 h-1 w-px bg-[var(--border)]" aria-hidden />
          </span>
        ))}
        {/* in/out span for the selected segment */}
        <span
          aria-hidden
          className="absolute bottom-0 h-0.5 rounded-full bg-[var(--primary)]"
          style={{ left: `${inPct}%`, width: `${Math.max(0, outPct - inPct)}%` }}
        />
      </div>

      {/* the bar */}
      <div
        ref={trackRef}
        data-testid="video-timeline"
        data-ui="timeline-bar"
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-[6px] bg-[var(--surface-2)] select-none",
          scrubbing ? "cursor-grabbing" : "cursor-pointer",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {ordered.map((s) => {
          const index = Math.max(0, VIDEO_LABELS.indexOf(s.action_label));
          const color = labelColor(s.action_label, index);
          const ink = labelInk(s.action_label, index);
          const failure = s.outcome === "failure";
          const problem = problemIds.has(s.id);
          const selected = s.id === selectedId;
          const left = (s.start_ms / duration) * 100;
          const width = Math.max(0.5, ((s.end_ms - s.start_ms) / duration) * 100);
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
                "absolute inset-y-0 flex items-center overflow-hidden rounded-[4px] px-1.5 text-left text-[11px] font-semibold transition-[box-shadow]",
                selected && "z-[1]",
              )}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                minWidth: 4,
                background: color,
                color: ink,
                boxShadow: selected
                  ? "0 0 0 2px var(--surface), 0 0 0 4px var(--primary)"
                  : failure || problem
                    ? "inset 0 0 0 2px var(--s-rejected-fg)"
                    : undefined,
              }}
            >
              {s.end_ms - s.start_ms > duration * 0.06 && (
                <span className="truncate">{s.action_label}</span>
              )}
              {failure && <span className="hatch-failure absolute inset-0" aria-hidden />}
            </button>
          );
        })}

        {/* playhead: 1px violet line with a 10px circle handle */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Playhead"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentMs)}
          aria-valuetext={formatTimecode(currentMs, fps)}
          className="pointer-events-none absolute top-0 bottom-0 z-30 w-px bg-[var(--primary)]"
          style={{ left: pct(currentMs) }}
        >
          <span className="absolute top-1/2 -left-[5px] size-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--primary)] shadow-btn" />
        </div>
      </div>

      {/* label chips under the bar */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {ordered.length === 0 && (
          <span className="text-[13px] text-[var(--fg-muted)]">
            No segments yet. Add one from the panel on the right.
          </span>
        )}
        {ordered.map((s, i) => {
          const selected = s.id === selectedId;
          const failure = s.outcome === "failure";
          const problem = problemIds.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onSelect(s.id);
                onSeek(s.start_ms);
              }}
              aria-pressed={selected}
              title={`${formatSeconds(s.start_ms)} to ${formatSeconds(s.end_ms)}`}
              className={cn(
                "inline-flex h-6 items-center gap-1.5 rounded-[8px] px-2 text-[12px] font-semibold transition-colors",
                selected
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-2)] text-[var(--fg)] hover:bg-[var(--primary-tint)]",
                (failure || problem) && !selected && "ring-1 ring-[var(--s-rejected-fg)]",
                failure && "border border-dashed border-[var(--s-rejected-fg)]",
              )}
            >
              <span
                className="size-1.5 rounded-[2px]"
                style={
                  selected
                    ? { background: "rgba(255,255,255,.85)" }
                    : { background: labelColor(s.action_label, i) }
                }
                aria-hidden
              />
              {s.action_label}
              <span
                className={cn("tabular-nums", selected ? "text-white/80" : "text-[var(--fg-muted)]")}
              >
                {formatSeconds(s.start_ms, 1).replace(" s", "s")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
