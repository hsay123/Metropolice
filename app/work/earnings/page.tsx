"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  Flag,
  Pencil,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { Stat, StatGrid } from "@/components/domain/stat";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/domain/table";
import { StatusPill, StatusRail } from "@/components/domain/status";
import { ReceiptCard } from "@/components/domain/receipt";
import { RewardAmount } from "@/components/domain/machine";
import { ReasonText } from "@/components/domain/reason-code";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/domain/states";
import { useAppeal, useClaimReward, useEarnings, useReceipt } from "@/lib/api/hooks";
import { TEST_TOKEN_NOTE, MIN_SAMPLE_FOR_RATE } from "@/lib/config";
import { formatAmount } from "@/lib/format";
import { timeAgo } from "@/lib/dates";
import type { EarningRow, Receipt } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * /work/earnings — accepted, waiting, rejected and appealed work. A claim is the
 * one orchestrated moment: the rail advances Accepted → Paid and the receipt
 * slides out once (AGENTS.md A3). Accepted and Paid are always shown as different
 * states. Demo rewards are test tokens.
 */
export default function EarningsPage() {
  const { data, isPending, isError, refetch } = useEarnings();
  const claim = useClaimReward();
  const appeal = useAppeal();

  const [selectedTask, setSelectedTask] = React.useState<string | null>(null);
  const [justClaimed, setJustClaimed] = React.useState<Record<string, Receipt>>({});
  const [claiming, setClaiming] = React.useState<string | null>(null);
  const [appealFor, setAppealFor] = React.useState<EarningRow | null>(null);
  const [appealReason, setAppealReason] = React.useState("");

  const rows = data?.rows ?? [];
  const selected = rows.find((r) => r.taskId === selectedTask) ?? rows[0] ?? null;
  const accepted = rows.filter((r) => r.state === "accepted");
  const decided = rows.filter((r) =>
    ["accepted", "needs_revision", "rejected", "paid"].includes(r.state),
  );
  const good = rows.filter((r) => r.state === "accepted" || r.state === "paid").length;
  const hasEnoughForRate = decided.length >= MIN_SAMPLE_FOR_RATE;
  const acceptanceRate = decided.length ? Math.round((good / decided.length) * 100) : 0;

  async function claimRows(targets: EarningRow[]) {
    if (targets.length === 0) return;
    setClaiming(targets[0].taskId);
    try {
      let last: Receipt | null = null;
      for (const row of targets) {
        const receipt = await claim.mutateAsync(row.taskId);
        last = receipt;
        setJustClaimed((prev) => ({ ...prev, [row.taskId]: receipt }));
        setSelectedTask(row.taskId);
      }
      toast.success(targets.length === 1 ? "Reward claimed" : "Rewards claimed", {
        description: "The payout is confirmed. Open the receipt to verify it.",
      });
      if (last) void last;
    } catch (err) {
      toast.error("Could not claim the reward", {
        description: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setClaiming(null);
    }
  }

  function submitAppeal() {
    if (!appealFor) return;
    const reason = appealReason.trim();
    if (reason.length < 5) {
      toast.error("Add a short reason", { description: "Say what the reviewer should look at again." });
      return;
    }
    appeal.mutate(
      { id: appealFor.taskId, reason },
      {
        onSuccess: () => {
          toast.success("Appeal submitted", { description: "A reviewer looks at it again." });
          setAppealFor(null);
          setAppealReason("");
        },
        onError: (err) =>
          toast.error("Could not submit the appeal", {
            description: err instanceof Error ? err.message : "Try again in a moment.",
          }),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        context="Contributor"
        title="Earnings"
        description="Accepted work is claimable. Paid work has a receipt. Rejected work always shows why."
        actions={
          accepted.length > 0 ? (
            <Button onClick={() => claimRows(accepted)} disabled={claiming !== null}>
              <Wallet aria-hidden />
              {claiming
                ? "Waiting for confirmation"
                : accepted.length === 1
                  ? "Claim reward"
                  : `Claim all rewards (${accepted.length})`}
            </Button>
          ) : undefined
        }
      />

      <Panel>
        <PanelHeader title="Summary" />
        <PanelBody>
          <StatGrid>
            <Stat label="Claimable" value={formatAmount(data?.claimable ?? 0)} hint="Accepted, not yet paid" />
            <Stat label="Waiting" value={formatAmount(data?.waiting ?? 0)} hint="Submitted or in review" />
            <Stat label="Paid" value={formatAmount(data?.paid ?? 0)} hint="Confirmed payouts" />
            <Stat
              label="Acceptance rate"
              value={hasEnoughForRate ? `${acceptanceRate}%` : "Not enough data yet"}
              hint={
                hasEnoughForRate
                  ? `${decided.length} decisions so far`
                  : `${decided.length} of ${MIN_SAMPLE_FOR_RATE} decisions needed`
              }
            />
          </StatGrid>
          <p className="mt-4 flex items-center gap-2 border-t border-rule pt-3 text-xs text-ink-muted">
            <Wallet className="size-3.5" aria-hidden />
            {TEST_TOKEN_NOTE}
          </p>
        </PanelBody>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel className="self-start">
          <PanelHeader title="Your work" description={data ? `${rows.length} tasks` : "Loading your work"} />
          {isPending ? (
            <div className="p-4">
              <TableSkeleton rows={4} cols={5} />
            </div>
          ) : isError ? (
            <div className="p-4">
              <ErrorState
                message="We could not load your earnings. Check your connection and try again."
                onRetry={() => refetch()}
              />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              className="m-4"
              title="No work yet"
              description="Claim a task from the queue to start earning."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/work/tasks">
                    Go to task queue
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              }
            />
          ) : (
            <DataTable>
              <THead>
                <TR className="border-rule">
                  <TH>Job</TH>
                  <TH numeric>Reward</TH>
                  <TH>State</TH>
                  <TH>Updated</TH>
                  <TH className="text-right">Action</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((row) => {
                  const active = selected?.taskId === row.taskId;
                  return (
                    <TR
                      key={row.taskId}
                      aria-selected={active}
                      className={cn("cursor-pointer", active ? "bg-brand-tint" : "hover:bg-wash")}
                      onClick={() => setSelectedTask(row.taskId)}
                    >
                      <TD>
                        <span className="block font-medium text-ink">{row.jobTitle}</span>
                        <span className="machine text-xs text-ink-muted">{row.taskId}</span>
                      </TD>
                      <TD numeric>
                        <span className="font-medium">{formatAmount(row.reward)}</span>
                      </TD>
                      <TD>
                        <StatusPill state={row.state} />
                      </TD>
                      <TD className="text-ink-muted">{timeAgo(row.updatedAt)}</TD>
                      <TD className="text-right" onClick={(e) => e.stopPropagation()}>
                        <RowAction
                          row={row}
                          claiming={claiming === row.taskId}
                          onClaim={() => claimRows([row])}
                          onAppeal={() => {
                            setAppealFor(row);
                            setAppealReason("");
                          }}
                          onSelect={() => setSelectedTask(row.taskId)}
                        />
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </DataTable>
          )}
        </Panel>

        <div className="self-start lg:sticky lg:top-[72px]">
          {selected ? (
            <EarningsDetail
              row={selected}
              claimed={justClaimed[selected.taskId]}
              claiming={claiming === selected.taskId}
              onClaim={() => claimRows([selected])}
              onAppeal={() => {
                setAppealFor(selected);
                setAppealReason("");
              }}
            />
          ) : null}
        </div>
      </div>

      <Dialog open={appealFor !== null} onOpenChange={(v) => !v && setAppealFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appeal this decision</DialogTitle>
            <DialogDescription>
              Say what the reviewer should look at again. A different reviewer reads it with the
              reference label.
            </DialogDescription>
          </DialogHeader>
          {appealFor?.reasonCode && (
            <p className="rounded-[2px] border border-rule bg-wash px-3 py-2 text-sm text-ink">
              <span className="text-ink-muted">Rejection reason: </span>
              <ReasonText code={appealFor.reasonCode} />
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="appeal-reason">Your reason</Label>
            <Textarea
              id="appeal-reason"
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              rows={4}
              placeholder="The pen is boxed but the label sits on the box edge…"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={submitAppeal} disabled={appeal.isPending}>
              {appeal.isPending ? "Submitting…" : "Submit appeal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RowAction({
  row,
  claiming,
  onClaim,
  onAppeal,
  onSelect,
}: {
  row: EarningRow;
  claiming: boolean;
  onClaim: () => void;
  onAppeal: () => void;
  onSelect: () => void;
}) {
  switch (row.state) {
    case "accepted":
      return (
        <Button size="sm" onClick={onClaim} disabled={claiming}>
          {claiming ? "Claiming…" : "Claim reward"}
        </Button>
      );
    case "needs_revision":
      return (
        <Button asChild variant="outline" size="sm">
          <Link href={`/work/tasks/${row.taskId}`}>
            <Pencil aria-hidden />
            Fix and resubmit
          </Link>
        </Button>
      );
    case "rejected":
      return (
        <Button variant="outline" size="sm" onClick={onAppeal}>
          <Flag aria-hidden />
          Appeal
        </Button>
      );
    case "paid":
      return (
        <Button variant="ghost" size="sm" onClick={onSelect}>
          <ReceiptText aria-hidden />
          Receipt
        </Button>
      );
    default:
      return <span className="text-xs text-ink-muted">In review</span>;
  }
}

function EarningsDetail({
  row,
  claimed,
  claiming,
  onClaim,
  onAppeal,
}: {
  row: EarningRow;
  claimed?: Receipt;
  claiming: boolean;
  onClaim: () => void;
  onAppeal: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Panel>
        <PanelHeader title={row.jobTitle} description={`Task ${row.taskId}`} />
        <PanelBody className="flex flex-col gap-4">
          <StatusRail state={row.state} />

          <div className="flex items-center justify-between border-t border-rule pt-3">
            <span className="text-xs text-ink-muted">Reward</span>
            <RewardAmount amount={row.reward} />
          </div>

          {row.reasonCode && (
            <div className="rounded-[2px] border border-[var(--revision-ink)]/30 bg-revision-bg px-3 py-2">
              <p className="text-xs text-revision-ink">Reviewer reason</p>
              <p className="mt-1 text-sm text-ink">
                <ReasonText code={row.reasonCode} />
              </p>
            </div>
          )}

          {row.state === "accepted" && (
            <Button className="w-full" onClick={onClaim} disabled={claiming}>
              <Wallet aria-hidden />
              {claiming ? "Waiting for confirmation" : "Claim reward"}
            </Button>
          )}

          {row.state === "needs_revision" && (
            <Button asChild className="w-full">
              <Link href={`/work/tasks/${row.taskId}`}>
                <Pencil aria-hidden />
                Fix and resubmit
              </Link>
            </Button>
          )}

          {row.state === "rejected" && (
            <Button variant="outline" className="w-full" onClick={onAppeal}>
              <Flag aria-hidden />
              Appeal this decision
            </Button>
          )}

          {row.state === "appealed" && (
            <p className="rounded-[2px] border border-dashed border-[var(--field-edge)] px-3 py-2 text-sm text-ink-muted">
              Appeal under review. A different reviewer decides.
            </p>
          )}
        </PanelBody>
      </Panel>

      {(row.state === "paid" || claimed) && (
        <PaidReceipt receipt={claimed} receiptId={row.receiptId} />
      )}
    </div>
  );
}

/**
 * The receipt for a paid task. If we just claimed it, the receipt object is in
 * hand and animates out; otherwise it is fetched by id.
 */
function PaidReceipt({ receipt, receiptId }: { receipt?: Receipt; receiptId?: string }) {
  const { data } = useReceipt(receiptId ?? "");
  const value = receipt ?? data;
  if (!value) {
    return (
      <div className="h-64 animate-pulse rounded-[6px] border border-rule bg-sheet" aria-busy />
    );
  }
  return <ReceiptCard receipt={value} animate={Boolean(receipt)} />;
}
