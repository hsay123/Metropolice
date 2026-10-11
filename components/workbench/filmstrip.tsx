"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Filmstrip — real frames pulled from the clip at even intervals, 72x56, radius 8
 * (docs/MOODBOARD-SPEC.md §3). The active thumb carries a 2px violet ring and a
 * violet-tinted background; clicking one seeks the playhead.
 *
 * Frames are decoded from the clip onto an offscreen canvas. When the clip cannot
 * be decoded (no codec in the browser, an expired signed link) the strip falls back
 * to plain time markers on the dark stage — never a repeated poster pretending to
 * be ten different frames.
 */

const COUNT = 10;

export function Filmstrip({
  src,
  durationMs,
  currentMs,
  onSeek,
}: {
  src: string;
  durationMs: number;
  currentMs: number;
  onSeek: (ms: number) => void;
}) {
  const [frames, setFrames] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.preload = "auto";
    const canvas = document.createElement("canvas");
    canvas.width = 144;
    canvas.height = 112;

    const seek = (t: number) =>
      new Promise<void>((resolve, reject) => {
        const done = () => {
          video.removeEventListener("seeked", done);
          resolve();
        };
        video.addEventListener("seeked", done);
        video.currentTime = t;
        window.setTimeout(() => reject(new Error("seek timeout")), 4000);
      });

    (async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => reject(new Error("load failed"));
          video.load();
        });
        const total = Number.isFinite(video.duration) && video.duration > 0
          ? video.duration * 1000
          : durationMs;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        const out: string[] = [];
        for (let i = 0; i < COUNT; i += 1) {
          if (cancelled) return;
          await seek((total * (i + 0.5)) / COUNT / 1000);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          out.push(canvas.toDataURL("image/jpeg", 0.6));
        }
        if (!cancelled) setFrames(out);
      } catch {
        if (!cancelled) setFrames([]);
      }
    })();

    return () => {
      cancelled = true;
      video.removeAttribute("src");
      video.load();
    };
  }, [src, durationMs]);

  const times = Array.from({ length: COUNT }, (_, i) => (durationMs * (i + 0.5)) / COUNT);
  const activeIndex = times.findIndex((t, i) => {
    const next = times[i + 1] ?? durationMs;
    return currentMs >= t && currentMs < next;
  });

  return (
    <div
      aria-label="Clip frames"
      className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {times.map((t, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={t}
            type="button"
            data-ui="thumb-row"
            onClick={() => onSeek(t)}
            aria-label={`Go to ${(t / 1000).toFixed(1)} seconds`}
            aria-pressed={active}
            className={cn(
              "relative h-[56px] w-[72px] shrink-0 overflow-hidden rounded-[8px] transition-colors",
              active
                ? "bg-[var(--primary-tint)] ring-2 ring-[var(--primary)] ring-offset-1"
                : "bg-[var(--dark-surface)] hover:ring-1 hover:ring-[var(--dark-border)]",
            )}
          >
            {frames?.[i] ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={frames[i]} alt="" className="size-full object-cover" />
            ) : (
              <span className="grid size-full place-items-center text-[10px] tabular-nums text-[var(--dark-muted)]">
                {(t / 1000).toFixed(1)}s
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
