"use client";

import * as React from "react";
import { Inbox, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusPill, StatusRail } from "@/components/domain/status";
import { DecisionSource } from "@/components/domain/decision-source";
import { HashChip, RewardAmount, TxLink } from "@/components/domain/machine";
import { ConfidenceMeter } from "@/components/domain/confidence-meter";
import { LeaseTimer } from "@/components/domain/lease-timer";
import { ReasonCode } from "@/components/domain/reason-code";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/domain/states";
import { ReceiptCard } from "@/components/domain/receipt";
import { PipelineLedger } from "@/components/domain/pipeline-ledger";
import { KeyHint, KeyHintList } from "@/components/domain/key-hint";
import { TablePagination, TableToolbar } from "@/components/domain/table-toolbar";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/domain/table";
import type { Receipt, TaskState } from "@/lib/api/types";

const STATES: TaskState[] = [
  "submitted",
  "needs_revision",
  "accepted",
  "rejected",
  "appealed",
  "paid",
];

const HASH =
  "0x2bc8a1f30d9e4b7c6a2f5d8b1e4c7a0f3d6b9e2c5a8f1b4d7e0a3c6f9b2d5e8a";
const POLICY =
  "0x7d41b0e9c2a4f83d5a1e6b90c7f2d4a8e3b1c6f0a9d2e5b8c1f4a7d0e3b6c9f2";
const TX = "0x9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d6f8a0c2e4b7d9f1a3c5e7b0d2f4a6c8e";

const MOCK_RECEIPT: Receipt = {
  id: "rcpt_demo",
  taskId: "task_01Hd9",
  jobTitle: "Pen writing, kitchen set",
  contributorPseudonym: "Contributor 4F2A",
  annotationHash: HASH,
  policyHash: POLICY,
  policyVersion: 3,
  reviewerType: "human",
  amount: 2,
  token: "test USDC",
  txHash: TX,
  txState: "confirmed",
  issuedAt: "2026-10-11T09:30:00.000Z",
  mock: true,
};

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-rule pt-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg">{title}</h2>
        {note && <p className="max-w-[70ch] text-sm text-ink-muted">{note}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Gallery-only demo lease times. Fixed on purpose: render-time Date.now() is
 * rejected by Next as an unstable value, and the real product receives
 * expiresAt from the server. LEASE_LONG ≈ 90 minutes from the demo build
 * clock; LEASE_SHORT sits inside the "announces the last minute" window (and
 * will read "Lease ended" once that window passes — both are real states). */
const LEASE_LONG = "2026-10-11T02:26:00.000Z";
const LEASE_SHORT = "2026-10-11T00:57:10.000Z";

export default function ComponentGalleryPage() {
  return (
    <main className="mx-auto flex max-w-[1080px] flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <span className="text-xs text-ink-muted">Development only</span>
        <h1 className="font-display text-2xl">Component gallery</h1>
        <p className="max-w-[70ch] text-sm text-ink-muted">
          Shared components from AGENTS.md A7, rendered against the real tokens. This page
          is not part of the product and is not linked from the app.
        </p>
      </header>

      <Section title="Buttons" note="Primary, outline, secondary, ghost, destructive. 8px radius.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Fund job</Button>
          <Button variant="outline">Request revision</Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Reject</Button>
          <Button variant="link">Read the rubric</Button>
          <Button disabled>Claim task</Button>
        </div>
      </Section>

      <Section title="Form controls" note="Labels above, helper below, 8px controls, stronger edge.">
        <div className="grid max-w-[520px] gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="g-title">Job title</Label>
            <Input id="g-title" placeholder="Pick and place, kitchen set" />
            <p className="text-xs text-ink-muted">Shown to contributors before they claim.</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="g-rule">Testable rule</Label>
            <Textarea id="g-rule" placeholder="A box contains the whole object…" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="g-bad">Reward per task</Label>
            <Input id="g-bad" defaultValue="0" aria-invalid />
            <p className="text-xs text-[var(--rejected-ink)]">
              Reward must be greater than 0. Set a reward to continue.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="g-attest" />
            <Label htmlFor="g-attest">I have the right to share this data</Label>
          </div>
        </div>
      </Section>

      <Section title="Status" note="Icon and text always; colour never carries the meaning alone.">
        <div className="flex flex-wrap items-center gap-3">
          {STATES.map((s) => (
            <StatusPill key={s} state={s} />
          ))}
        </div>
      </Section>

      <Section title="StatusRail" note="Submitted, Accepted and Paid are separate stations.">
        <div className="grid max-w-[560px] gap-6">
          <StatusRail state="submitted" />
          <StatusRail state="accepted" />
          <StatusRail state="paid" />
          <StatusRail state="needs_revision" />
        </div>
      </Section>

      <Section title="Decision source" note="Every decision is marked by who made it.">
        <div className="flex flex-wrap items-center gap-6">
          <DecisionSource source="code" />
          <DecisionSource source="ai" />
          <DecisionSource source="human" />
          <DecisionSource source="adjudicated" />
        </div>
      </Section>

      <Section title="Rewards, hashes and transactions" note="Machine values use the mono stack, tabular.">
        <div className="grid max-w-[640px] gap-5">
          <div className="flex flex-wrap items-center gap-6">
            <RewardAmount amount={0.5} />
            <RewardAmount amount={2} />
            <RewardAmount amount={1234.5} />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <HashChip value={HASH} label="annotation hash" />
            <HashChip value={POLICY} label="policy hash" />
          </div>
          <div className="flex flex-col gap-3">
            <TxLink state="confirmed" txHash={TX} />
            <TxLink state="pending" />
            <TxLink state="waiting_wallet" />
            <TxLink state="failed" onRetry={() => {}} />
          </div>
        </div>
      </Section>

      <Section title="Lease timer" note="Announces the last minute in a live region.">
        <div className="flex items-center gap-6">
          <LeaseTimer expiresAt={LEASE_LONG} />
          <LeaseTimer expiresAt={LEASE_SHORT} />
        </div>
      </Section>

      <Section title="Confidence meter" note="Below the threshold, the item goes to a human.">
        <div className="grid max-w-[420px] gap-6">
          <ConfidenceMeter confidence={0.58} />
          <ConfidenceMeter confidence={0.91} />
        </div>
      </Section>

      <Section title="Reason code" note="Reviewers see the code; contributors read plain words.">
        <div className="flex flex-col gap-3">
          <ReasonCode code="BOX_LOOSE" />
          <ReasonCode code="SEGMENT_OVERLAP" />
        </div>
      </Section>

      <Section title="Receipt" note="The memorable moment: a chain-of-custody slip with notched edges.">
        <div className="grid gap-6 lg:grid-cols-2">
          <ReceiptCard receipt={MOCK_RECEIPT} />
          <ReceiptCard
            receipt={{ ...MOCK_RECEIPT, id: "rcpt_pending", txHash: undefined, txState: "pending" }}
          />
        </div>
      </Section>

      <Section title="Empty, error and loading">
        <div className="grid gap-4">
          <EmptyState
            icon={Inbox}
            title="No tasks match your filters"
            description="Clear filters or check back after the next job is published."
            action={<Button variant="outline" size="sm">Clear filters</Button>}
          />
          <ErrorState
            message="We could not load the queue. Check your connection and try again."
            onRetry={() => {}}
          />
          <TableSkeleton rows={4} cols={4} />
          <EmptyState
            icon={TriangleAlert}
            title="Not enough data yet"
            description="We do not show a rate until there are at least 20 audited samples."
          />
        </div>
      </Section>

      <Section
        title="Pipeline ledger"
        note="Four stations, each sized against the number that entered the funnel."
      >
        <PipelineLedger
          stages={[
            { key: "submitted", label: "Submitted", count: 286, color: "var(--ink-muted)" },
            { key: "review", label: "In review", count: 37, color: "var(--revision-ink)" },
            { key: "accepted", label: "Accepted", count: 214, color: "var(--accepted-ink)" },
            { key: "paid", label: "Paid", count: 198, color: "var(--paid-ink)" },
          ]}
          reference={286}
          note="Accepted work is only paid once the contributor claims the reward."
        />
      </Section>

      <Section title="Table toolbar" note="Search, filters, sorting and paging.">
        <div className="overflow-hidden rounded-[12px] border border-rule bg-sheet">
          <TableToolbar>
            <Input
              type="search"
              placeholder="Search jobs"
              aria-label="Search jobs"
              className="w-full sm:w-56"
            />
            <span className="text-xs text-ink-muted">2 of 9 jobs</span>
          </TableToolbar>
          <DataTable>
            <THead>
              <TR className="border-rule">
                <TH>Job</TH>
                <TH>Status</TH>
                <TH numeric>Budget</TH>
              </TR>
            </THead>
            <TBody>
              <TR className="hover:bg-wash">
                <TD>Pick and place, kitchen set</TD>
                <TD>Active</TD>
                <TD numeric>48.00 / 100.00</TD>
              </TR>
              <TR className="hover:bg-wash">
                <TD>Pen writing, kitchen set</TD>
                <TD>Active</TD>
                <TD numeric>22.00 / 60.00</TD>
              </TR>
            </TBody>
          </DataTable>
          <div className="flex justify-end border-t border-rule px-4 py-3">
            <TablePagination page={2} pageCount={5} onPage={() => {}} />
          </div>
        </div>
      </Section>

      <Section
        title="Key hints"
        note="Work tools teach shortcuts where the action lives, not in a manual."
      >
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm text-ink">
            Draw a box <KeyHint keys="B" /> then press <KeyHint keys={["⌘", "Z"]} /> to undo.
          </p>
          <KeyHintList
            hints={[
              { keys: "1–9", label: "class" },
              { keys: "Esc", label: "deselect" },
              { keys: "Del", label: "delete box" },
              { keys: ["⇧", "⌘", "Z"], label: "redo" },
            ]}
          />
        </div>
      </Section>
    </main>
  );
}
