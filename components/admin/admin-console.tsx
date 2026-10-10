"use client";

import * as React from "react";
import {
  Ban,
  Check,
  CirclePause,
  Lock,
  PenLine,
  Play,
  ShieldCheck,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/domain/page-header";
import { DetailRow, Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/domain/table";
import { JobStatusPill } from "@/components/domain/status";
import { TxLink } from "@/components/domain/machine";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/domain/states";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useApproveQuorum,
  useJobs,
  usePauseJob,
  useQuorumRequests,
  useRejectQuorum,
  useRoles,
  useSetRole,
  useSignerPolicy,
} from "@/lib/api/hooks";
import { QUORUM_ACTION_DESCRIPTION, QUORUM_ACTION_LABEL } from "@/lib/labels";
import { ROLE_LABEL } from "@/lib/roles";
import { formatDateTime } from "@/lib/dates";
import { formatAmount } from "@/lib/format";
import type { Job, QuorumRequest, Role, RoleRow } from "@/lib/api/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ROLES: Role[] = ["buyer", "contributor", "reviewer", "admin"];

const ACTION_ICON: Record<QuorumRequest["action"], LucideIcon> = {
  refund: Undo2,
  close: Ban,
  pause: CirclePause,
  policy_change: PenLine,
};

/**
 * /admin — the money guard rails. Pause control, the signer policy, the role
 * table, and quorum approvals for refund, close, pause and policy change
 * (AGENTS.md A2, A5). This is the only screen that may show a name or email
 * (PRD §15).
 */
export function AdminConsole() {
  const policy = useSignerPolicy();
  const quorum = useQuorumRequests();
  const roles = useRoles();
  const jobs = useJobs();

  const pending = (quorum.data ?? []).filter((q) => !q.executed);
  const executed = (quorum.data ?? []).filter((q) => q.executed);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        context="Admin"
        title="Controls"
        description="Who can sign, who holds which role, and which jobs are paused. Every payout action needs two approvals."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Signer policy -------------------------------------------------- */}
        <Panel>
          <PanelHeader
            title="Signer policy"
            description="What the payout signer is allowed to do."
          />
          <PanelBody>
            {policy.isPending ? (
              <div className="h-24 animate-pulse rounded-[2px] bg-wash" aria-busy />
            ) : policy.isError || !policy.data ? (
              <ErrorState
                message="We could not load the signer policy. Check your connection and try again."
                onRetry={() => policy.refetch()}
              />
            ) : (
              <dl className="flex flex-col">
                <DetailRow label="Signer">{policy.data.signer}</DetailRow>
                <DetailRow label="Status">
                  <SignerState status={policy.data.status} />
                </DetailRow>
                <DetailRow label="Allowed">
                  <span className="machine text-xs">{policy.data.allowed}</span>
                </DetailRow>
                <DetailRow label="Approvals needed">{policy.data.quorumSize} admins</DetailRow>
              </dl>
            )}
          </PanelBody>
          <div className="flex items-start gap-2 border-t border-rule px-4 py-3 text-xs text-ink-muted">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Changing the policy is a quorum action. It needs {policy.data?.quorumSize ?? 2} approvals
            and writes its own on-chain record.
          </div>
        </Panel>

        {/* Quorum approvals ---------------------------------------------- */}
        <Panel>
          <PanelHeader
            title="Approvals waiting"
            description="Refund, close, pause and policy changes all wait here. Approve to add your signature."
          />
          {quorum.isPending ? (
            <div className="p-4">
              <TableSkeleton rows={2} cols={3} />
            </div>
          ) : quorum.isError ? (
            <div className="p-4">
              <ErrorState
                message="We could not load the approval queue. Check your connection and try again."
                onRetry={() => quorum.refetch()}
              />
            </div>
          ) : pending.length === 0 ? (
            <EmptyState
              className="m-4"
              icon={ShieldCheck}
              title="No approvals waiting"
              description="Refunds, job closes, pauses and policy changes will appear here for a second signature."
            />
          ) : (
            <ul className="divide-y divide-rule">
              {pending.map((q) => (
                <QuorumRow key={q.id} request={q} />
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Roles ----------------------------------------------------------- */}
      <Panel>
        <PanelHeader
          title="Roles"
          description="Names and emails are shown on this screen only. Contributors are pseudonymous everywhere else."
        />
        {roles.isPending ? (
          <div className="p-4">
            <TableSkeleton rows={4} cols={4} />
          </div>
        ) : roles.isError ? (
          <div className="p-4">
            <ErrorState
              message="We could not load the role table. Check your connection and try again."
              onRetry={() => roles.refetch()}
            />
          </div>
        ) : (roles.data ?? []).length === 0 ? (
          <EmptyState className="m-4" title="No users yet" />
        ) : (
          <DataTable>
            <THead>
              <TR className="border-rule">
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Pseudonym</TH>
                <TH>Role</TH>
              </TR>
            </THead>
            <TBody>
              {roles.data!.map((row) => (
                <RoleRowItem key={row.id} row={row} />
              ))}
            </TBody>
          </DataTable>
        )}
      </Panel>

      {/* Jobs and pause -------------------------------------------------- */}
      <Panel>
        <PanelHeader
          title="Jobs"
          description="Pausing a job holds its payouts until you resume it. Contributors can still finish work already claimed."
        />
        {jobs.isPending ? (
          <div className="p-4">
            <TableSkeleton rows={3} cols={4} />
          </div>
        ) : jobs.isError ? (
          <div className="p-4">
            <ErrorState
              message="We could not load the jobs. Check your connection and try again."
              onRetry={() => jobs.refetch()}
            />
          </div>
        ) : (jobs.data ?? []).length === 0 ? (
          <EmptyState className="m-4" title="No jobs yet" />
        ) : (
          <DataTable>
            <THead>
              <TR className="border-rule">
                <TH>Job</TH>
                <TH>Status</TH>
                <TH>Funded</TH>
                <TH className="text-right">Payouts</TH>
              </TR>
            </THead>
            <TBody>
              {jobs.data!.map((job) => (
                <JobControlRow key={job.id} job={job} />
              ))}
            </TBody>
          </DataTable>
        )}
      </Panel>

      {/* Executed approvals --------------------------------------------- */}
      {executed.length > 0 && (
        <Panel>
          <PanelHeader
            title="Recent approvals"
            description="Actions that reached their approval count and executed on chain."
          />
          <ul className="divide-y divide-rule">
            {executed.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                <ExecutedIcon action={q.action} />
                <span className="font-medium text-ink">{QUORUM_ACTION_LABEL[q.action]}</span>
                <span className="text-sm text-ink-muted">{q.jobTitle}</span>
                <span className="ml-auto flex items-center gap-2 text-xs text-ink-muted">
                  <span className="tabular-nums">
                    {q.approvals} of {q.approvalsNeeded} approvals
                  </span>
                  <TxLink txHash={q.txHash} state="confirmed" />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function SignerState({ status }: { status: "active" | "paused" }) {
  const active = status === "active";
  const Icon = active ? ShieldCheck : CirclePause;
  return (
    <span
      className="inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium"
      style={
        active
          ? { color: "var(--accepted-ink)", background: "var(--accepted-bg)" }
          : { color: "var(--revision-ink)", background: "var(--revision-bg)" }
      }
    >
      <Icon className="size-3" aria-hidden />
      {active ? "Active" : "Paused"}
    </span>
  );
}

function ExecutedIcon({ action }: { action: QuorumRequest["action"] }) {
  const Icon = ACTION_ICON[action];
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-[2px] bg-wash text-ink-muted">
      <Icon className="size-3.5" aria-hidden />
    </span>
  );
}

function QuorumRow({ request }: { request: QuorumRequest }) {
  const approve = useApproveQuorum();
  const reject = useRejectQuorum();
  const Icon = ACTION_ICON[request.action];
  const busy = approve.isPending || reject.isPending;

  function onApprove() {
    approve.mutate(request.id, {
      onSuccess: (q) => {
        toast.success(q.executed ? "Action executed" : "Approval recorded", {
          description: q.executed
            ? `${QUORUM_ACTION_LABEL[request.action]} reached ${q.approvalsNeeded} approvals and was sent on chain.`
            : `${QUORUM_ACTION_LABEL[request.action]} now has ${q.approvals} of ${q.approvalsNeeded} approvals.`,
        });
      },
      onError: (e) => {
        toast.error("Approval not recorded", { description: (e as Error).message });
      },
    });
  }

  function onReject() {
    reject.mutate(request.id, {
      onSuccess: () => {
        toast.success("Request withdrawn", {
          description: `${QUORUM_ACTION_LABEL[request.action]} was removed from the queue.`,
        });
      },
      onError: (e) => {
        toast.error("Request not withdrawn", { description: (e as Error).message });
      },
    });
  }

  const remaining = request.approvalsNeeded - request.approvals;

  return (
    <li className="flex flex-wrap items-start gap-3 px-4 py-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[2px] bg-wash text-ink-muted">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-[220px] flex-1">
        <p className="font-medium text-ink">{QUORUM_ACTION_LABEL[request.action]}</p>
        <p className="text-sm text-ink-muted">{request.jobTitle}</p>
        <p className="mt-1 max-w-[60ch] text-xs text-ink-muted">
          {QUORUM_ACTION_DESCRIPTION[request.action]}
        </p>
      </div>
      <div className="flex min-w-[150px] flex-col gap-1">
        <ApprovalProgress approvals={request.approvals} needed={request.approvalsNeeded} />
        <p className="text-xs text-ink-muted">
          {request.approvers.join(", ")} approved
        </p>
        <p className="text-xs text-ink-muted">Requested by {request.requestedBy}</p>
        <p className="text-xs text-ink-muted">{formatDateTime(request.createdAt)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onApprove}
          disabled={busy}
          title={remaining === 1 ? "This is the final approval" : undefined}
        >
          <Check aria-hidden />
          Approve
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReject}
          disabled={busy}
        >
          <X aria-hidden />
          Withdraw
        </Button>
      </div>
    </li>
  );
}

function ApprovalProgress({ approvals, needed }: { approvals: number; needed: number }) {
  const cells = Array.from({ length: needed });
  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={`${approvals} of ${needed} approvals`}
    >
      {cells.map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "h-1.5 w-6 rounded-[2px]",
            i < approvals ? "bg-[var(--accepted-ink)]" : "bg-[color-mix(in_srgb,var(--field-edge)_35%,transparent)]",
          )}
        />
      ))}
    </span>
  );
}

function RoleRowItem({ row }: { row: RoleRow }) {
  const setRole = useSetRole();
  return (
    <TR className="hover:bg-wash">
      <TD className="font-medium">{row.name}</TD>
      <TD className="text-ink-muted">{row.email}</TD>
      <TD className="machine text-xs text-ink-muted">{row.pseudonym}</TD>
      <TD>
        <Select
          value={row.role}
          disabled={setRole.isPending}
          onValueChange={(role) =>
            setRole.mutate(
              { id: row.id, role: role as Role },
              {
                onSuccess: () =>
                  toast.success("Role updated", {
                    description: `${row.name} is now a ${ROLE_LABEL[role as Role].toLowerCase()}.`,
                  }),
                onError: (e) =>
                  toast.error("Role not updated", { description: (e as Error).message }),
              },
            )
          }
        >
          <SelectTrigger size="sm" className="w-[150px]" aria-label={`Role for ${row.name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TD>
    </TR>
  );
}

function JobControlRow({ job }: { job: Job }) {
  const pause = usePauseJob();
  const paused = job.status === "paused";

  function toggle() {
    pause.mutate(job.id, {
      onSuccess: (j) =>
        toast.success(j.status === "paused" ? "Job paused" : "Job resumed", {
          description:
            j.status === "paused"
              ? `Payouts for ${j.title} are on hold until you resume.`
              : `Payouts for ${j.title} will continue.`,
        }),
      onError: (e) => toast.error("Job not changed", { description: (e as Error).message }),
    });
  }

  return (
    <TR className="hover:bg-wash">
      <TD>
        <span className="font-medium text-ink">{job.title}</span>
        <span className="machine block text-xs text-ink-muted">{job.id}</span>
      </TD>
      <TD>
        <JobStatusPill status={job.status} />
      </TD>
      <TD className="text-ink-muted tabular-nums">
        {formatAmount(job.spent)} of {formatAmount(job.budget)}
      </TD>
      <TD className="text-right">
        <Button
          type="button"
          variant={paused ? "default" : "outline"}
          size="sm"
          onClick={toggle}
          disabled={pause.isPending}
        >
          {paused ? <Play aria-hidden /> : <CirclePause aria-hidden />}
          {paused ? "Resume payouts" : "Pause payouts"}
        </Button>
      </TD>
    </TR>
  );
}
