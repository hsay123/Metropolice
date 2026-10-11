"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Lock, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { PhotoSlot } from "@/components/ui/primitives";
import { ReceiptCard } from "@/components/domain/receipt";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/domain/table";
import { labelInk, ACTION_LABELS, labelColor } from "@/lib/labels";
import { ENABLED_INTEGRATIONS } from "@/lib/integrations";
import { TEST_TOKEN_NOTE } from "@/lib/config";
import type { ActionLabel, Receipt as ReceiptData } from "@/lib/api/types";

/**
 * / — the landing page, rebuilt to docs/moodboard/tiles/pd_hero.png.
 *
 * Content follows the replacement table in docs/MOODBOARD-SPEC.md §5: no invented
 * statistics, no customer logos, money shown in test tokens. Imagery that has not
 * been delivered renders as a captioned "Illustrative image" slot.
 */

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

/** The floating chips around the hero photo. Names of annotations, not claims. */
const HERO_CHIPS = [
  "Pick up the object",
  "Object detection",
  "Action segmentation",
  "Bounding box",
  "Failure annotation",
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
  amount: 0.5,
  token: "test USDC",
  txState: "confirmed",
  txHash: "0x9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d6f8a0c2e4b7d9f1a3c5e7b0d2f4a6c8e",
  issuedAt: new Date(0).toISOString(),
  mock: true,
};

/** Product facts, not invented metrics. Four, with dividers, as on the board. */
const STATS = [
  { value: "6", label: "review layers" },
  { value: "1", label: "receipt per payout" },
  { value: "0", label: "raw files onchain" },
  { value: "Testnet", label: "rewards have no value" },
];

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-3 focus:z-50 focus:rounded-[10px] focus:border focus:border-[var(--border-field)] focus:bg-white focus:px-3 focus:py-1.5 focus:text-[14px]"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <Hero />
        <PaidRail />
        <DarkNetworkSection />
        <ChecksSection />
        <DoesNotProve />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}

/* -------------------------------------------------------------------- header */

const NAV_LINKS = [
  { href: "#how-it-works", label: "Product" },
  { href: "#for-companies", label: "For companies" },
  { href: "#how-checks-work", label: "How checks work" },
];

function LandingNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-4 px-5 sm:gap-8 sm:px-8">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[14px] font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="black">
            <Link href="/login">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------------- hero */

function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 90% at 12% 0%, #FFFFFF 0%, var(--bg) 46%, var(--primary-tint) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[1280px] px-8 pt-20 pb-24">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center rounded-[8px] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-[var(--fg-muted)] uppercase">
              Building the data layer for physical AI
            </span>

            <h1 className="mt-6 max-w-[15ch] text-[length:var(--t-hero)] leading-[1.05] font-bold tracking-[-0.025em]">
              Robot footage, labelled and checked. You pay only for work that passes review.
            </h1>

            <p className="mt-6 max-w-[46ch] text-[18px] leading-[1.55] text-[var(--fg-muted)]">
              Contributors label your clips, reviewers check them against the rubric, and every
              payout carries a receipt you can verify on Monad.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild variant="black">
                <Link href="/login">
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/buyer">
                  <Play className="size-4" />
                  Watch demo
                </Link>
              </Button>
            </div>
          </div>

          <HeroVisual />
        </div>

        {/* Product facts and the integration row span the full hero, as on the board. */}
        <dl className="mt-20 grid grid-cols-2 gap-y-8 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col gap-1.5 ${i > 0 ? "sm:border-l sm:border-[var(--border)] sm:pl-8" : ""}`}
            >
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-[32px] leading-none font-bold tabular-nums">{s.value}</dd>
              <dd className="text-[13px] text-[var(--fg-muted)]">{s.label}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-14">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--fg-subtle)] uppercase">
            Built with
          </p>
          <ul className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-3">
            {ENABLED_INTEGRATIONS.map((i) => (
              <li key={i.id} className="flex items-baseline gap-2">
                <span className="text-[16px] font-semibold text-[var(--fg)]">{i.name}</span>
                <span className="text-[12px] text-[var(--fg-subtle)]">{i.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** The hero photo with floating annotation chips, as on the board. */
function HeroVisual() {
  return (
    <div className="relative">
      <PhotoSlot
        src="/images/hero-robot-arm.webp"
        alt="A robotic arm picking up an object on a workbench"
        className="aspect-4/3 w-full"
      />

      {/* Chips sit inside the photo frame so they stay attached to the image. */}
      <ul className="pointer-events-none absolute inset-0">
        {HERO_CHIPS.map((chip, i) => (
          <li
            key={chip}
            className="absolute flex items-center gap-2 rounded-[10px] bg-white/92 px-3 py-2 shadow-[var(--elev-float)] backdrop-blur-md"
            style={{
              top: `${10 + i * 18}%`,
              right: i % 2 === 0 ? "3%" : "14%",
            }}
          >
            <span className="size-2 rotate-45 rounded-[2px] bg-[var(--primary)]" aria-hidden />
            <span className="text-[12px] font-semibold text-[var(--fg)]">{chip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The live dope-sheet timeline and an example receipt. Both are real product
 * surfaces, so they sit beside the payment sequence rather than crowding the
 * hero, which the board keeps to the photo and its chips.
 */
function ProductPreview() {
  const [active, setActive] = React.useState<HeroSegment | null>(null);
  const playheadMs = 4_400;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[16px] border border-[var(--border)] bg-white p-5 shadow-[var(--elev-card)]">
        <div className="flex items-center justify-between">
          <span className="machine text-[12px] text-[var(--fg-muted)]">pen_writing_012</span>
          <span className="machine text-[12px] tabular-nums text-[var(--fg-muted)]">
            00:00:04:12
          </span>
        </div>

        <div data-ui="timeline-bar" className="relative mt-4 h-3 rounded-[6px] bg-[var(--surface-2)]">
          {HERO_SEGMENTS.map((seg) => (
            <button
              key={seg.label}
              type="button"
              onMouseEnter={() => setActive(seg)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(seg)}
              onBlur={() => setActive(null)}
              title={`${seg.label}, ${(seg.start / 1000).toFixed(1)}s to ${(seg.end / 1000).toFixed(1)}s`}
              aria-label={`${seg.label} from ${(seg.start / 1000).toFixed(1)} to ${(seg.end / 1000).toFixed(1)} seconds`}
              className="absolute top-0 bottom-0 overflow-hidden rounded-[6px] px-2 text-left text-[11px] font-semibold transition-[filter] hover:brightness-110"
              style={{
                left: `${(seg.start / HERO_MS) * 100}%`,
                width: `${((seg.end - seg.start) / HERO_MS) * 100}%`,
                minWidth: 4,
                background: labelColor(seg.label, ACTION_LABELS.indexOf(seg.label)),
                color: labelInk(seg.label, ACTION_LABELS.indexOf(seg.label)),
              }}
            >
              <span className="relative truncate">{seg.label}</span>
            </button>
          ))}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-1 -bottom-1 z-10 w-[2px] bg-[var(--primary)]"
            style={{ left: `${(playheadMs / HERO_MS) * 100}%` }}
          />
        </div>

        <p aria-live="polite" className="mt-3 min-h-5 text-[12px] text-[var(--fg-muted)]">
          {active
            ? `${active.label} on the ${active.object}, ${(active.start / 1000).toFixed(1)}s to ${(active.end / 1000).toFixed(1)}s`
            : "Hover a segment to see its label, object and times."}
        </p>
      </div>

      <div className="relative w-fit">
        <span className="absolute -top-3 left-4 z-10 rounded-[8px] border border-[var(--border)] bg-white px-2 py-0.5 text-[11px] text-[var(--fg-muted)]">
          Example receipt
        </span>
        <ReceiptCard receipt={EXAMPLE_RECEIPT} animate={false} className="max-w-[420px]" />
      </div>
    </div>
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
    <section id="how-it-works" className="scroll-mt-16 border-t border-[var(--border)] bg-white">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-start gap-14 px-8 py-24 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <h2 className="text-[40px] leading-[1.1]">How a label gets paid</h2>
          <p className="mt-3 max-w-[52ch] text-[16px] text-[var(--fg-muted)]">
            A real sequence, so the stations are numbered. Rejected or revise-needed work loops back
            with a plain-language reason and is never paid.
          </p>
          <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {STATIONS.map((s, i) => (
              <li key={s.label}>
                <Card className="h-full p-5">
                  <span className="font-display text-[13px] font-semibold tabular-nums text-[var(--primary)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-2 block font-display text-[18px] font-bold">{s.label}</span>
                  <span className="mt-1.5 block text-[14px] text-[var(--fg-muted)]">{s.copy}</span>
                </Card>
              </li>
            ))}
          </ol>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- dark network */

const DOMAINS = [
  { name: "Robot manipulation", file: "domain-manipulation.webp" },
  { name: "Warehouse and logistics", file: "domain-warehouse.webp" },
  { name: "Kitchen and household", file: "domain-kitchen.webp" },
  { name: "Inspection", file: "domain-inspection.webp" },
];

function DarkNetworkSection() {
  return (
    <section className="dot-matrix relative overflow-hidden bg-[var(--dark)]">
      <div className="mx-auto w-full max-w-[1280px] px-8 py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="max-w-[16ch] text-[40px] leading-[1.1] text-white">
              Built for the data robots learn from.
            </h2>
            <ul className="mt-8 border-l border-white/15 pl-5">
              {DOMAINS.map((d) => (
                <li key={d.name} className="py-2 text-[18px] text-[var(--dark-muted)]">
                  {d.name}
                </li>
              ))}
              <li className="py-2 text-[18px] text-[var(--dark-muted)]">and more</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-5 self-center">
            {DOMAINS.map((d) => (
              <PhotoSlot
                key={d.file}
                src={`/images/${d.file}`}
                alt={d.name}
                caption={d.name}
                className="aspect-3/2 w-full"
              />
            ))}
          </div>
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/login"
            aria-label="Get started"
            className="grid size-12 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
          >
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
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
    copy: "Hidden items with known answers, scored by box overlap or segment time and label match.",
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
    <section id="how-checks-work" className="scroll-mt-16 border-t border-[var(--border)]">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-16 px-8 py-24 lg:grid-cols-2">
        <div>
          <h2 className="text-[40px] leading-[1.1]">How checks work</h2>
          <p className="mt-3 max-w-[52ch] text-[16px] text-[var(--fg-muted)]">
            Six layers, in order. Each one is a filter, and each one marks its decision so the buyer
            can see how a label was decided.
          </p>
          <ol className="mt-8 flex flex-col">
            {LAYERS.map((layer, i) => (
              <li key={layer.name} className="flex gap-5 border-b border-[var(--border)] py-5 last:border-0">
                <span className="font-display shrink-0 text-[13px] font-semibold tabular-nums text-[var(--primary)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex flex-col gap-1">
                  <span className="font-semibold">{layer.name}</span>
                  <span className="max-w-[52ch] text-[14px] text-[var(--fg-muted)]">{layer.copy}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="text-[24px] leading-[1.33]">What goes onchain, what stays private</h3>
          <p className="mt-2 max-w-[46ch] text-[16px] text-[var(--fg-muted)]">
            Money and receipts live on Monad. Media, labels and profiles never leave the private
            store.
          </p>
          <div className="mt-8 overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
            <DataTable>
              <THead>
                <TR className="border-[var(--border)]">
                  <TH>Onchain</TH>
                  <TH>Private</TH>
                </TR>
              </THead>
              <TBody>
                {ONCHAIN.map((o, i) => (
                  <TR key={o}>
                    <TD className="align-top text-[14px]">{o}</TD>
                    <TD className="align-top text-[14px] text-[var(--fg-muted)]">{PRIVATE[i]}</TD>
                  </TR>
                ))}
              </TBody>
            </DataTable>
          </div>
          <p className="mt-4 flex items-start gap-2 text-[14px] text-[var(--fg-muted)]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            No raw media, personal data or full label ever enters a transaction or an event.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ honesty */

const LIMITS = [
  "A hash shows a record was not changed. It does not show a label is correct.",
  "Wallets are not unique people.",
  "Acceptance is signed by our QA service, limited by its policy and quorum.",
  "AI review reduces human work. It is not a perfect judge, and video still needs people.",
  "Rewards in this build are test tokens with no value.",
];

function DoesNotProve() {
  return (
    <section className="border-t border-[var(--border)] bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-8 py-24">
        <div className="flex items-center gap-3">
          <Lock className="size-5 text-[var(--fg-muted)]" aria-hidden />
          <h2 className="text-[40px] leading-[1.1]">What this does not prove</h2>
        </div>
        <ul className="mt-8 grid grid-cols-1 gap-x-12 gap-y-4 md:grid-cols-2">
          {LIMITS.map((p) => (
            <li key={p} className="flex items-start gap-3 text-[16px] text-[var(--fg-muted)]">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
              <span className="max-w-[56ch]">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- final CTA */

function FinalCta() {
  return (
    <section id="for-companies" className="border-t border-[var(--border)]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-8 px-8 py-24 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[52ch]">
          <h2 className="text-[40px] leading-[1.1]">Post a job, or take one and get paid</h2>
          <p className="mt-3 text-[16px] text-[var(--fg-muted)]">
            Buyers fund a budget and only pay for labels that pass review. Contributors see the
            reward and the rubric before they claim. Everything settles on Monad testnet.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Button asChild variant="black">
            <Link href="/login">
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/work">Join as a contributor</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- footer */

function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-white">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-8 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <span className="text-[12px] text-[var(--fg-muted)]">{TEST_TOKEN_NOTE}</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-[14px] text-[var(--fg-muted)]">
          <Link href="/login" className="hover:text-[var(--fg)]">
            Sign in
          </Link>
          <Link href="/receipts/rcpt_91" className="hover:text-[var(--fg)]">
            Example receipt
          </Link>
        </div>
      </div>
    </footer>
  );
}