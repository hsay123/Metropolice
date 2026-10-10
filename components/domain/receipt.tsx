"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { BadgeCheck, Printer } from "lucide-react";
import type { Receipt as ReceiptData } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { DecisionSource } from "@/components/domain/decision-source";
import { HashChip, TxLink } from "@/components/domain/machine";
import { StatusPill } from "@/components/domain/status";
import { hashPayload } from "@/lib/hash";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

type VerifyState = "idle" | "checking" | "match" | "mismatch" | "mock";

/**
 * Receipt — the one place we spend boldness. A chain-of-custody slip with notched
 * edges (CSS mask). It carries real information: the annotation hash, the policy
 * version, the reviewer type and the transaction. The print slide-out plays once.
 */
export function ReceiptCard({
  receipt,
  animate = true,
  className,
}: {
  receipt: ReceiptData;
  animate?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [verify, setVerify] = React.useState<VerifyState>("idle");

  function onVerify() {
    if (receipt.mock) {
      setVerify("mock");
      return;
    }
    setVerify("checking");
    // Recompute the canonical-record hash and compare with the one shown.
    const recomputed = hashPayload({
      taskId: receipt.taskId,
      jobTitle: receipt.jobTitle,
      contributorPseudonym: receipt.contributorPseudonym,
      policyHash: receipt.policyHash,
      policyVersion: receipt.policyVersion,
      reviewerType: receipt.reviewerType,
      amount: receipt.amount,
      token: receipt.token,
    });
    setVerify(
      recomputed.toLowerCase() === receipt.annotationHash.toLowerCase() ? "match" : "mismatch",
    );
  }

  return (
    <motion.article
      aria-label="Payout receipt"
      initial={
        reduce || !animate ? false : { opacity: 0, y: -10, clipPath: "inset(0 0 88% 0)" }
      }
      animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "receipt-notches w-full max-w-[420px] bg-sheet px-5 py-6 text-ink",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-xl leading-none">Receipt</h3>
          {receipt.mock && (
            <span className="text-xs text-[var(--revision-ink)]">Mock receipt</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusPill state={receipt.txState === "confirmed" ? "paid" : "accepted"} />
          <span className="font-display text-xl font-semibold tabular-nums">
            {formatAmount(receipt.amount)}{" "}
            <span className="text-sm font-normal text-ink-muted">{receipt.token}</span>
          </span>
        </div>
      </header>

      <dl className="mt-5 flex flex-col gap-2.5 text-sm">
        <Row label="Task">
          <span className="machine text-xs">{receipt.taskId}</span>
        </Row>
        <Row label="Job">{receipt.jobTitle}</Row>
        <Row label="Contributor">
          <span className="inline-flex items-center gap-2">
            {receipt.contributorPseudonym}
            <span className="text-xs text-ink-muted">pseudonym</span>
          </span>
        </Row>
        <Row label="Decided by">
          <DecisionSource source={receipt.reviewerType} />
        </Row>
        <Row label="Review policy">
          <span className="inline-flex items-center gap-2">
            <span className="text-xs text-ink-muted">v{receipt.policyVersion}</span>
            <HashChip value={receipt.policyHash} label="policy hash" />
          </span>
        </Row>
        <Row label="Annotation hash">
          <HashChip value={receipt.annotationHash} label="annotation hash" />
        </Row>
        <Row label="Transaction">
          <TxLink txHash={receipt.txHash} state={receipt.txState} />
        </Row>
      </dl>

      <div className="my-5 border-t border-dashed border-[var(--field-edge)]" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onVerify}>
            <BadgeCheck aria-hidden />
            Verify hashes
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="text-ink-muted"
          >
            <Printer aria-hidden />
            Print
          </Button>
        </div>
        <p aria-live="polite" className="text-xs text-ink-muted">
          {verify === "idle" &&
            "A hash shows this record was not changed. It does not show the label is correct."}
          {verify === "checking" && "Checking the record against the hash shown."}
          {verify === "match" && "The record matches the hash shown."}
          {verify === "mismatch" && "The record does not match the hash shown. Do not rely on it."}
          {verify === "mock" &&
            "Mock receipt. The hashes are illustrative and cannot be verified without the backend."}
        </p>
      </div>
    </motion.article>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-3">
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
