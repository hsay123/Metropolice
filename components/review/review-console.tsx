"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, Eye, EyeOff, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { MediaStage, StageButton } from "@/components/domain/media-stage";
import { ConfidenceMeter } from "@/components/domain/confidence-meter";
import { DecisionSource } from "@/components/domain/decision-source";
import { ErrorState } from "@/components/domain/states";
import { BoxOverlay } from "@/components/workbench/box-overlay";
import { VideoReviewStage } from "@/components/review/video-review";
import { useDecide, useReview } from "@/lib/api/hooks";
import { compareBoxes, compareSegments } from "@/lib/annotations";
import { explainReason, REASON_CODE_LABELS, REASON_CODE_LIST } from "@/lib/reasonCodes";
import { formatDateTime } from "@/lib/dates";
import { formatSeconds } from "@/lib/timecode";
import { DEFAULT_FPS } from "@/lib/config";
import { fitContain, useElementSize } from "@/lib/hooks/useElementSize";
import type { ImagePayload, ReviewItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type Decision = "accept" | "revise" | "reject";

/**
 * ReviewConsole — submitted labels beside reference labels with mismatches
 * highlighted, the AI suggestion with a confidence meter, the rubric checklist,
 * and three clear decisions. A reason code is required unless accepting
 * (AGENTS.md A2, A5).
 */
export function ReviewConsole({ submissionId }: { submissionId: string }) {
  const { data, isPending, isError, refetch } = useReview(submissionId);

  if (isPending) return <ConsoleSkeleton />;
  if (isError || !data) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="sr-only">Review submission</h1>
        <ErrorState
          title="Submission not available"
          message="This submission is not in the queue. It may have been decided already. Return to the queue to pick another."
          onRetry={() => refetch()}
        />
      </div>
    );
  }
  return <Console item={data} />;
}

function Console({ item }: { item: ReviewItem }) {
  const router = useRouter();
  const decide = useDecide();
  const [showReference, setShowReference] = React.useState(true);
  const [reasonCode, setReasonCode] = React.useState<string>("");
  const [note, setNote] = React.useState("");
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(item.checklist.map((c) => [c.id, c.passed ?? false])),
  );
  const [error, setError] = React.useState<string | null>(null);

  const isImage = item.submission.payload.schema_version === "image-boxes-v1";
  const isVideo = item.submission.payload.schema_version === "action-segments-v1";
  const payload = item.submission.payload;
  // The reference label may arrive on the review item or on the submission; the
  // mock seed uses the latter. Read either so the comparison always runs.
  const referencePayload = item.reference ?? item.submission.reference;
  const submittedBoxes = React.useMemo(
    () => (payload.schema_version === "image-boxes-v1" ? payload.boxes : []),
    [payload],
  );
  const referenceBoxes = React.useMemo(
    () =>
      referencePayload?.schema_version === "image-boxes-v1" ? referencePayload.boxes : [],
    [referencePayload],
  );
  const submittedSegments = React.useMemo(
    () => (payload.schema_version === "action-segments-v1" ? payload.segments : []),
    [payload],
  );
  const referenceSegments = React.useMemo(
    () =>
      referencePayload?.schema_version === "action-segments-v1" ? referencePayload.segments : [],
    [referencePayload],
  );

  const comparison = React.useMemo(() => {
    if (!isImage || referenceBoxes.length === 0) return null;
    return compareBoxes(submittedBoxes, referenceBoxes);
  }, [isImage, submittedBoxes, referenceBoxes]);

  const segmentComparison = React.useMemo(() => {
    if (!isVideo || referenceSegments.length === 0) return null;
    return compareSegments(submittedSegments, referenceSegments);
  }, [isVideo, submittedSegments, referenceSegments]);

  function submit(decision: Decision) {
    if (decision !== "accept" && !reasonCode) {
      setError(
        decision === "revise"
          ? "Pick a reason code so the contributor knows what to fix."
          : "Pick a reason code so the contributor knows why the work was rejected.",
      );
      return;
    }
    setError(null);
    decide.mutate(
      {
        submissionId: item.submission.id,
        decision,
        reasonCode: decision === "accept" ? undefined : reasonCode,
        note: note.trim() || undefined,
        checklist,
      },
      {
        onSuccess: () => {
          const verb =
            decision === "accept"
              ? "Labels accepted"
              : decision === "revise"
                ? "Revision requested"
                : "Labels rejected";
          toast.success(verb, {
            description:
              decision === "accept"
                ? "The contributor can claim the reward."
                : "The contributor sees your reason in plain words.",
          });
          router.push("/review");
        },
        onError: (err) => {
          toast.error("Could not save the decision", {
            description: err instanceof Error ? err.message : "Try again in a moment.",
          });
        },
      },
    );
  }

  const imgW = item.asset.width ?? 1280;
  const imgH = item.asset.height ?? 960;
  const classes = [...new Set([...submittedBoxes, ...referenceBoxes].map((b) => b.class))];

  const flagById: Record<string, "extra" | "wrong"> = {};
  if (comparison) {
    for (const b of comparison.submittedOnly) flagById[b.id] = "extra";
    for (const m of comparison.wrongClass) flagById[m.submitted.id] = "wrong";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[12px] border border-rule bg-sheet px-4 py-2.5">
        <Link
          href="/review"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to queue
        </Link>
        <span className="h-5 w-px bg-rule" aria-hidden />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium text-ink">{item.submission.jobTitle}</h1>
          <p className="flex flex-wrap items-center gap-x-2 machine text-xs text-ink-muted">
            <span>{item.submission.taskId}</span>
            <span>v{item.submission.version}</span>
            <span>{item.submission.contributorId}</span>
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {item.submission.isGold && (
            <span className="rounded-[8px] border border-[var(--revision-ink)]/40 bg-revision-bg px-1.5 py-0.5 text-xs text-revision-ink">
              Gold task
            </span>
          )}
          {item.submission.isOverlapSample && (
            <span className="rounded-[8px] border border-field-edge px-1.5 py-0.5 text-xs text-ink-muted">
              Overlap sample
            </span>
          )}
          <span className="text-xs text-ink-muted">
            Submitted {formatDateTime(item.submission.submittedAt)}
          </span>
        </div>
      </div>

      <div className="grid min-h-0 gap-4 lg:grid-cols-[1fr_360px]">
        {isVideo ? (
          <VideoReviewStage
            url={item.asset.url}
            poster={item.asset.thumbUrl}
            alt={`${item.submission.jobTitle} submitted segments`}
            fps={item.asset.fps ?? DEFAULT_FPS}
            durationMs={item.asset.durationMs ?? 12_000}
            submitted={submittedSegments}
            reference={referenceSegments}
            showReference={showReference}
            onToggleReference={() => setShowReference((v) => !v)}
            comparison={segmentComparison}
          />
        ) : (
          <ReviewStage
            url={item.asset.url}
            alt={`${item.submission.jobTitle} submitted labels`}
            imgW={imgW}
            imgH={imgH}
            classes={classes}
            submittedBoxes={submittedBoxes}
            referenceBoxes={referenceBoxes}
            showReference={showReference}
            onToggleReference={() => setShowReference((v) => !v)}
            flagById={flagById}
            hasComparison={Boolean(comparison)}
          />
        )}

        <div className="flex min-w-0 flex-col gap-4 overflow-y-auto">
          {item.ai && (
            <Panel>
              <PanelHeader title="AI suggestion" actions={<DecisionSource source="ai" />} />
              <PanelBody className="flex flex-col gap-3 pt-3">
                <p className="flex flex-wrap items-center gap-x-2 text-sm text-ink">
                  <span className="font-medium capitalize">{item.ai.decision}</span>
                  {item.ai.reasonCode && (
                    <span className="text-ink-muted">
                      {REASON_CODE_LABELS[item.ai.reasonCode as keyof typeof REASON_CODE_LABELS] ??
                        item.ai.reasonCode}
                    </span>
                  )}
                </p>
                {item.ai.note && <p className="text-sm text-ink-muted">{item.ai.note}</p>}
                <ConfidenceMeter confidence={item.ai.confidence} />
              </PanelBody>
            </Panel>
          )}

          {isVideo ? (
            <Panel>
              <PanelHeader
                title="Submitted vs reference"
                description="Compared by time overlap and action label."
              />
              <PanelBody className="flex flex-col gap-2 pt-3">
                {segmentComparison ? (
                  <>
                    <CompareRow
                      tone="ok"
                      label={`${segmentComparison.matches.length} ${
                        segmentComparison.matches.length === 1 ? "segment matches" : "segments match"
                      } the reference`}
                    />
                    {segmentComparison.labelMismatch.map((m) => (
                      <CompareRow
                        key={m.submitted.id}
                        tone="bad"
                        label={`Segment "${m.submitted.action_label}" (${formatSeconds(m.submitted.start_ms)} to ${formatSeconds(m.submitted.end_ms)}) should be "${m.reference.action_label}"`}
                      />
                    ))}
                    {segmentComparison.submittedOnly.map((s) => (
                      <CompareRow
                        key={s.id}
                        tone="bad"
                        label={`Extra segment "${s.action_label}" ${formatSeconds(s.start_ms)} to ${formatSeconds(s.end_ms)} with no reference match`}
                      />
                    ))}
                    {segmentComparison.referenceOnly.map((r) => (
                      <CompareRow
                        key={r.id}
                        tone="warn"
                        label={`Missing segment "${r.action_label}" ${formatSeconds(r.start_ms)} to ${formatSeconds(r.end_ms)}`}
                      />
                    ))}
                    {segmentComparison.matches
                      .filter((m) => m.worstDeltaMs >= 250)
                      .map((m) => (
                        <CompareRow
                          key={m.submitted.id}
                          tone="warn"
                          label={`Times for "${m.submitted.action_label}" differ by ${formatSeconds(m.worstDeltaMs)}`}
                        />
                      ))}
                    {segmentComparison.labelMismatch.length === 0 &&
                      segmentComparison.submittedOnly.length === 0 &&
                      segmentComparison.referenceOnly.length === 0 &&
                      segmentComparison.matches.every((m) => m.worstDeltaMs < 250) && (
                        <p className="text-sm text-ink-muted">
                          Everything lines up. Still check the rubric.
                        </p>
                      )}
                  </>
                ) : (
                  <p className="text-sm text-ink-muted">
                    No reference label for this task, so there is nothing to compare against. Use
                    the rubric.
                  </p>
                )}
              </PanelBody>
            </Panel>
          ) : comparison ? (
            <Panel>
              <PanelHeader
                title="Submitted vs reference"
                description="Compared by overlap and class."
              />
              <PanelBody className="flex flex-col gap-2 pt-3">
                <CompareRow
                  tone="ok"
                  label={`${comparison.matches.length} ${
                    comparison.matches.length === 1 ? "box matches" : "boxes match"
                  } the reference`}
                />
                {comparison.wrongClass.map((m) => (
                  <CompareRow
                    key={m.submitted.id}
                    tone="bad"
                    label={`Box "${m.submitted.class}" overlaps a reference "${m.reference.class}"`}
                  />
                ))}
                {comparison.submittedOnly.map((b) => (
                  <CompareRow key={b.id} tone="bad" label={`Extra box "${b.class}" with no reference match`} />
                ))}
                {comparison.referenceOnly.map((b) => (
                  <CompareRow key={b.id} tone="warn" label={`Missing box for reference "${b.class}"`} />
                ))}
                {comparison.wrongClass.length === 0 &&
                  comparison.submittedOnly.length === 0 &&
                  comparison.referenceOnly.length === 0 && (
                    <p className="text-sm text-ink-muted">Everything lines up. Still check the rubric.</p>
                  )}
              </PanelBody>
            </Panel>
          ) : (
            <Panel>
              <PanelHeader title="Submitted vs reference" />
              <PanelBody className="pt-3">
                <p className="text-sm text-ink-muted">
                  No reference label for this task, so there is nothing to compare against. Use the
                  rubric.
                </p>
              </PanelBody>
            </Panel>
          )}

          <Panel>
            <PanelHeader title="Rubric checklist" />
            <PanelBody className="flex flex-col gap-2 pt-3">
              {item.checklist.map((c) => (
                <Label
                  key={c.id}
                  htmlFor={`check-${c.id}`}
                  className="flex cursor-pointer items-center gap-2 text-sm font-normal"
                >
                  <Checkbox
                    id={`check-${c.id}`}
                    checked={checklist[c.id]}
                    onCheckedChange={(v) => setChecklist((s) => ({ ...s, [c.id]: v === true }))}
                  />
                  {c.label}
                </Label>
              ))}
              {item.checklist.length === 0 && (
                <p className="text-sm text-ink-muted">No checklist for this task. Use the rubric.</p>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Decision" description="A reason code is required unless you accept." />
            <PanelBody className="flex flex-col gap-3 pt-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reason" className="text-xs text-ink-muted">
                  Reason code
                </Label>
                <Select value={reasonCode} onValueChange={setReasonCode}>
                  <SelectTrigger id="reason" className="w-full">
                    <SelectValue placeholder="Pick a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_CODE_LIST.map((code) => (
                      <SelectItem key={code} value={code}>
                        {REASON_CODE_LABELS[code]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {reasonCode && <p className="text-xs text-ink-muted">{explainReason(reasonCode)}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="note" className="text-xs text-ink-muted">
                  Note to contributor (optional)
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a short, specific note."
                  rows={3}
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-rejected-ink">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-2 border-t border-rule pt-3">
                <Button onClick={() => submit("accept")} disabled={decide.isPending}>
                  <Check aria-hidden />
                  Accept labels
                </Button>
                <Button variant="outline" onClick={() => submit("revise")} disabled={decide.isPending}>
                  Request revision
                </Button>
                <Button variant="destructive" onClick={() => submit("reject")} disabled={decide.isPending}>
                  <X aria-hidden />
                  Reject labels
                </Button>
              </div>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/**
 * The stage fits the media with object-contain and places the annotation overlay
 * over the rendered media, so boxes always line up regardless of letterboxing.
 */
function ReviewStage({
  url,
  alt,
  imgW,
  imgH,
  classes,
  submittedBoxes,
  referenceBoxes,
  showReference,
  onToggleReference,
  flagById,
  hasComparison,
}: {
  url: string;
  alt: string;
  imgW: number;
  imgH: number;
  classes: string[];
  submittedBoxes: ImagePayload["boxes"];
  referenceBoxes: ImagePayload["boxes"];
  showReference: boolean;
  onToggleReference: () => void;
  flagById: Record<string, "extra" | "wrong">;
  hasComparison: boolean;
}) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const fit = fitContain(size.width, size.height, imgW, imgH);
  return (
    <MediaStage
      className="h-[clamp(420px,calc(100dvh-240px),720px)]"
      toolbar={
        <>
          <span className="flex items-center gap-3 text-xs text-stage-ink/70">
            <span>{submittedBoxes.length} submitted</span>
            <span>{referenceBoxes.length} reference</span>
          </span>
          {hasComparison && (
            <StageButton className="ml-auto" onClick={onToggleReference} aria-pressed={showReference}>
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
      <div ref={ref} className="relative size-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          className="pointer-events-none absolute inset-0 size-full object-contain"
        />
        <div
          className="absolute"
          style={{ left: fit.x, top: fit.y, width: fit.width, height: fit.height }}
        >
          {showReference && referenceBoxes.length > 0 && (
            <BoxOverlay
              boxes={referenceBoxes}
              imageWidth={imgW}
              imageHeight={imgH}
              classes={classes}
              reference
            />
          )}
          <BoxOverlay
            boxes={submittedBoxes}
            imageWidth={imgW}
            imageHeight={imgH}
            classes={classes}
            flagById={flagById}
          />
        </div>
      </div>
    </MediaStage>
  );
}

function CompareRow({ tone, label }: { tone: "ok" | "bad" | "warn"; label: string }) {
  const Icon = tone === "ok" ? Check : tone === "bad" ? X : Sparkles;
  return (
    <p
      className={cn(
        "flex items-start gap-2 text-sm",
        tone === "ok" ? "text-ink" : tone === "bad" ? "text-rejected-ink" : "text-revision-ink",
      )}
    >
      <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {label}
    </p>
  );
}

function ConsoleSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <h1 className="sr-only">Review submission</h1>
      <div className="h-14 animate-pulse rounded-[12px] border border-rule bg-sheet" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="h-[560px] animate-pulse rounded-[12px] bg-stage/90" />
        <div className="h-[560px] animate-pulse rounded-[12px] border border-rule bg-sheet" />
      </div>
    </div>
  );
}
