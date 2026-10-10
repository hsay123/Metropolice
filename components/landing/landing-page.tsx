"use client";

import * as React from "react";
import Link from "next/link";
import { Database, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptCard } from "@/components/domain/receipt";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/domain/table";
import { labelColor, ACTION_LABELS } from "@/lib/labels";
import { TEST_TOKEN_NOTE } from "@/lib/config";
import type { ActionLabel, Receipt as ReceiptData } from "@/lib/api/types";

/* ------------------------------------------------------------------ hero data */

const HERO_MS = 12_000;

type HeroSegment = { label: ActionLabel; start: number; end: number; object: string };

/** The example clip's segments. Sequential, in order, inside the 12-second clip. */
const HERO_SEGMENTS: HeroSegment[] = [
  { label: "reach", start: 0, end: 1_200, object: "pen" },
  { label: "grasp", start: 1_200, end: 3_400, object: "pen" },
  { label: "lift", start: 3_400, end: 4_000, object: "pen" },
  { label: "write", start: 4_000, end: 11_000, object: "notebook" },
  { label: "place", start: 11_000, end: 12_000, object: "pen" },
];

/** A fixed, honest example receipt. It says "Mock receipt" and never fakes a hash. */
const EXAMPLE_RECEIPT: ReceiptData = {
  id: "rcpt_example",
  taskId: "task_01Hd9",
  jobTitle: "Pen writing, kitchen set",
  contributorPseudonym: "Contributor 4F2A",
  annotationHash: "0x3c6f9b2d5e8a1bc8a1f30d9e4b7c6a2f5d8b1e4c7a0f3d6b9e2c5a8f1b4d7e0a",
  policyHash: "0x2b8e4a1c7d9f3b6e0a5c8d2f4b7e9a1c3d6f8b0e2a5c7d9f1b4e6a8c0d3f5b7e",
  policyVersion: 3,
  reviewerType: "human",
  amount: 2,
  token: "test USDC",
  txState: "confirmed",
  txHash: "0x9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d6f8a0c2e4b7d9f1a3c5e7b0d2f4a6c8e",
  issuedAt: new Date(0).toISOString(),
  mock: true,
};

/**
 * / — the landing page. The hero shows the real thing: a live twelve-second
 * timeline in the dope-sheet style and the actual receipt component with example
 * data. It replaces the stock headline-plus-stat-block hero (DESIGN.md §4.1, §8).
 */
export function LandingPage() {
  return (
    <div className="min-h-dvh bg-bench">
      <LandingHeader />
      <main className="mx-auto w-full max-w-[1280px] px-6">
        <Hero />
        <PaidRail />
        <ChecksSection />
        <DoesNotProve />
      </main>
      <LandingFooter />
    </div>
  );
}

/* -------------------------------------------------------------------- header */

function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-bench/85 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-[1280px] items-center gap-6 px-6">
        <Link href="/" className="font-display text-sm font-semibold">
          PhysicalData Network
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-ink-muted md:flex">
          <a href="#for-buyers" className="hover:text-ink">
            For buyers
          </a>
          <a href="#for-contributors" className="hover:text-ink">
            For contributors
          </a>
          <a href="#how-checks-work" className="hover:text-ink">
            How checks work
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 text-xs text-ink-muted sm:inline-flex">
            <Database className="size-3" aria-hidden />
            Monad testnet
          </span>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------------- hero */

function Hero() {
  return (
    <section className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:gap-16 lg:py-16">
      <div className="flex max-w-[46ch] flex-col items-start scroll-mt-16" id="for-buyers">
        <h1 className="font-display text-2xl leading-[1.06] tracking-[-0.01em] text-ink">
          Labelled robot footage you only pay for once it passes review.
        </h1>
        <p className="mt-5 text-base leading-relaxed text-ink-muted">
          Qualified contributors label your clips, reviewers check them, and every payout comes
          with a receipt you can verify on Monad.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/buyer/jobs/new">Post a labelling job</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/work">Join the contributor cohort</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-ink-muted">
          Footage and labels stay in private storage. Only hashes and amounts go onchain.
        </p>
        <p className="mt-1 text-sm text-ink-muted">{TEST_TOKEN_NOTE}</p>
      </div>

      <div className="flex flex-col gap-5">
        <HeroClip />
        <div className="relative w-fit">
          <span className="absolute -top-2.5 left-4 z-10 rounded-full border border-rule bg-bench px-2 py-0.5 text-xs text-ink-muted">
            Example receipt
          </span>
          <ReceiptCard receipt={EXAMPLE_RECEIPT} animate={false} className="max-w-[420px]" />
        </div>
      </div>
    </section>
  );
}

function HeroClip() {
  const [active, setActive] = React.useState<HeroSegment | null>(null);
  const playheadMs = 4_400;

  return (
    <figure className="overflow-hidden rounded-[6px] border border-rule bg-sheet">
      <figcaption className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <span className="machine text-xs text-ink-muted">pen_writing_012</span>
        <span className="machine text-xs tabular-nums text-ink-muted">00:00:04:12</span>
      </figcaption>

      {/* the dark stage is the only dark surface: media is judged best on a neutral */}
      <div
        role="img"
        aria-label="A hand writing with a pen in a notebook, from the demo clip"
        className="h-40 w-full bg-stage bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/media/pen-writing-poster.svg)" }}
      />

      <div className="border-t border-rule p-4">
        <div className="relative">
          {/* ruler */}
          <div className="mb-1 flex justify-between text-xs text-ink-muted">
            {[0, 3, 6, 9, 12].map((s) => (
              <span key={s} className="machine tabular-nums">
                {s}.0s
              </span>
            ))}
          </div>

          {/* single dope-sheet track */}
          <div className="relative h-9 rounded-[2px] bg-wash">
            {HERO_SEGMENTS.map((seg) => {
              const left = (seg.start / HERO_MS) * 100;
              const width = ((seg.end - seg.start) / HERO_MS) * 100;
              return (
                <button
                  key={seg.label}
                  type="button"
                  onMouseEnter={() => setActive(seg)}
                  onFocus={() => setActive(seg)}
                  onMouseLeave={() => setActive(null)}
                  onBlur={() => setActive(null)}
                  title={`${seg.label}: ${(seg.start / 1000).toFixed(1)}s to ${(seg.end / 1000).toFixed(1)}s`}
                  aria-label={`${seg.label} from ${(seg.start / 1000).toFixed(1)} to ${(seg.end / 1000).toFixed(1)} seconds`}
                  className="absolute top-1 bottom-1 flex items-center overflow-hidden rounded-[2px] px-2 text-left text-xs font-medium text-white transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    minWidth: 4,
                    background: labelColor(seg.label, ACTION_LABELS.indexOf(seg.label)),
                  }}
                >
                  <span className="relative truncate">{seg.label}</span>
                </button>
              );
            })}

            {/* playhead */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-1 -bottom-1 z-10 w-px bg-ink"
              style={{ left: `${(playheadMs / HERO_MS) * 100}%` }}
            >
              <span className="absolute -left-[4px] top-0 size-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-ink" />
            </div>
          </div>
        </div>

        <p aria-live="polite" className="mt-2 min-h-[1rem] text-xs text-ink-muted">
          {active
            ? `${active.label} on the ${active.object}, ${(active.start / 1000).toFixed(1)}s to ${(active.end / 1000).toFixed(1)}s`
            : "Hover a segment to see its label, object and times."}
        </p>
      </div>
    </figure>
  );
}

/* ---------------------------------------------------------------- paid rail */

const STATIONS = [
  { label: "Funded", copy: "The buyer funds the job. The budget sits in escrow on Monad." },
  { label: "Labelled", copy: "A contributor claims a task and labels the image or video." },
  { label: "Checked", copy: "Automatic checks, gold tasks and reviewers decide pass or fix." },
  { label: "Receipted", copy: "Accepted work gets a receipt with its hash and policy version." },
  { label: "Paid", copy: "The contributor claims the reward. The payout is on Monad." },
];

function PaidRail() {
  return (
    <section id="for-contributors" className="scroll-mt-16 border-t border-rule py-12">
      <h2 className="font-display text-xl text-ink">How a label gets paid</h2>
      <p className="mt-1 max-w-[60ch] text-sm text-ink-muted">
        A real sequence, so the stations are numbered. Rejected or revise-needed work loops back
        with a reason and is never paid.
      </p>
      <ol className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-[6px] border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-5">
        {STATIONS.map((s, i) => (
          <li key={s.label} className="flex flex-col gap-2 bg-sheet px-4 py-4">
            <span className="font-display text-sm text-ink-muted tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-base text-ink">{s.label}</span>
            <span className="text-sm text-ink-muted">{s.copy}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* --------------------------------------------------------------- checks work */

const LAYERS = [
  {
    name: "Automatic checks",
    copy: "End before start, times outside the clip, overlaps and boxes outside the image are rejected instantly with a reason.",
  },
  {
    name: "Gold tasks",
    copy: "Hidden items with known answers, scored by box overlap (IoU) or segment time and label match.",
  },
  {
    name: "Overlap sampling",
    copy: "Some items go to two or three contributors. Agreement raises confidence; disagreement goes to a reviewer.",
  },
  {
    name: "First-pass review",
    copy: "Kimi reviews image submissions against the rubric. Video goes straight to the human queue.",
  },
  {
    name: "Risk-based human review",
    copy: "Low-confidence, first-time, unusually fast, or gold-task failures come first.",
  },
  {
    name: "Random audits",
    copy: "A random sample of accepted work, including AI-decided work, is re-checked by a person.",
  },
];

const ONCHAIN = [
  "Job ID, buyer address, budget, policy hash and status",
  "Escrowed funds and the amounts paid",
  "Hash of each accepted task, the contributor and the policy version",
  "Payout claimable and claimed events, and the pause state",
];

const PRIVATE = [
  "Raw images and video",
  "Full labels and reviewer notes",
  "Task instructions, schemas and QA output",
  "Contributor profiles, appeals, and consent records",
];

function ChecksSection() {
  return (
    <section id="how-checks-work" className="scroll-mt-16 border-t border-rule py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <h2 className="font-display text-xl text-ink">How checks work</h2>
          <p className="mt-1 max-w-[60ch] text-sm text-ink-muted">
            Six layers, in order. Each one is a filter, and each one marks its decision so the
            buyer can see how a label was decided.
          </p>
          <ol className="mt-6 flex flex-col">
            {LAYERS.map((layer, i) => (
              <li key={layer.name} className="flex gap-4 border-b border-rule py-4 last:border-0">
                <span className="font-display text-sm text-ink-muted tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium text-ink">{layer.name}</span>
                  <span className="max-w-[54ch] text-sm text-ink-muted">{layer.copy}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="font-display text-base text-ink">Onchain or private</h3>
          <p className="mt-1 max-w-[52ch] text-sm text-ink-muted">
            Money and receipts live on Monad. Media, labels and profiles never leave the private
            store.
          </p>
          <div className="mt-6 overflow-hidden rounded-[6px] border border-rule">
            <DataTable>
              <THead>
                <TR className="border-rule">
                  <TH>Onchain</TH>
                  <TH>Private</TH>
                </TR>
              </THead>
              <TBody>
                {[0, 1, 2, 3].map((i) => (
                  <TR key={i}>
                    <TD className="align-top text-sm">{ONCHAIN[i]}</TD>
                    <TD className="align-top text-sm text-ink-muted">{PRIVATE[i]}</TD>
                  </TR>
                ))}
              </TBody>
            </DataTable>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-sm text-ink-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            No raw media, personal data or full label ever enters a transaction or an event.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ honesty */

function DoesNotProve() {
  const points = [
    "A hash shows a record was not changed. It does not show a label is correct.",
    "Wallets are not unique people.",
    "Acceptance is signed by our QA service, limited by its policy and quorum.",
    "AI review reduces human work. It is not a perfect judge, and video still needs people.",
  ];
  return (
    <section className="border-t border-rule py-12">
      <div className="flex items-center gap-2">
        <Lock className="size-4 text-ink-muted" aria-hidden />
        <h2 className="font-display text-xl text-ink">What this does not prove</h2>
      </div>
      <ul className="mt-5 grid grid-cols-1 gap-x-10 gap-y-3 md:grid-cols-2">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-ink-muted">
            <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-ink-muted" />
            <span className="max-w-[60ch]">{p}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------- footer */

function LandingFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-display text-sm font-semibold">PhysicalData Network</span>
          <span className="text-xs text-ink-muted">{TEST_TOKEN_NOTE}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-ink-muted">
          <Link href="/login" className="hover:text-ink">
            Sign in
          </Link>
          <Link href="/receipts/rcpt_91" className="hover:text-ink">
            Example receipt
          </Link>
        </div>
      </div>
    </footer>
  );
}
