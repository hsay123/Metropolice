"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Redo2,
  Save,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { LeaseTimer } from "@/components/domain/lease-timer";
import { ErrorState } from "@/components/domain/states";
import { RewardAmount } from "@/components/domain/machine";
import { ImageEditor } from "@/components/workbench/image-editor";
import { VideoWorkbench } from "@/components/workbench/video-workbench";
import { useLeaseStore } from "@/lib/store/lease";
import { useWorkbench } from "@/lib/store/workbench";
import { useSaveDraft, useSubmitTask, useTask } from "@/lib/api/hooks";
import { ImagePayload, type AvailableTask, type Box } from "@/lib/api/types";
import { labelColor, labelInk } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * Workbench — loads a task and shows the right tool for its modality. The image
 * branch is image-boxes-v1; the video branch is the action-segments-v1 dope sheet.
 */
export function Workbench({ taskId }: { taskId: string }) {
  const { data: task, isPending, isError, refetch } = useTask(taskId);

  if (isPending) return <WorkbenchSkeleton />;
  if (isError || !task) {
    return (
      <ErrorState
        title="Task not available"
        message="This task could not be loaded. It may have been claimed or closed. Try again, or return to the queue."
        onRetry={() => refetch()}
      />
    );
  }
  if (task.modality === "video") return <VideoWorkbench task={task} />;
  return <ImageWorkbench task={task} />;
}

function ImageWorkbench({ task }: { task: AvailableTask }) {
  const router = useRouter();
  const init = useWorkbench((s) => s.init);
  const boxes = useWorkbench((s) => s.boxes);
  const dirty = useWorkbench((s) => s.dirty);
  const undo = useWorkbench((s) => s.undo);
  const redo = useWorkbench((s) => s.redo);
  const canUndo = useWorkbench((s) => s.past.length > 0);
  const canRedo = useWorkbench((s) => s.future.length > 0);
  const markSaved = useWorkbench((s) => s.markSaved);
  const reset = useWorkbench((s) => s.reset);
  const lease = useLeaseStore((s) => s.leases[task.id]);

  const saveDraft = useSaveDraft();
  const submit = useSubmitTask();
  const [savedAt, setSavedAt] = React.useState<string | null>(null);

  // Seed the store from the task once. init is a no-op if the task id matches.
  React.useEffect(() => {
    init({
      taskId: task.id,
      boxes: [],
      width: task.asset.width ?? 1280,
      height: task.asset.height ?? 960,
      activeClass: task.classes?.[0] ?? "",
    });
  }, [task, init]);

  const buildPayload = React.useCallback(
    () => ({
      task_id: task.id,
      asset_id: task.asset.id,
      schema_version: "image-boxes-v1" as const,
      boxes,
    }),
    [task, boxes],
  );

  // Autosave 1.2 s after the last edit. Mirrors the server's PUT /draft.
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
          onError: () => {
            toast.error("Draft not saved", {
              description: "Your changes are still on screen. Try Save draft.",
            });
          },
        },
      );
    }, 1200);
    return () => clearTimeout(t);
  }, [dirty, boxes, task.id, buildPayload, markSaved, saveDraft]);

  const errors = validate(boxes, task.classes ?? []);
  const canSubmit = errors.length === 0 && !submit.isPending;
  // Only surface validation once the person has edited something; an empty
  // workbench is an invitation, not an error.
  const showErrors = dirty && errors.length > 0;

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
    const parsed = ImagePayload.safeParse(buildPayload());
    if (!parsed.success) {
      toast.error("Labels are not valid yet", { description: firstIssue(parsed.error.issues) });
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

      <div className="grid min-h-0 gap-4 lg:grid-cols-[1fr_340px]">
        <div className="h-[clamp(420px,calc(100dvh-230px),720px)]">
          <ImageEditor task={task} className="size-full" />
        </div>

        <div className="flex flex-col gap-4">
          <ClassPicker classes={task.classes ?? []} />

          <Panel>
            <PanelHeader
              title="Boxes"
              description={`${boxes.length} drawn`}
              actions={
                <span className="text-xs text-ink-muted">Confidence 1–5</span>
              }
            />
            <BoxList classes={task.classes ?? []} />
          </Panel>

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
              <PanelHeader title="Before you submit" />
              <PanelBody className="pt-3">
                <ul className="flex flex-col gap-1.5 text-sm text-ink">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function ClassPicker({ classes }: { classes: string[] }) {
  const activeClass = useWorkbench((s) => s.activeClass);
  const setActiveClass = useWorkbench((s) => s.setActiveClass);
  return (
    <Panel>
      <PanelHeader
        title="Class to draw"
        description="New boxes use this class. Press 1–9 to switch."
      />
      <PanelBody className="flex flex-wrap gap-1.5 pt-3">
        {classes.map((c, i) => {
          const active = c === activeClass;
          const color = labelColor(c, i);
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActiveClass(c)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[8px] border px-2 py-1 text-sm transition-colors",
                active
                  ? "border-transparent"
                  : "border-field-edge text-ink hover:bg-wash",
              )}
              style={
                active ? { background: color, color: labelInk(c, i) } : undefined
              }
            >
              <span
                className="size-2.5 rounded-[8px]"
                style={{ background: active ? "rgba(255,255,255,.85)" : color }}
                aria-hidden
              />
              {c}
              <span className="ml-0.5 text-xs tabular-nums opacity-70">{i + 1}</span>
            </button>
          );
        })}
      </PanelBody>
    </Panel>
  );
}

function BoxList({ classes }: { classes: string[] }) {
  const boxes = useWorkbench((s) => s.boxes);
  const selectedId = useWorkbench((s) => s.selectedId);
  const select = useWorkbench((s) => s.select);
  const updateBox = useWorkbench((s) => s.updateBox);
  const removeBox = useWorkbench((s) => s.removeBox);

  if (boxes.length === 0) {
    return (
      <PanelBody className="pt-3">
        <p className="text-sm text-ink-muted">
          No boxes yet. Drag on the image to draw the first one.
        </p>
      </PanelBody>
    );
  }

  return (
    <ul className="flex flex-col">
      {boxes.map((box, i) => {
        const selected = box.id === selectedId;
        const color = labelColor(box.class, Math.max(0, classes.indexOf(box.class)));
        return (
          <li key={box.id} className="border-b border-rule last:border-0">
            <button
              type="button"
              onClick={() => select(selected ? null : box.id)}
              className={cn(
                "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors",
                selected ? "bg-brand-tint" : "hover:bg-wash",
              )}
            >
              <span className="size-2.5 shrink-0 rounded-[8px]" style={{ background: color }} aria-hidden />
              <span className="text-ink-muted">Box {i + 1}</span>
              <span className="font-medium text-ink">{box.class}</span>
              <span className="ml-auto tabular-nums text-ink-muted">{box.confidence}/5</span>
              <ChevronDown
                className={cn("size-3.5 text-ink-muted transition-transform", selected && "rotate-180")}
                aria-hidden
              />
            </button>

            {selected && (
              <div className="flex flex-col gap-3 border-t border-rule px-4 py-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-ink-muted" htmlFor={`class-${box.id}`}>
                    Class
                  </label>
                  <Select
                    value={box.class}
                    onValueChange={(v) => updateBox(box.id, { class: v })}
                  >
                    <SelectTrigger id={`class-${box.id}`} size="sm" className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ConfidencePicker
                  value={box.confidence}
                  onChange={(v) => updateBox(box.id, { confidence: v })}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-fit"
                  onClick={() => removeBox(box.id)}
                >
                  <Trash2 aria-hidden />
                  Delete box
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ConfidencePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-muted">Confidence</span>
      <div className="flex gap-1" role="group" aria-label="Box confidence">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={n === value}
            className={cn(
              "grid size-6 place-items-center rounded-[8px] border text-xs tabular-nums transition-colors",
              n === value
                ? "border-brand bg-brand text-white"
                : "border-field-edge text-ink hover:bg-wash",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkbenchSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="h-14 animate-pulse rounded-[12px] border border-rule bg-sheet" />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="h-[560px] animate-pulse rounded-[12px] bg-stage/90" />
        <div className="h-[560px] animate-pulse rounded-[12px] border border-rule bg-sheet" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

function validate(boxes: Box[], classes: string[]): string[] {
  const errors: string[] = [];
  if (boxes.length === 0) errors.push("Draw at least one box before submitting.");
  const validClasses = new Set(classes);
  const badClass = boxes.find((b) => !validClasses.has(b.class));
  if (badClass) {
    errors.push(`Box ${boxes.indexOf(badClass) + 1} uses the class "${badClass.class}", which is not in this job's class list.`);
  }
  return errors;
}

function firstIssue(issues: { path: (string | number | symbol)[]; message: string }[]): string {
  const i = issues[0];
  if (!i) return "Check the labels and try again.";
  const where = i.path.length ? `${i.path.join(".")}: ` : "";
  return `${where}${i.message}`;
}
