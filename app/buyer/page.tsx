"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ImageIcon, Plus, Search, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/domain/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { Stat, StatGrid } from "@/components/domain/stat";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/domain/table";
import { SortHeader, TablePagination, TableToolbar } from "@/components/domain/table-toolbar";
import { PipelineLedger, type PipelineStage } from "@/components/domain/pipeline-ledger";
import { JobStatusPill } from "@/components/domain/status";
import { ReviewMix } from "@/components/domain/review-mix";
import { BudgetBar } from "@/components/domain/budget-bar";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/domain/states";
import { useBuyerOverview, useJobs } from "@/lib/api/hooks";
import { MIN_SAMPLE_FOR_RATE } from "@/lib/config";
import { formatAmount } from "@/lib/format";
import { formatDateTime } from "@/lib/dates";
import type { Job, JobStatus } from "@/lib/api/types";

const PAGE_SIZE = 8;

const STATUS_ORDER: JobStatus[] = ["draft", "funding", "active", "paused", "closed"];

type SortKey = "title" | "status" | "rewardPerTask" | "budget" | "deadline";

/**
 * /buyer — the buyer dashboard. It leads with the pipeline (where the work and
 * the money are), then the trust signals, then a filterable, sortable jobs table
 * (docs/DESIGN.md §4.3; AGENTS.md A2).
 */
export default function BuyerDashboardPage() {
  const overview = useBuyerOverview();
  const jobs = useJobs();

  const rate = overview.data ? Math.round(overview.data.acceptanceRate * 100) : 0;
  const enoughForRate = (overview.data?.tasksAccepted ?? 0) >= MIN_SAMPLE_FOR_RATE;

  const stages = React.useMemo<PipelineStage[]>(() => {
    const d = overview.data;
    if (!d) return [];
    const list: PipelineStage[] = [];
    if (d.tasksSubmitted != null) {
      list.push({ key: "submitted", label: "Submitted", count: d.tasksSubmitted, color: "var(--ink-muted)" });
    }
    list.push({ key: "review", label: "In review", count: d.tasksInReview, color: "var(--revision-ink)" });
    list.push({ key: "accepted", label: "Accepted", count: d.tasksAccepted, color: "var(--accepted-ink)" });
    if (d.tasksPaid != null) {
      list.push({ key: "paid", label: "Paid", count: d.tasksPaid, color: "var(--paid-ink)" });
    }
    return list;
  }, [overview.data]);

  /* ------------------------------------------------------------- table state */

  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | JobStatus>("all");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "deadline",
    dir: "asc",
  });
  const [page, setPage] = React.useState(1);

  const all = React.useMemo(() => jobs.data ?? [], [jobs.data]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((j) => {
      if (status !== "all" && j.status !== status) return false;
      if (!q) return true;
      return j.title.toLowerCase().includes(q) || j.id.toLowerCase().includes(q);
    });
  }, [all, query, status]);

  const sorted = React.useMemo(() => {
    const dir = sort.dir === "asc" ? 1 : -1;
    const copy = [...filtered];
    copy.sort((a, b) => {
      switch (sort.key) {
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "status":
          return (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)) * dir;
        case "deadline":
          return (new Date(a.deadline).getTime() - new Date(b.deadline).getTime()) * dir;
        case "rewardPerTask":
          return (a.rewardPerTask - b.rewardPerTask) * dir;
        case "budget":
          return (a.budget - b.budget) * dir;
      }
    });
    return copy;
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setPage(1);
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  }

  function changeQuery(v: string) {
    setQuery(v);
    setPage(1);
  }

  function changeStatus(v: "all" | JobStatus) {
    setStatus(v);
    setPage(1);
  }

  const hasFilters = query.trim() !== "" || status !== "all";

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
            <div className="h-24 animate-pulse rounded-[2px] bg-wash" aria-busy />
          ) : overview.isError || !overview.data ? (
            <ErrorState
              message="We could not load your overview. Check your connection and try again."
              onRetry={() => overview.refetch()}
            />
          ) : (
            <div className="flex flex-col gap-5">
              <PipelineLedger
                stages={stages}
                reference={overview.data.tasksSubmitted}
                note="Accepted work is only paid once the contributor claims the reward. Payouts settle on Monad testnet."
              />
              <div className="border-t border-rule pt-5">
                <StatGrid>
                  <Stat
                    label="Acceptance rate"
                    value={enoughForRate ? `${rate}%` : "Not enough data yet"}
                    hint={enoughForRate ? "Accepted of decided" : `Needs ${MIN_SAMPLE_FOR_RATE} decided tasks`}
                  />
                  <Stat label="Confirmed spend" value={formatAmount(overview.data.spend)} />
                  <Stat
                    label="Budget left"
                    value={formatAmount(overview.data.budgetLeft)}
                    hint={`of ${formatAmount(overview.data.budget)} funded`}
                  />
                </StatGrid>
              </div>
            </div>
          )}
        </PanelBody>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="How checks work" description="How accepted labels were decided." />
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
          description={
            all.length > 0
              ? hasFilters
                ? `${sorted.length} of ${all.length} jobs`
                : `${all.length} jobs`
              : "Loading jobs"
          }
        />

        {!jobs.isPending && !jobs.isError && all.length > 0 && (
          <TableToolbar>
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => changeQuery(e.target.value)}
                aria-label="Search jobs by name or id"
                placeholder="Search jobs"
                className="w-full pl-7"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="jobs-status" className="text-xs text-ink-muted">
                Status
              </label>
              <Select value={status} onValueChange={(v) => changeStatus(v as "all" | JobStatus)}>
                <SelectTrigger id="jobs-status" size="sm" className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setPage(1);
                }}
              >
                Clear
              </Button>
            )}
          </TableToolbar>
        )}

        {jobs.isPending ? (
          <div className="p-4">
            <TableSkeleton rows={4} cols={6} />
          </div>
        ) : jobs.isError ? (
          <div className="p-4">
            <ErrorState
              message="We could not load your jobs. Check your connection and try again."
              onRetry={() => jobs.refetch()}
            />
          </div>
        ) : all.length === 0 ? (
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
        ) : sorted.length === 0 ? (
          <EmptyState
            className="m-4"
            title="No jobs match your filters"
            description="Clear the search and status filter to see all your jobs."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <DataTable>
            <THead>
              <TR className="border-rule">
                <SortHeader
                  label="Job"
                  active={sort.key === "title"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("title")}
                />
                <SortHeader
                  label="Status"
                  active={sort.key === "status"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("status")}
                />
                <SortHeader
                  label="Reward"
                  numeric
                  active={sort.key === "rewardPerTask"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("rewardPerTask")}
                />
                <SortHeader
                  label="Budget"
                  numeric
                  active={sort.key === "budget"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("budget")}
                />
                <SortHeader
                  label="Deadline"
                  active={sort.key === "deadline"}
                  dir={sort.dir}
                  onToggle={() => toggleSort("deadline")}
                />
                <TH numeric>Action</TH>
              </TR>
            </THead>
            <TBody>
              {paged.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </TBody>
          </DataTable>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-3">
          <p className="text-xs text-ink-muted">
            Accepted work only is exported, with a manifest of hashes and pseudonyms.
          </p>
          {sorted.length > PAGE_SIZE && (
            <TablePagination page={safePage} pageCount={pageCount} onPage={setPage} />
          )}
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
      <TD numeric className="text-ink-muted">
        {formatAmount(job.spent)} / {formatAmount(job.budget)}
      </TD>
      <TD className="text-ink-muted">{formatDateTime(job.deadline)}</TD>
      <TD numeric>
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
