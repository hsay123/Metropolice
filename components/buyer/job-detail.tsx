"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileCheck2,
  ImageIcon,
  ShieldCheck,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/domain/page-header";
import { Panel, PanelBody, PanelHeader, DetailRow } from "@/components/domain/panel";
import { Stat, StatGrid } from "@/components/domain/stat";
import { BudgetBar } from "@/components/domain/budget-bar";
import { ReviewMix } from "@/components/domain/review-mix";
import { JobStatusPill } from "@/components/domain/status";
import { HashChip } from "@/components/domain/machine";
import { ChainFeed } from "@/components/domain/chain-feed";
import { ErrorState } from "@/components/domain/states";
import {
  useAuditSample,
  useChainEvents,
  useExportJob,
  useJob,
  useJobStats,
} from "@/lib/api/hooks";
import { formatAmount } from "@/lib/format";
import { formatDateTime } from "@/lib/dates";
import { MIN_SAMPLE_FOR_RATE } from "@/lib/config";
import type { ExportManifest } from "@/lib/api/types";

/**
 * /buyer/jobs/[id] — one job: progress, funding, the audit sample with its VRF
 * seed, and the accepted-only export with a manifest (AGENTS.md A5).
 */
export function JobDetail({ jobId }: { jobId: string }) {
  const job = useJob(jobId);
  const stats = useJobStats(jobId);
  const audit = useAuditSample(jobId);
  const chain = useChainEvents(jobId);
  const exportJob = useExportJob();

  const [manifest, setManifest] = React.useState<ExportManifest | null>(null);

  function runExport() {
    exportJob.mutate(jobId, {
      onSuccess: (data) => setManifest(data),
      onError: (err) =>
        toast.error("Could not prepare the export", {
          description: err instanceof Error ? err.message : "Try again in a moment.",
        }),
    });
  }

  function download() {
    if (!manifest) return;
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${manifest.jobId}-accepted-manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Manifest downloaded", {
      description: "It lists hashes and pseudonymous ids. Raw media is never included.",
    });
  }

  if (job.isError) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <ErrorState
          title="Job not found"
          message="We could not load this job. It may have been removed. Go back to the dashboard."
          onRetry={() => job.refetch()}
        />
      </div>
    );
  }

  const data = job.data;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <PageHeader
        context={
          data ? (
            <span className="flex items-center gap-2">
              {data.modality === "image" ? (
                <ImageIcon className="size-3.5" aria-hidden />
              ) : (
                <Video className="size-3.5" aria-hidden />
              )}
              {data.modality === "video" ? "Video job" : "Image job"}
            </span>
          ) : null
        }
        title={data?.title ?? "Job detail"}
        description="Progress, funding, the audit sample and the accepted-only export."
        actions={
          <div className="flex items-center gap-2">
            {data && <JobStatusPill status={data.status} />}
            <Button onClick={runExport} disabled={exportJob.isPending}>
              <FileCheck2 aria-hidden />
              {exportJob.isPending ? "Preparing…" : "Export accepted work"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title="Progress" description="Every accepted task is one paid label." />
            <PanelBody>
              {stats.isPending ? (
                <div className="h-20 animate-pulse rounded-[8px] bg-wash" aria-busy />
              ) : stats.isError || !stats.data ? (
                <ErrorState
                  message="We could not load the job progress. Try again."
                  onRetry={() => stats.refetch()}
                />
              ) : (
                <StatGrid>
                  <Stat
                    label="Accepted"
                    value={stats.data.tasksAccepted.toLocaleString("en-US")}
                    hint={`of ${stats.data.tasksTotal.toLocaleString("en-US")} tasks`}
                  />
                  <Stat label="In review" value={stats.data.inReview.toLocaleString("en-US")} />
                  <Stat
                    label="Needs revision"
                    value={stats.data.tasksNeedsRevision.toLocaleString("en-US")}
                  />
                  <Stat label="Rejected" value={stats.data.tasksRejected.toLocaleString("en-US")} />
                  <Stat
                    label="Acceptance rate"
                    value={
                      stats.data.tasksAccepted >= MIN_SAMPLE_FOR_RATE
                        ? `${Math.round(stats.data.acceptanceRate * 100)}%`
                        : "Not enough data yet"
                    }
                    hint={
                      stats.data.tasksAccepted >= MIN_SAMPLE_FOR_RATE
                        ? "Accepted of decided"
                        : `Needs ${MIN_SAMPLE_FOR_RATE} accepted`
                    }
                  />
                </StatGrid>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="How work was reviewed"
              description="AI-suggested, human-reviewed and adjudicated labels."
            />
            <PanelBody>
              {stats.data ? (
                <ReviewMix
                  ai={stats.data.aiReviewed}
                  human={stats.data.humanReviewed}
                  adjudicated={stats.data.adjudicated}
                />
              ) : (
                <div className="h-16 animate-pulse rounded-[8px] bg-wash" aria-busy />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Audit sample"
              description="A random sample of accepted tasks is re-checked. The seed is public."
            />
            <PanelBody className="flex flex-col gap-4">
              {audit.isPending ? (
                <div className="h-24 animate-pulse rounded-[8px] bg-wash" aria-busy />
              ) : audit.isError || !audit.data ? (
                <p className="text-sm text-ink-muted">No audit sample has been drawn for this job yet.</p>
              ) : (
                <>
                  <div className="flex flex-col">
                    <DetailRow label="VRF request">
                      <HashChip value={audit.data.vrfRequestId} label="VRF request" />
                    </DetailRow>
                    <DetailRow label="Seed">
                      <HashChip value={audit.data.seed} label="Audit seed" />
                    </DetailRow>
                    <DetailRow label="Drawn">
                      {formatDateTime(audit.data.createdAt)}
                    </DetailRow>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">
                      Selected tasks ({audit.data.selectedTaskIds.length})
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {audit.data.selectedTaskIds.map((id) => (
                        <li key={id}>
                          <span className="machine rounded-[8px] bg-wash px-1.5 py-0.5 text-xs text-ink">
                            {id}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="flex items-start gap-2 text-xs text-ink-muted">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    The seed is published before the draw, so anyone can replay it and confirm the
                    same tasks were picked.
                  </p>
                </>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Activity" description="Every event links to its transaction." />
            <PanelBody>
              {chain.isPending ? (
                <div className="h-24 animate-pulse rounded-[8px] bg-wash" aria-busy />
              ) : chain.isError || !chain.data ? (
                <p className="text-sm text-ink-muted">We could not load on-chain activity.</p>
              ) : (
                <ChainFeed events={chain.data} />
              )}
            </PanelBody>
          </Panel>
        </div>

        <div className="self-start lg:sticky lg:top-[72px]">
          <Panel>
            <PanelHeader title="Funding" description="Funds sit in escrow on Monad testnet." />
            <PanelBody className="flex flex-col gap-4">
              {data ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-ink-muted">Reward per task</span>
                    <span className="font-display text-base font-semibold tabular-nums text-ink">
                      {formatAmount(data.rewardPerTask)}
                    </span>
                  </div>
                  <BudgetBar spent={data.spent} budget={data.budget} />
                  <div className="flex flex-col border-t border-rule pt-3">
                    <DetailRow label="Deadline">{formatDateTime(data.deadline)}</DetailRow>
                    <DetailRow label="Policy">
                      <span className="flex items-center gap-2">
                        v{data.policyVersion}
                        <HashChip value={data.policyHash} label="Policy hash" />
                      </span>
                    </DetailRow>
                    {data.chainJobId && (
                      <DetailRow label="Chain job">
                        <HashChip value={data.chainJobId} label="Chain job id" />
                      </DetailRow>
                    )}
                    <DetailRow label="Created">{formatDateTime(data.createdAt)}</DetailRow>
                  </div>
                </>
              ) : (
                <div className="h-40 animate-pulse rounded-[8px] bg-wash" aria-busy />
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>

      <Dialog open={manifest !== null} onOpenChange={(v) => !v && setManifest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export manifest</DialogTitle>
            <DialogDescription>
              Accepted work only. The manifest lists hashes and pseudonymous ids; raw media and
              labels stay private.
            </DialogDescription>
          </DialogHeader>
          {manifest && (
            <div className="flex flex-col gap-3 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Field label="Job" value={manifest.jobTitle} />
                <Field label="Tasks" value={manifest.taskCount.toLocaleString("en-US")} />
                <Field label="Policy" value={`v${manifest.policyVersion}`} />
                <Field label="Media included" value="No" />
              </div>
              <div className="flex flex-col gap-1 border-t border-rule pt-3">
                <span className="text-xs text-ink-muted">Annotation hash root</span>
                <HashChip value={manifest.annotationHashRoot} label="Annotation hash root" />
              </div>
              <div className="max-h-52 overflow-y-auto rounded-[8px] border border-rule">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-wash text-left">
                    <tr>
                      <th className="px-2.5 py-1.5 font-medium text-ink-muted">Task</th>
                      <th className="px-2.5 py-1.5 font-medium text-ink-muted">Annotation hash</th>
                      <th className="px-2.5 py-1.5 font-medium text-ink-muted">Contributor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifest.entries.length === 0 && (
                      <tr>
                        <td className="px-2.5 py-3 text-ink-muted" colSpan={3}>
                          No accepted tasks have been exported yet.
                        </td>
                      </tr>
                    )}
                    {manifest.entries.map((entry) => (
                      <tr key={entry.taskId} className="border-t border-rule">
                        <td className="machine px-2.5 py-1.5 text-ink">{entry.taskId}</td>
                        <td className="machine px-2.5 py-1.5 text-ink-muted">
                          {entry.annotationHash.slice(0, 18)}…
                        </td>
                        <td className="px-2.5 py-1.5 text-ink-muted">
                          {entry.contributorPseudonym}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Close</Button>
            </DialogClose>
            <Button onClick={download}>
              <Download aria-hidden />
              Download manifest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
      <Link href="/buyer">
        <ArrowLeft aria-hidden />
        All jobs
      </Link>
    </Button>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
