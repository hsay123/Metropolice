"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReceiptCard } from "@/components/domain/receipt";
import { ErrorState } from "@/components/domain/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useReceipt } from "@/lib/api/hooks";
import { TEST_TOKEN_NOTE } from "@/lib/config";

/**
 * ReceiptView — the minimal, public receipt page. Anyone with the link can see
 * what was paid for, by whom (pseudonym only), under which policy version, and
 * the transaction. It states plainly what a hash does and does not prove
 * (AGENTS.md A6, DESIGN.md §4.9).
 */
export function ReceiptView({ receiptId }: { receiptId: string }) {
  const { data: receipt, isPending, isError, refetch } = useReceipt(receiptId);

  return (
    <main className="mx-auto w-full max-w-[720px] px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display text-sm font-semibold">
          PhysicalData Network
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Home
        </Link>
      </header>

      <div className="mt-10 flex flex-col gap-1">
        <h1 className="font-display text-2xl">Payout receipt</h1>
        <p className="max-w-[60ch] text-sm text-ink-muted">
          A public record of one accepted task and its payout. Raw media and the labels
          themselves stay private; only the hashes and the amount are shown.
        </p>
      </div>

      <div className="mt-6">
        {isPending && <ReceiptSkeleton />}
        {isError && (
          <ErrorState
            title="Receipt not found"
            message="No receipt matches that link. Check the link, or ask the contributor for the receipt from their earnings."
            onRetry={() => refetch()}
          />
        )}
        {receipt && (
          <ReceiptCard receipt={receipt} animate className="max-w-none" />
        )}
      </div>

      <section className="mt-8 flex flex-col gap-4">
        <div>
          <h2 className="font-display text-base">What this proves</h2>
          <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
            The record above was not changed after it was written: the annotation hash is a
            fingerprint of the submitted work, and the transaction is on Monad testnet.
          </p>
        </div>
        <div>
          <h2 className="font-display text-base">What this does not prove</h2>
          <p className="mt-1 max-w-[68ch] text-sm text-ink-muted">
            A hash shows a record was not changed, not that a label is correct. The acceptance
            was signed by the QA service within its policy and quorum. Wallets are not unique
            people. {TEST_TOKEN_NOTE}
          </p>
        </div>
      </section>
    </main>
  );
}

function ReceiptSkeleton() {
  return (
    <div className="w-full max-w-[420px] rounded-[12px] border border-rule bg-sheet p-5" aria-busy>
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[110px_1fr] gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
