"use client";

import * as React from "react";
import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { useVideoWorkbench } from "@/lib/store/video-workbench";
import { ACTION_LABELS, OUTCOME_OPTIONS, labelColor } from "@/lib/labels";
import { formatSeconds, formatTimecode, parseTimecode } from "@/lib/timecode";
import type { ActionLabel, Outcome } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * SegmentForm — the composer and editor for one action-segments-v1 segment. In
 * "new" mode it reads the in/out markers and active label from the store (set
 * with I, O and 1–8); in "edit" mode it edits the selected segment. Rules are
 * enforced in plain words before a segment is added or saved (AGENTS.md A3/A8).
 *
 * The form is remounted (via `key` at the call site) whenever the selection
 * changes, so local field state never needs an effect to stay in step.
 */

type Draft = {
  object: string;
  outcome: Outcome;
  failureReason: string;
  confidence: number;
};

export function SegmentForm({
  fps,
  durationMs,
  className,
}: {
  fps: number;
  durationMs: number;
  className?: string;
}) {
  const segments = useVideoWorkbench((s) => s.segments);
  const selectedId = useVideoWorkbench((s) => s.selectedId);
  const activeLabel = useVideoWorkbench((s) => s.activeLabel);
  const setActiveLabel = useVideoWorkbench((s) => s.setActiveLabel);
  const inMs = useVideoWorkbench((s) => s.inMs);
  const outMs = useVideoWorkbench((s) => s.outMs);
  const select = useVideoWorkbench((s) => s.select);
  const addSegment = useVideoWorkbench((s) => s.addSegment);
  const updateSegment = useVideoWorkbench((s) => s.updateSegment);
  const removeSegment = useVideoWorkbench((s) => s.removeSegment);

  const selected = React.useMemo(
    () => segments.find((s) => s.id === selectedId) ?? null,
    [segments, selectedId],
  );
  const editing = selected !== null;

  const [draft, setDraft] = React.useState<Draft>(() =>
    selected
      ? {
          object: selected.object,
          outcome: selected.outcome,
          failureReason: selected.failure_reason ?? "",
          confidence: selected.confidence,
        }
      : { object: "", outcome: "success", failureReason: "", confidence: 3 },
  );
  const [editStart, setEditStart] = React.useState(() =>
    selected ? formatTimecode(selected.start_ms, fps) : "",
  );
  const [editEnd, setEditEnd] = React.useState(() =>
    selected ? formatTimecode(selected.end_ms, fps) : "",
  );
  const [error, setError] = React.useState<string | null>(null);

  const label = editing ? selected.action_label : activeLabel;
  const startMs = editing ? selected.start_ms : Math.min(inMs, outMs);
  const endMs = editing ? selected.end_ms : Math.max(inMs, outMs);

  function onPickLabel(next: ActionLabel) {
    if (editing) updateSegment(selected.id, { action_label: next });
    else setActiveLabel(next);
  }

  function setOutcome(outcome: Outcome) {
    setDraft((d) => ({
      ...d,
      outcome,
      // keep a reason only while it is needed
      failureReason: outcome === "failure" ? d.failureReason : "",
    }));
  }

  function validateLocal(): string | null {
    if (endMs <= startMs) {
      return `The end (${formatSeconds(endMs)}) must come after the start (${formatSeconds(startMs)}).`;
    }
    if (endMs > durationMs) {
      return `The clip ends at ${formatSeconds(durationMs)}. Move the end inside it.`;
    }
    if (!draft.object.trim()) return "Name the object the action works on.";
    if (draft.outcome === "failure" && !draft.failureReason.trim()) {
      return "A failure needs a short reason, for example “pen slipped”.";
    }
    return null;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateLocal();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    if (editing) {
      const start = parseTimecode(editStart, fps);
      const end = parseTimecode(editEnd, fps);
      if (start === null || end === null) {
        setError("Times must be plain seconds (4.5) or timecode (00:00:04:12).");
        return;
      }
      updateSegment(selected.id, {
        action_label: label,
        start_ms: Math.round(start),
        end_ms: Math.round(end),
        object: draft.object.trim(),
        outcome: draft.outcome,
        failure_reason: draft.outcome === "failure" ? draft.failureReason.trim() : undefined,
        confidence: draft.confidence,
      });
    } else {
      addSegment({
        id: `seg_${Math.random().toString(36).slice(2, 9)}`,
        start_ms: Math.round(startMs),
        end_ms: Math.round(endMs),
        action_label: label,
        object: draft.object.trim(),
        outcome: draft.outcome,
        failure_reason: draft.outcome === "failure" ? draft.failureReason.trim() : undefined,
        confidence: draft.confidence,
      });
      // Stay in "new" mode so the next segment can be added straight away; the
      // added segment is selected in the store, so clear that here.
      select(null);
      // Clear the per-segment fields; keep the label and markers for the next one.
      setDraft((d) => ({ ...d, object: "", failureReason: "", outcome: "success" }));
    }
  }

  return (
    <Panel className={className}>
      <PanelHeader
        title={editing ? "Edit segment" : "New segment"}
        description={
          editing
            ? `Segment #${segments.findIndex((s) => s.id === selected.id) + 1}`
            : "Set in and out with the video, then fill this in."
        }
        actions={
          editing ? (
            <button
              type="button"
              onClick={() => select(null)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Deselect
            </button>
          ) : null
        }
      />
      <PanelBody className="pt-3">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <LabelPicker value={label} onPick={onPickLabel} />

          <div className="grid grid-cols-2 gap-3">
            {editing ? (
              <>
                <TimeField
                  id="seg-in"
                  label="In"
                  value={editStart}
                  onChange={setEditStart}
                  hint={formatSeconds(selected.start_ms)}
                />
                <TimeField
                  id="seg-out"
                  label="Out"
                  value={editEnd}
                  onChange={setEditEnd}
                  hint={formatSeconds(selected.end_ms)}
                />
              </>
            ) : (
              <>
                <MarkerField
                  label="In"
                  value={formatTimecode(startMs, fps)}
                  hint={formatSeconds(startMs)}
                />
                <MarkerField
                  label="Out"
                  value={formatTimecode(endMs, fps)}
                  hint={formatSeconds(endMs)}
                />
              </>
            )}
          </div>

          {!editing && (
            <p className="text-xs text-ink-muted">
              Press I and O while the video plays to set in and out.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="seg-object" className="text-xs text-ink-muted">
              Object
            </Label>
            <Input
              id="seg-object"
              value={draft.object}
              onChange={(e) => setDraft((d) => ({ ...d, object: e.target.value }))}
              placeholder="For example, pen"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-ink-muted">Outcome</span>
            <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Outcome">
              {OUTCOME_OPTIONS.map((o) => {
                const active = draft.outcome === o;
                return (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setOutcome(o)}
                    className={cn(
                      "rounded-[2px] border px-2 py-1.5 text-sm capitalize transition-colors",
                      active
                        ? "border-brand bg-brand-tint text-ink"
                        : "border-field-edge text-ink hover:bg-wash",
                    )}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>

          {draft.outcome === "failure" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="seg-reason" className="text-xs text-ink-muted">
                Failure reason
              </Label>
              <Input
                id="seg-reason"
                value={draft.failureReason}
                onChange={(e) => setDraft((d) => ({ ...d, failureReason: e.target.value }))}
                placeholder="For example, pen slipped"
                autoComplete="off"
              />
            </div>
          )}

          <ConfidenceField
            value={draft.confidence}
            onChange={(v) => setDraft((d) => ({ ...d, confidence: v }))}
          />

          {error && (
            <p role="alert" className="text-sm text-rejected-ink">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" className="flex-1">
              {editing ? (
                <>
                  <Check aria-hidden />
                  Save changes
                </>
              ) : (
                "Add segment"
              )}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  removeSegment(selected.id);
                  select(null);
                }}
              >
                <Trash2 aria-hidden />
                Delete
              </Button>
            )}
          </div>
        </form>
      </PanelBody>
    </Panel>
  );
}

function LabelPicker({
  value,
  onPick,
}: {
  value: ActionLabel;
  onPick: (label: ActionLabel) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-ink-muted">Action</span>
      <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Action label">
        {ACTION_LABELS.map((l, i) => {
          const active = value === l;
          const color = labelColor(l, i);
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPick(l)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-[2px] border px-2 py-1.5 text-left text-xs transition-colors",
                active
                  ? "border-brand bg-brand-tint text-ink"
                  : "border-field-edge text-ink-muted hover:bg-wash",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px]" style={{ background: color }} aria-hidden />
                <span className={cn(active && "font-medium text-ink")}>{l}</span>
              </span>
              <span className="tabular-nums text-ink-muted/70">{i + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-ink-muted">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="machine"
        autoComplete="off"
      />
      <span className="text-xs text-ink-muted">{hint}</span>
    </div>
  );
}

function MarkerField({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-ink-muted">{label}</span>
      <div className="rounded-[2px] border border-rule bg-wash px-2.5 py-2">
        <span className="machine text-sm text-ink">{value}</span>
      </div>
      <span className="text-xs text-ink-muted">{hint}</span>
    </div>
  );
}

function ConfidenceField({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-ink-muted">Confidence</span>
      <div className="flex gap-1" role="group" aria-label="Segment confidence">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={n === value}
            className={cn(
              "grid size-7 place-items-center rounded-[2px] border text-xs tabular-nums transition-colors",
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
