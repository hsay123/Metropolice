"use client";

import Link from "next/link";
import { ArrowRight, ImageIcon, Plus, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/domain/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { Stat, StatGrid } from "@/components/domain/stat";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/domain/table";
import { JobStatusPill } from "@/components/domain/status";
import { ReviewMix } from "@/components/domain/review-mix";
import { BudgetBar } from "@/components/domain/budget-bar";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/domain/states";
import { useBuyerOverview, useJobs } from "@/lib/api/hooks";
import { formatAmount } from "@/lib/format";
import { formatDateTime } from "@/lib/dates";
import { MIN_SAMPLE_FOR_RATE } from "@/lib/config";
import type { Job } from "@/lib/api/types";

/**
 * /buyer — the buyer dashboard. Spend, acceptance rate and the AI vs human review
 * share, so a robotics team can trust the labels without doing QA (AGENTS.md A2).
 */
export default function BuyerDashboardPage() {
  const overview = useBuyerOverview();
  const jobs = useJobs();

  const rate = overview.data ? Math.round(overview.data.acceptanceRate * 100) : 0;
  const enoughForRate = (overview.data?.tasksAccepted ?? 0) >= MIN_SAMPLE_FOR_RATE;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        context="Buyer"
        title="Jobs"
        description="What you are buying, what it cost, and how every accepted label was decided."
        actions={
          <Button asChild>
            <Link href="/buyer/jobs/new">
              <Plus aria-hidden />
              Post a labelling job
            </Link>
          </Button>
        }
      />

      <Panel>
        <PanelHeader title="Overview" description="Across all your jobs" />
        <PanelBody>
          {overview.isPending ? (
            <div className="h-20 animate-pulse rounded-[2px] bg-wash" aria-busy />
          ) : overview.isError || !overview.data ? (
            <ErrorState
              message="We could not load your overview. Check your connection and try again."
              onRetry={() => overview.refetch()}
            />
          ) : (
            <StatGrid>
              <Stat label="Tasks accepted" value={overview.data.tasksAccepted.toLocaleString("en-US")} />
              <Stat label="In review" value={overview.data.tasksInReview.toLocaleString("en-US")} />
              <Stat
                label="Acceptance rate"
                value={enoughForRate ? `${rate}%` : "Not enough data yet"}
                hint={enoughForRate ? "Accepted of decided" : `Needs ${MIN_SAMPLE_FOR_RATE} accepted tasks`}
              />
              <Stat
                label="Spend"
                value={formatAmount(overview.data.spend)}
                hint={`of ${formatAmount(overview.data.budget)} budget`}
              />
              <Stat label="Budget left" value={formatAmount(overview.data.budgetLeft)} />
            </StatGrid>
          )}
        </PanelBody>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="How work was reviewed"
            description="Every accepted label says whether AI or a person decided it."
          />
          <PanelBody>
            {overview.data ? (
              <ReviewMix
                ai={overview.data.aiReviewed}
                human={overview.data.humanReviewed}
                adjudicated={overview.data.adjudicated}
              />
            ) : (
              <div className="h-16 animate-pulse rounded-[2px] bg-wash" aria-busy />
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Budget" description="Funds sit in escrow on Monad." />
          <PanelBody>
            {overview.data ? (
              <BudgetBar spent={overview.data.spend} budget={overview.data.budget} />
            ) : (
              <div className="h-16 animate-pulse rounded-[2px] bg-wash" aria-busy />
            )}
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Your jobs"
          description={jobs.data ? `${jobs.data.length} jobs` : "Loading jobs"}
        />
        {jobs.isPending ? (
          <div className="p-4">
            <TableSkeleton rows={2} cols={6} />
          </div>
        ) : jobs.isError ? (
          <div className="p-4">
            <ErrorState
              message="We could not load your jobs. Check your connection and try again."
              onRetry={() => jobs.refetch()}
            />
          </div>
        ) : (jobs.data ?? []).length === 0 ? (
          <EmptyState
            className="m-4"
            title="No jobs yet"
            description="Post your first labelling job to start collecting trustworthy labels."
            action={
              <Button asChild size="sm">
                <Link href="/buyer/jobs/new">
                  <Plus aria-hidden />
                  Post a labelling job
                </Link>
              </Button>
            }
          />
        ) : (
          <DataTable>
            <THead>
              <TR className="border-rule">
                <TH>Job</TH>
                <TH>Status</TH>
                <TH numeric>Reward</TH>
                <TH>Budget</TH>
                <TH>Deadline</TH>
                <TH className="text-right">Open</TH>
              </TR>
            </THead>
            <TBody>
              {jobs.data!.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </TBody>
          </DataTable>
        )}
        <div className="flex items-center gap-2 border-t border-rule px-4 py-3 text-xs text-ink-muted">
          Accepted work exports with a manifest. Raw media and labels stay private.
        </div>
      </Panel>
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  return (
    <TR className="hover:bg-wash">
      <TD>
        <span className="flex items-center gap-2 font-medium text-ink">
          {job.modality === "image" ? (
            <ImageIcon className="size-3.5 text-ink-muted" aria-hidden />
          ) : (
            <Video className="size-3.5 text-ink-muted" aria-hidden />
          )}
          {job.title}
        </span>
        <span className="machine inline-flex items-center gap-2 text-xs text-ink-muted">
          <span>{job.id}</span>
          <span>policy v{job.policyVersion}</span>
        </span>
      </TD>
      <TD>
        <JobStatusPill status={job.status} />
      </TD>
      <TD numeric>{formatAmount(job.rewardPerTask)}</TD>
      <TD className="text-ink-muted">
        <span className="tabular-nums">
          {formatAmount(job.spent)} / {formatAmount(job.budget)}
        </span>
      </TD>
      <TD className="text-ink-muted">{formatDateTime(job.deadline)}</TD>
      <TD className="text-right">
        <Button asChild variant="outline" size="sm">
          <Link href={`/buyer/jobs/${job.id}`}>
            Open
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </TD>
    </TR>
  );
}
