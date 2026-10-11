"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Pause,
  Play,
  Redo2,
  Save,
  Send,
  SkipBack,
  SkipForward,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { KeyHintList } from "@/components/domain/key-hint";
import { LeaseTimer } from "@/components/domain/lease-timer";
import { RewardAmount } from "@/components/domain/machine";
import { VideoTimeline } from "@/components/workbench/video-timeline";
import { SegmentForm } from "@/components/workbench/segment-form";
import { useLeaseStore } from "@/lib/store/lease";
import { useVideoWorkbench } from "@/lib/store/video-workbench";
import { useSaveDraft, useSubmitTask } from "@/lib/api/hooks";
import { validateSegments } from "@/lib/annotations";
import { ACTION_LABELS, labelColor } from "@/lib/labels";
import { DEFAULT_FPS } from "@/lib/config";
import { formatSeconds, formatTimecode } from "@/lib/timecode";
import { VideoPayload, type AvailableTask, type Segment } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * VideoWorkbench — the video branch of `/work/tasks/[id]`. A player with frame
 * stepping, a dope-sheet timeline (VideoTimeline), and a segment form. The rules
 * of action-segments-v1 are enforced live and block submit with plain words
 * (AGENTS.md A8, DESIGN.md §4.6).
 */
export function VideoWorkbench({ task }: { task: AvailableTask }) {
  const router = useRouter();
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const init = useVideoWorkbench((s) => s.init);
  const segments = useVideoWorkbench((s) => s.segments);
  const dirty = useVideoWorkbench((s) => s.dirty);
  const selectedId = useVideoWorkbench((s) => s.selectedId);
  const select = useVideoWorkbench((s) => s.select);
  const inMs = useVideoWorkbench((s) => s.inMs);
  const outMs = useVideoWorkbench((s) => s.outMs);
  const setIn = useVideoWorkbench((s) => s.setIn);
  const setOut = useVideoWorkbench((s) => s.setOut);
  const undo = useVideoWorkbench((s) => s.undo);
  const redo = useVideoWorkbench((s) => s.redo);
  const canUndo = useVideoWorkbench((s) => s.past.length > 0);
  const canRedo = useVideoWorkbench((s) => s.future.length > 0);
  const markSaved = useVideoWorkbench((s) => s.markSaved);
  const reset = useVideoWorkbench((s) => s.reset);
  const lease = useLeaseStore((s) => s.leases[task.id]);

  const saveDraft = useSaveDraft();
  const submit = useSubmitTask();
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [currentMs, setCurrentMs] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [broken, setBroken] = React.useState(false);

  const fps = task.asset.fps ?? DEFAULT_FPS;
  const durationMs = task.asset.durationMs ?? 12_000;
  const frameMs = 1000 / fps;

  React.useEffect(() => {
    init({
      taskId: task.id,
      segments: [],
      durationMs,
      fps,
      activeLabel: ACTION_LABELS[0],
    });
  }, [task.id, durationMs, fps, init]);

  /* Keep the playhead in step with the video element (an outside system). */
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

  const seek = React.useCallback(
    (ms: number) => {
      const v = videoRef.current;
      const clamped = Math.max(0, Math.min(durationMs, ms));
      setCurrentMs(clamped);
      if (v) v.currentTime = clamped / 1000;
    },
    [durationMs],
  );

  const buildPayload = React.useCallback(
    () => ({
      task_id: task.id,
      asset_id: task.asset.id,
      schema_version: "action-segments-v1" as const,
      segments,
    }),
    [task, segments],
  );

  // Autosave 1.2 s after the last edit, mirroring PUT /draft.
  React.useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      saveDraft.mutate(
        { id: task.id, payload: buildPayload() },
        {
          onSuccess: (r) => {
            markSaved();
            setSavedAt(r.savedAt);
          },
          onError: () =>
            toast.error("Draft not saved", {
              description: "Your changes are still on screen. Try Save draft.",
            }),
        },
      );
    }, 1200);
    return () => clearTimeout(t);
  }, [dirty, segments, task.id, buildPayload, markSaved, saveDraft]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }

  function step(frames: number) {
    seek(currentMs + frames * frameMs);
  }

  function setSpeed(rate: string) {
    const v = videoRef.current;
    if (v) v.playbackRate = Number(rate);
  }

  /* Keyboard-first editing (DESIGN §4.6). Ignore while typing in a control. */
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const control =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNow();
        return;
      }
      if (control) return;

      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const dir = e.key === "ArrowLeft" ? -1 : 1;
        step(e.shiftKey ? dir * 10 : dir);
        return;
      }
      if (e.key.toLowerCase() === "i") {
        setIn(currentMs);
        return;
      }
      if (e.key.toLowerCase() === "o") {
        setOut(currentMs);
        return;
      }
      const n = Number(e.key);
      if (!mod && n >= 1 && n <= 8) {
        const label = ACTION_LABELS[n - 1];
        if (selectedId) useVideoWorkbench.getState().updateSegment(selectedId, { action_label: label });
        else useVideoWorkbench.getState().setActiveLabel(label);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMs, selectedId, undo, redo, setIn, setOut]);

  function saveNow() {
    saveDraft.mutate(
      { id: task.id, payload: buildPayload() },
      {
        onSuccess: (r) => {
          markSaved();
          setSavedAt(r.savedAt);
          toast.success("Draft saved", { description: "You can come back to this task." });
        },
      },
    );
  }

  function submitNow() {
    if (problems.length > 0 || segments.length === 0) {
      toast.error("Segments are not valid yet", { description: problems[0]?.message ?? "Add at least one segment." });
      return;
    }
    const parsed = VideoPayload.safeParse(buildPayload());
    if (!parsed.success) {
      toast.error("Segments are not valid yet", { description: firstIssue(parsed.error.issues) });
      return;
    }
    submit.mutate(
      { id: task.id, payload: parsed.data },
      {
        onSuccess: () => {
          reset();
          toast.success("Labels submitted", {
            description: "A reviewer checks them next. Your work is safe.",
          });
          router.push("/work/earnings");
        },
        onError: (err) => {
          toast.error("Could not submit", {
            description: err instanceof Error ? err.message : "Try again in a moment.",
          });
        },
      },
    );
  }

  const problems = validateSegments(segments, durationMs);
  const problemIds = React.useMemo(() => new Set(problems.map((p) => p.segmentId)), [problems]);
  const canSubmit = problems.length === 0 && segments.length > 0 && !submit.isPending;
  // Only surface validation once there is something on the timeline.
  const showErrors = segments.length > 0 && problems.length > 0;

  const saveLabel = saveDraft.isPending
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : savedAt
        ? `Saved ${new Date(savedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
        : "Saved";

  return (
    <div className="flex flex-col gap-3">
      {/* Focus task bar: back, task, reward, lease, history, save and submit. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[12px] border border-rule bg-sheet px-4 py-2.5">
        <Link
          href="/work/tasks"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to tasks
        </Link>
        <span className="h-5 w-px bg-rule" aria-hidden />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium text-ink">{task.jobTitle}</h1>
          <p className="machine text-xs text-ink-muted">{task.id}</p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-4">
          <RewardAmount amount={task.reward} />
          {lease && <LeaseTimer expiresAt={lease.expiresAt} />}
          <span
            aria-live="polite"
            className={cn(
              "inline-flex items-center gap-1.5 text-xs",
              dirty ? "text-revision-ink" : "text-ink-muted",
            )}
          >
            {!dirty && savedAt && <Check className="size-3.5" aria-hidden />}
            {saveLabel}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!canUndo} aria-label="Undo">
              <Undo2 aria-hidden />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!canRedo} aria-label="Redo">
              <Redo2 aria-hidden />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={saveNow} disabled={saveDraft.isPending}>
            <Save aria-hidden />
            Save draft
          </Button>
          <Button size="sm" onClick={submitNow} disabled={!canSubmit}>
            <Send aria-hidden />
            {submit.isPending ? "Submitting…" : "Submit labels"}
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Stage */}
          <div className="relative flex flex-col overflow-hidden rounded-[12px] bg-stage">
            <div className="grid h-[clamp(300px,52dvh,460px)] place-items-center p-4">
              {broken ? (
                <p className="max-w-[40ch] text-center text-sm text-stage-ink/70">
                  This clip could not be loaded. Signed links expire. Save your draft and reload.
                </p>
              ) : (
                <video
                  ref={videoRef}
                  src={task.asset.url}
                  poster={task.asset.thumbUrl}
                  playsInline
                  preload="metadata"
                  className="max-h-full max-w-full object-contain"
                  onError={() => setBroken(true)}
                />
              )}
            </div>
            {/* Transport */}
            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 px-4 py-2.5 text-stage-ink">
              <button
                type="button"
                onClick={() => step(-1)}
                className="grid size-8 place-items-center rounded-[8px] text-stage-ink/80 hover:bg-white/10 hover:text-stage-ink"
                aria-label="Previous frame"
              >
                <SkipBack className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="grid size-8 place-items-center rounded-[8px] bg-white/10 text-stage-ink hover:bg-white/20"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                className="grid size-8 place-items-center rounded-[8px] text-stage-ink/80 hover:bg-white/10 hover:text-stage-ink"
                aria-label="Next frame"
              >
                <SkipForward className="size-4" aria-hidden />
              </button>
              <span className="machine text-sm tabular-nums" aria-live="off">
                {formatTimecode(currentMs, fps)}
                <span className="text-stage-ink/50"> / {formatTimecode(durationMs, fps)}</span>
              </span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-stage-ink/60">Speed</span>
                <Select defaultValue="1" onValueChange={setSpeed}>
                  <SelectTrigger size="sm" className="w-[84px] border-white/20 bg-stage-raised text-stage-ink">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <Panel>
            <PanelHeader
              title="Timeline"
              description="One track per action. Click a segment to open it."
              actions={
                <span className="text-xs text-ink-muted">
                  Space play, arrows step frames, I and O set in and out
                </span>
              }
            />
            <PanelBody className="pt-3">
              <VideoTimeline
                segments={segments}
                durationMs={durationMs}
                fps={fps}
                currentMs={currentMs}
                selectedId={selectedId}
                inMs={inMs}
                outMs={outMs}
                problemIds={problemIds}
                onSeek={seek}
                onSelect={select}
              />
            </PanelBody>
          </Panel>

          {/* Segment list */}
          <Panel>
            <PanelHeader title="Segments" description={`${segments.length} on the timeline`} />
            <SegmentList
              segments={segments}
              selectedId={selectedId}
              problemIds={problemIds}
              onSelect={(s) => {
                select(s.id);
                seek(s.start_ms);
              }}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <SegmentForm key={selectedId ?? "new"} fps={fps} durationMs={durationMs} />

          <Panel>
            <PanelHeader title="Rubric" />
            <PanelBody className="pt-3">
              <ul className="flex flex-col gap-1.5 text-sm text-ink">
                {task.rubric.map((r) => (
                  <li key={r.id} className="flex gap-2">
                    <span className="mt-1.5 size-1 shrink-0 rounded-[8px] bg-ink-muted" aria-hidden />
                    {r.text}
                  </li>
                ))}
              </ul>
            </PanelBody>
          </Panel>

          {showErrors && (
            <Panel className="border-[var(--rejected-ink)]/40">
              <PanelHeader title="Before you submit" description={`${problems.length} to fix`} />
              <PanelBody className="pt-3">
                <ul className="flex flex-col gap-1.5 text-sm text-ink">
                  {problems.map((p, i) => (
                    <li key={`${p.segmentId}-${i}`} className="flex gap-2">
                      <X className="mt-0.5 size-3.5 shrink-0 text-rejected-ink" aria-hidden />
                      {p.message}
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          )}

          {/* Only the shortcuts this build actually binds. */}
          <KeyHintList
            className="px-1 pb-1"
            hints={[
              { keys: "Space", label: "play or pause" },
              { keys: ["←", "→"], label: "step a frame" },
              { keys: ["⇧", "←"], label: "step 10 frames" },
              { keys: "I", label: "set in" },
              { keys: "O", label: "set out" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function SegmentList({
  segments,
  selectedId,
  problemIds,
  onSelect,
}: {
  segments: Segment[];
  selectedId: string | null;
  problemIds: Set<string>;
  onSelect: (s: Segment) => void;
}) {
  if (segments.length === 0) {
    return (
      <PanelBody className="pt-3">
        <p className="text-sm text-ink-muted">
          No segments yet. Play the clip, set in and out with I and O, then add the first segment.
        </p>
      </PanelBody>
    );
  }
  return (
    <ul className="flex flex-col">
      {segments.map((s, i) => {
        const selected = s.id === selectedId;
        const problem = problemIds.has(s.id);
        const color = labelColor(s.action_label, ACTION_LABELS.indexOf(s.action_label));
        return (
          <li key={s.id} className="border-b border-rule last:border-0">
            <button
              type="button"
              onClick={() => onSelect(s)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                selected ? "bg-brand-tint" : "hover:bg-wash",
              )}
            >
              <span className="w-4 shrink-0 tabular-nums text-ink-muted">{i + 1}</span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-[8px]" style={{ background: color }} aria-hidden />
                <span className="font-medium text-ink">{s.action_label}</span>
              </span>
              <span className="machine text-xs text-ink-muted tabular-nums">
                {formatSeconds(s.start_ms)} to {formatSeconds(s.end_ms)}
              </span>
              <span className="ml-auto flex items-center gap-2">
                {s.outcome === "failure" && (
                  <span className="text-xs text-rejected-ink">failure</span>
                )}
                <span className="tabular-nums text-ink-muted">{s.confidence}/5</span>
                {problem && (
                  <X className="size-3.5 text-rejected-ink" aria-label="Has a problem" />
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function firstIssue(issues: { path: (string | number | symbol)[]; message: string }[]): string {
  const i = issues[0];
  if (!i) return "Check the segments and try again.";
  const where = i.path.length ? `${i.path.join(".")}: ` : "";
  return `${where}${i.message}`;
}
