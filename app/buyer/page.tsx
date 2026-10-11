"use client";

import * as React from "react";
import Link from "next/link";
import { ImageIcon, Plus, Search, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/domain/table";
import { SortHeader, TablePagination, TableToolbar } from "@/components/domain/table-toolbar";
import { JobStatusPill } from "@/components/domain/status";
import { ReviewMix } from "@/components/domain/review-mix";
import { BudgetBar } from "@/components/domain/budget-bar";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/domain/states";
import { useBuyerOverview, useJobs } from "@/lib/api/hooks";
import { workspaceFor } from "@/lib/workspace";
import { MIN_SAMPLE_FOR_RATE, TEST_TOKEN_NOTE } from "@/lib/config";
import { formatAmount } from "@/lib/format";
import { formatDateTime } from "@/lib/dates";
import type { Job, JobStatus } from "@/lib/api/types";

const PAGE_SIZE = 8;

const STATUS_ORDER: JobStatus[] = ["draft", "funding", "active", "paused", "closed"];

type SortKey = "title" | "status" | "rewardPerTask" | "budget" | "deadline";

/** Reward with its unit, so a figure never appears without the token name. */
function Reward({ value }: { value: number }) {
  return (
    <span className="tabular-nums">
      {formatAmount(value)} <span className="text-[12px] text-[var(--fg-subtle)]">test USDC</span>
    </span>
  );
}

/**
 * /buyer — the buyer dashboard, rebuilt to docs/moodboard/tiles/pd_dashboard.png:
 * a welcome header, four KPI cards, the active projects list, then how the labels
 * were decided and where the budget sits. Figures are computed from the API; nothing
 * is invented, and a rate stays hidden until there is enough data to report it
 * (AGENTS.md A2, docs/MOODBOARD-SPEC.md §5).
 */
export default function BuyerDashboardPage() {
  const overview = useBuyerOverview();
  const jobs = useJobs();
  const workspace = workspaceFor("buyer");

  const rate = overview.data ? Math.round(overview.data.acceptanceRate * 100) : 0;
  const enoughForRate = (overview.data?.tasksAccepted ?? 0) >= MIN_SAMPLE_FOR_RATE;

  const jobsList = React.useMemo(() => jobs.data ?? [], [jobs.data]);

  /* filter, sort and page the projects list */
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | JobStatus>("all");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "deadline",
    dir: "asc",
  });
  const [page, setPage] = React.useState(1);

  const sorted = React.useMemo(() => {
    const list = jobsList.filter((j) => {
      const matchesQuery =
        query.trim() === "" ||
        j.title.toLowerCase().includes(query.trim().toLowerCase()) ||
        j.id.toLowerCase().includes(query.trim().toLowerCase());
      const matchesStatus = status === "all" || j.status === status;
      return matchesQuery && matchesStatus;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sort.key) {
        case "title":
          return a.title.localeCompare(b.title) * dir;
        case "status":
          return (STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)) * dir;
        case "rewardPerTask":
          return (a.rewardPerTask - b.rewardPerTask) * dir;
        case "budget":
          return (a.budget - b.budget) * dir;
        case "deadline":
        default:
          return (new Date(a.deadline).getTime() - new Date(b.deadline).getTime()) * dir;
      }
    });
  }, [jobsList, query, status, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setPage(1);
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  const data = overview.data;

  return (
    <div className="flex flex-col gap-6">
      {/* welcome header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[var(--fg-muted)]">Buyer</p>
          <h1 className="mt-1 font-display text-[28px] leading-tight font-bold tracking-[-0.02em]">
            Welcome back, {workspace.name}
          </h1>
          <p className="mt-2 max-w-[62ch] text-[14px] text-[var(--fg-muted)]">
            What you are buying, what it cost, and how every accepted label was decided.
          </p>
        </div>
        <Button asChild>
          <Link href="/buyer/jobs/new">
            <Plus aria-hidden />
            Post a labelling job
          </Link>
        </Button>
      </header>

      {/* four KPI cards — plain figures, no sparkline or delta without a real series */}
      <div data-ui="kpi-row" className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Tasks accepted"
          value={data ? data.tasksAccepted.toLocaleString() : "—"}
          hint="Passed review"
          loading={overview.isPending}
        />
        <KpiCard
          label="Acceptance rate"
          value={data && enoughForRate ? `${rate}%` : "Not enough data yet"}
          hint={data && enoughForRate ? undefined : `Needs ${MIN_SAMPLE_FOR_RATE} decided tasks`}
          tone={data && enoughForRate ? "positive" : "neutral"}
          loading={overview.isPending}
        />
        <KpiCard
          label="Confirmed spend"
          value={data ? formatAmount(data.spend) : "—"}
          hint="test USDC"
          loading={overview.isPending}
        />
        <KpiCard
          label="In review"
          value={data ? data.tasksInReview.toLocaleString() : "—"}
          hint="Awaiting a decision"
          loading={overview.isPending}
        />
      </div>

      {/* active projects */}
      <Panel>
        <PanelHeader
          title="Active projects"
          description={
            jobsList.length > 0 ? `${sorted.length} of ${jobsList.length} jobs` : "Your labelling jobs"
          }
        />

        {!jobs.isPending && !jobs.isError && jobsList.length > 0 && (
          <TableToolbar>
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--fg-subtle)]"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                aria-label="Search jobs by name or id"
                placeholder="Search jobs"
                className="w-full pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="jobs-status" className="text-[13px] text-[var(--fg-muted)]">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as "all" | JobStatus);
                  setPage(1);
                }}
              >
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
            {(query.trim() !== "" || status !== "all") && (
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
          <div className="p-5">
            <TableSkeleton rows={4} cols={6} />
          </div>
        ) : jobs.isError ? (
          <div className="p-5">
            <ErrorState
              message="We could not load your jobs. Check your connection and try again."
              onRetry={() => jobs.refetch()}
            />
          </div>
        ) : jobsList.length === 0 ? (
          <EmptyState
            className="m-5"
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
            className="m-5"
            title="No jobs match your filters"
            description="Clear the search and status filter to see all your jobs."
            action={
              <Button
                variant="secondary"
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
              <TR className="hover:bg-transparent">
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-3.5">
          <p className="text-[13px] text-[var(--fg-muted)]">
            Accepted work only is exported, with a manifest of hashes and pseudonyms.
          </p>
          {sorted.length > PAGE_SIZE && (
            <TablePagination page={safePage} pageCount={pageCount} onPage={setPage} />
          )}
        </div>
      </Panel>

      {/* how labels were decided, and where the budget sits */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="How labels were decided" description="AI first pass against the rubric, then people." />
          <PanelBody>
            {data ? (
              <ReviewMix ai={data.aiReviewed} human={data.humanReviewed} adjudicated={data.adjudicated} />
            ) : (
              <div className="h-16 animate-pulse rounded-[8px] bg-[var(--surface-2)]" aria-busy />
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader title="Budget" description="Funds sit in escrow on Monad." />
          <PanelBody className="flex flex-col gap-4">
            {data ? (
              <>
                <BudgetBar spent={data.spend} budget={data.budget} />
                <p className="text-[13px] text-[var(--fg-muted)]">{TEST_TOKEN_NOTE}</p>
              </>
            ) : (
              <div className="h-16 animate-pulse rounded-[8px] bg-[var(--surface-2)]" aria-busy />
            )}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  return (
    <TR>
      <TD>
        <span className="flex items-center gap-2 font-semibold text-[var(--fg)]">
          {job.modality === "image" ? (
            <ImageIcon className="size-4 text-[var(--fg-subtle)]" aria-hidden />
          ) : (
            <Video className="size-4 text-[var(--fg-subtle)]" aria-hidden />
          )}
          {job.title}
        </span>
        <span className="machine mt-0.5 flex items-center gap-2 text-[12px] text-[var(--fg-muted)]">
          <span>{job.id}</span>
          <span>policy v{job.policyVersion}</span>
        </span>
      </TD>
      <TD>
        <JobStatusPill status={job.status} />
      </TD>
      <TD numeric>
        <Reward value={job.rewardPerTask} />
      </TD>
      <TD numeric className="text-[var(--fg-muted)]">
        {formatAmount(job.spent)} / {formatAmount(job.budget)}
      </TD>
      <TD className="text-[var(--fg-muted)]">{formatDateTime(job.deadline)}</TD>
      <TD numeric>
        <Button asChild variant="secondary" size="sm">
          <Link href={`/buyer/jobs/${job.id}`}>Open</Link>
        </Button>
      </TD>
    </TR>
  );
}
