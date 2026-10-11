"use client";

import * as React from "react";
import { Eye, EyeOff, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { MediaStage, StageButton } from "@/components/domain/media-stage";
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { VIDEO_LABELS, DEFAULT_FPS } from "@/lib/config";
import { labelColor } from "@/lib/labels";
import { formatSeconds, formatTimecode } from "@/lib/timecode";
import type { Segment } from "@/lib/api/types";
import type { SegmentComparison } from "@/lib/annotations";
import { cn } from "@/lib/utils";

/**
 * VideoReviewStage — the video branch of the review console (DESIGN.md §4.7): a
 * player that jumps to a segment on click, with submitted and reference segments
 * overlaid on the same dope sheet and mismatches highlighted in red. Read-only.
 */
export function VideoReviewStage({
  url,
  poster,
  alt,
  fps,
  durationMs,
  submitted,
  reference,
  showReference,
  onToggleReference,
  comparison,
}: {
  url: string;
  poster?: string;
  alt: string;
  fps: number;
  durationMs: number;
  submitted: Segment[];
  reference: Segment[];
  showReference: boolean;
  onToggleReference: () => void;
  comparison: SegmentComparison | null;
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [currentMs, setCurrentMs] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let raf = 0;
    const tick = () => {
      setCurrentMs(v.currentTime * 1000);
      raf = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      setPlaying(true);
      cancelAnimationFrame(raf);
      tick();
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(raf);
      setCurrentMs(v.currentTime * 1000);
    };
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onPause);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onPause);
    };
  }, []);

  const seek = (ms: number) => {
    const v = videoRef.current;
    const clamped = Math.max(0, Math.min(durationMs, ms));
    setCurrentMs(clamped);
    if (v) v.currentTime = clamped / 1000;
  };

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }

  const frameMs = 1000 / (fps || DEFAULT_FPS);
  const frame = fps || DEFAULT_FPS;

  const flagMap = React.useMemo(() => {
    const map: Record<string, "mismatch" | "extra"> = {};
    if (comparison) {
      for (const m of comparison.labelMismatch) map[m.submitted.id] = "mismatch";
      for (const s of comparison.submittedOnly) map[s.id] = "extra";
    }
    return map;
  }, [comparison]);
  const missingRefIds = React.useMemo(
    () => new Set(comparison?.referenceOnly.map((r) => r.id) ?? []),
    [comparison],
  );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <MediaStage
        className="h-[clamp(320px,46dvh,460px)]"
        toolbar={
          <>
            <button
              type="button"
              onClick={() => seek(currentMs - frameMs)}
              className="grid size-6 place-items-center rounded-[8px] text-stage-ink/80 hover:bg-stage-raised hover:text-stage-ink"
              aria-label="Previous frame"
            >
              <SkipBack className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="grid size-6 place-items-center rounded-[8px] bg-white/10 text-stage-ink hover:bg-white/20"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
            </button>
            <button
              type="button"
              onClick={() => seek(currentMs + frameMs)}
              className="grid size-6 place-items-center rounded-[8px] text-stage-ink/80 hover:bg-stage-raised hover:text-stage-ink"
              aria-label="Next frame"
            >
              <SkipForward className="size-3.5" aria-hidden />
            </button>
            <span className="machine text-xs tabular-nums text-stage-ink/80">
              {formatTimecode(currentMs, frame)}
              <span className="text-stage-ink/40"> / {formatTimecode(durationMs, frame)}</span>
            </span>
            <span className="ml-auto hidden items-center gap-3 text-xs text-stage-ink/70 sm:flex">
              <span>{submitted.length} submitted</span>
              <span>{reference.length} reference</span>
            </span>
            {reference.length > 0 && (
              <StageButton onClick={onToggleReference} aria-pressed={showReference}>
                {showReference ? (
                  <EyeOff className="size-3.5" aria-hidden />
                ) : (
                  <Eye className="size-3.5" aria-hidden />
                )}
                {showReference ? "Hide reference" : "Show reference"}
              </StageButton>
            )}
          </>
        }
      >
        <video
          ref={videoRef}
          src={url}
          poster={poster}
          preload="metadata"
          className="max-h-full max-w-full object-contain"
          aria-label={alt}
        />
      </MediaStage>

      <Panel>
        <PanelHeader
          title="Timeline"
          description="Submitted segments are solid; reference segments are dashed."
        />
        <PanelBody className="pt-3">
          <CompareTimeline
            submitted={submitted}
            reference={reference}
            durationMs={durationMs}
            fps={frame}
            currentMs={currentMs}
            showReference={showReference}
            flagMap={flagMap}
            missingRefIds={missingRefIds}
            onSeek={seek}
          />
        </PanelBody>
      </Panel>
    </div>
  );
}

function CompareTimeline({
  submitted,
  reference,
  durationMs,
  fps,
  currentMs,
  showReference,
  flagMap,
  missingRefIds,
  onSeek,
}: {
  submitted: Segment[];
  reference: Segment[];
  durationMs: number;
  fps: number;
  currentMs: number;
  showReference: boolean;
  flagMap: Record<string, "mismatch" | "extra">;
  missingRefIds: Set<string>;
  onSeek: (ms: number) => void;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [scrubbing, setScrubbing] = React.useState(false);
  const duration = durationMs > 0 ? durationMs : 1;

  const msFromEvent = React.useCallback(
    (clientX: number) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return 0;
      return Math.max(0, Math.min(duration, ((clientX - rect.left) / rect.width) * duration));
    },
    [duration],
  );

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    setScrubbing(true);
    ref.current?.setPointerCapture(e.pointerId);
    onSeek(msFromEvent(e.clientX));
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!scrubbing) return;
    onSeek(msFromEvent(e.clientX));
  }
  function onPointerUp(e: React.PointerEvent) {
    setScrubbing(false);
    ref.current?.releasePointerCapture?.(e.pointerId);
  }

  return (
    <div className="flex">
      <div className="w-[72px] shrink-0" aria-hidden>
        {VIDEO_LABELS.map((label) => (
          <div key={label} className="flex h-6 items-center gap-1.5 pr-2">
            <span className="size-2 rounded-[4px]" style={{ background: labelColor(label, 0) }} />
            <span className="truncate text-xs text-ink-muted">{label}</span>
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div
          ref={ref}
          className={cn(
            "relative select-none border-l border-rule",
            scrubbing ? "cursor-grabbing" : "cursor-pointer",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {VIDEO_LABELS.map((label) => (
            <div key={label} className="relative h-6 border-b border-rule">
              {showReference &&
                reference
                  .filter((s) => s.action_label === label)
                  .map((s) => (
                    <span
                      key={s.id}
                      title={`Reference ${s.action_label} ${formatSeconds(s.start_ms)} to ${formatSeconds(s.end_ms)}`}
                      className="absolute bottom-0.5 h-2.5 rounded-[4px] border border-dashed"
                      style={{
                        left: `${(s.start_ms / duration) * 100}%`,
                        width: `${Math.max(0, ((s.end_ms - s.start_ms) / duration) * 100)}%`,
                        borderColor: labelColor(label, 0),
                        boxShadow: missingRefIds.has(s.id) ? "0 0 0 1.5px var(--rejected-ink)" : undefined,
                      }}
                    />
                  ))}
              {submitted
                .filter((s) => s.action_label === label)
                .map((s) => {
                  const flag = flagMap[s.id];
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => onSeek(s.start_ms)}
                      title={`Submitted ${s.action_label} ${formatSeconds(s.start_ms)} to ${formatSeconds(s.end_ms)}`}
                      className="absolute top-0 h-6"
                      style={{
                        left: `${(s.start_ms / duration) * 100}%`,
                        width: `${Math.max(0, ((s.end_ms - s.start_ms) / duration) * 100)}%`,
                        minWidth: 4,
                      }}
                    >
                      <span
                        className="absolute inset-x-0 top-[7px] h-2.5 rounded-[4px]"
                        style={{
                          background: labelColor(label, 0),
                          boxShadow: flag ? "0 0 0 1.5px var(--rejected-ink)" : undefined,
                        }}
                      />
                    </button>
                  );
                })}
            </div>
          ))}

          <div className="relative h-5 overflow-hidden border-t border-rule">
            {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
              <span
                key={i}
                className="machine absolute top-0 -translate-x-1/2 pt-0.5 text-xs text-ink-muted"
                style={{ left: `${f * 100}%` }}
              >
                {formatTimecode(f * duration, fps).slice(3)}
              </span>
            ))}
          </div>

          <div
            aria-hidden
            className="absolute top-0 bottom-0 z-20 w-px bg-brand"
            style={{ left: `${(Math.min(currentMs, duration) / duration) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
