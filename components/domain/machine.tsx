"use client";

import * as React from "react";
import { ExternalLink, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/common/copy-button";
import { shortHash, formatAmount } from "@/lib/format";
import { EXPLORER_LABEL, MONAD_TESTNET } from "@/lib/config";
import type { TxState } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** RewardAmount — the amount is a number that matters, so it is set in Bricolage. */
export function RewardAmount({
  amount,
  token = "test USDC",
  className,
}: {
  amount: number;
  token?:string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-1", className)}>
      <span className="font-display text-base font-semibold tabular-nums text-ink">
        {formatAmount(amount)}
      </span>
      <span className="text-xs text-ink-muted">{token}</span>
    </span>
  );
}

/**
 * HashChip — shortened hash, copy button, and the full value on focus (title plus
 * selectable text). Machine values use the mono stack, tabular.
 */
export function HashChip({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span
        tabIndex={0}
        title={value}
        aria-label={label ? `${label}: ${value}` : value}
        className="machine inline-flex min-h-6 items-center rounded-[2px] bg-wash px-1.5 text-xs text-ink"
      >
        {shortHash(value)}
      </span>
      <CopyButton value={value} label={label ? `Copy ${label}` : "Copy value"} />
    </span>
  );
}

/**
 * TxLink — never fake success. Pending shows a spinner and "Waiting for
 * confirmation". Failed shows the error and a retry. Only confirmed shows a real
 * hash and an explorer link (AGENTS.md A6).
 */
export function TxLink({
  txHash,
  state,
  onRetry,
  className,
}: {
  txHash?: string;
  state: TxState;
  onRetry?: () => void;
  className?: string;
}) {
  if (state === "idle") return null;

  if (state === "pending" || state === "waiting_wallet") {
    return (
      <span
        role="status"
        className={cn("inline-flex items-center gap-1.5 text-xs text-ink-muted", className)}
      >
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        {state === "waiting_wallet" ? "Waiting for your wallet" : "Waiting for confirmation"}
      </span>
    );
  }

  if (state === "failed") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <span role="alert" className="inline-flex items-center gap-1.5 text-xs text-[var(--rejected-ink)]">
          <TriangleAlert className="size-3.5" aria-hidden />
          Transaction failed. Nothing was paid.
        </span>
        {onRetry && (
          <Button type="button" variant="outline" size="xs" onClick={onRetry}>
            Try again
          </Button>
        )}
      </span>
    );
  }

  // confirmed — requires a real hash
  if (!txHash) {
    return (
      <span role="status" className="text-xs text-ink-muted">
        Confirmed. No transaction hash available.
      </span>
    );
  }

  return (
    <a
      href={MONAD_TESTNET.explorerTx(txHash)}
      target="_blank"
      rel="noreferrer"
      title={`${EXPLORER_LABEL}: ${txHash}`}
      className={cn("machine inline-flex min-h-6 -my-0.5 items-center gap-1 text-xs text-primary hover:underline", className)}
    >
      {shortHash(txHash)}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}
