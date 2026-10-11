import Link from "next/link";
import { Boxes, Clock, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/domain/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { BoxOverlay } from "@/components/workbench/box-overlay";
import { TEST_TOKEN_NOTE } from "@/lib/config";
import type { Box } from "@/lib/api/types";

/**
 * /work — contributor onboarding. What the work is, how pay works, the privacy
 * stance and a read-only sample, then the qualification check. Server component;
 * the only interactive part is the link to /work/qualify.
 */

const SAMPLE_CLASSES = ["cup", "pen", "red_block"];

const SAMPLE_BOXES: Box[] = [
  { id: "s1", x: 214, y: 168, w: 188, h: 214, class: "cup", confidence: 4 },
  { id: "s2", x: 520, y: 402, w: 176, h: 88, class: "pen", confidence: 5 },
];

const STEPS = [
  {
    Icon: Boxes,
    title: "Label one item",
    body: "Draw a box around each listed object, or mark each action on a video timeline. One task is one item.",
  },
  {
    Icon: ShieldCheck,
    title: "A reviewer checks it",
    body: "An AI pass and a human reviewer check your work against the rubric. Only work that passes is paid.",
  },
  {
    Icon: Wallet,
    title: "Claim the reward",
    body: "Accepted tasks become claimable. Claiming leaves a receipt with the amount and a transaction on Monad.",
  },
];

export default function Onboarding() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        context="Contributor"
        title="Onboarding"
        description="What the work is, how you are paid and how your data is handled. Then a short check before you start."
        actions={
          <Button asChild>
            <Link href="/work/qualify">
              Start qualification
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader
              title="What you will do"
              description="Labelling robot footage: images get boxes, video gets action segments."
            />
            <PanelBody>
              <ol className="flex flex-col gap-4">
                {STEPS.map(({ Icon, title, body }) => (
                  <li key={title} className="flex gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[8px] bg-[var(--surface-2)] text-[var(--fg-muted)]">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--fg)]">{title}</p>
                      <p className="mt-0.5 max-w-[70ch] text-sm text-[var(--fg-muted)]">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Sample task"
              description="This is an image task. The cup and the pen are boxed; each box carries a class and a confidence from 1 to 5."
            />
            <PanelBody className="pb-5">
              <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-[12px] bg-stage p-3">
                <div
                  className="relative w-full"
                  style={{ aspectRatio: `${1280} / ${960}` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/media/table-scene.svg"
                    alt="A table with a cup and a pen. Two boxes show the expected labels."
                    className="absolute inset-0 size-full rounded-[8px] object-cover"
                  />
                  <BoxOverlay
                    boxes={SAMPLE_BOXES}
                    imageWidth={1280}
                    imageHeight={960}
                    classes={SAMPLE_CLASSES}
                  />
                </div>
              </div>
              <p className="mt-2 text-[12px] text-[var(--fg-subtle)]">Illustrative image</p>
              <div className="mt-4">
                <p className="text-xs text-[var(--fg-muted)]">Rubric</p>
                <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm text-[var(--fg)]">
                  <li>A box contains the whole object with at most 5 px of slack on any edge.</li>
                  <li>The class matches the object: a cup is a cup, a pen is a pen.</li>
                  <li>Boxes do not overlap each other unless the objects really overlap.</li>
                </ul>
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title="How pay works" />
            <PanelBody className="flex flex-col gap-3 text-sm text-[var(--fg)]">
              <p>
                The reward and the rubric are shown <span className="font-medium">before</span> you
                claim a task. You are paid for accepted work only.
              </p>
              <p className="text-[var(--fg-muted)]">
                A rejected task gives a plain reason and a chance to appeal. A revision request says
                exactly what to fix.
              </p>
              <p className="border-t border-[var(--border)] pt-3 text-xs text-[var(--fg-muted)]">{TEST_TOKEN_NOTE}</p>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Privacy" />
            <PanelBody className="flex flex-col gap-3 text-sm text-[var(--fg)]">
              <p>
                Raw media and labels stay in private storage. Media is served through short-lived
                signed links, never a permanent public URL.
              </p>
              <p className="text-[var(--fg-muted)]">
                Buyers and reviewers see a pseudonym, not your email or name. Only hashes and amounts
                go onchain.
              </p>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Before you start" />
            <PanelBody className="flex flex-col gap-3 text-sm text-[var(--fg)]">
              <span className="inline-flex items-center gap-1.5 text-[var(--fg-muted)]">
                <Clock className="size-3.5" aria-hidden />
                Most image tasks take about 3 minutes.
              </span>
              <Button asChild className="w-fit">
                <Link href="/work/qualify">
                  Start qualification
                </Link>
              </Button>
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
