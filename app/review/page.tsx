"use client";

import Link from "next/link";
import { Flag, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/domain/page-header";
import { Panel, PanelHeader } from "@/components/domain/panel";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/domain/table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/domain/states";
import { useReviewQueue } from "@/lib/api/hooks";
import { timeAgo } from "@/lib/dates";
import type { ReviewItem } from "@/lib/api/types";

/**
 * /review — the reviewer queue. Sorted so the riskiest items come first: more
 * risk flags, then the oldest. Reviewers never see their own submissions
 * (AGENTS.md A2); the mock seed holds none of theirs.
 */
export default function ReviewQueuePage() {
  const { data, isPending, isError, refetch } = useReviewQueue();

  const items = sortByRisk(data);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        context="Reviewer"
        title="Review queue"
        description="Submitted labels sorted by risk, with the reason each item is here."
      />

      <Panel>
        <PanelHeader
          title="Waiting for review"
          description={data ? `${data.length} submissions in the queue` : "Loading the queue"}
        />
        {isPending ? (
          <div className="p-4">
            <TableSkeleton rows={4} cols={5} />
          </div>
        ) : isError ? (
          <div className="p-4">
            <ErrorState
              message="We could not load the review queue. Check your connection and try again."
              onRetry={() => refetch()}
            />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            className="m-4"
            title="The queue is clear"
            description="Nothing is waiting for review. New submissions appear here as contributors finish."
          />
        ) : (
          <DataTable>
            <THead>
              <TR className="border-rule">
                <TH>Submission</TH>
                <TH>Contributor</TH>
                <TH>Submitted</TH>
                <TH>Why it is here</TH>
                <TH>AI suggests</TH>
                <TH className="text-right">Action</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.submission.id} className="hover:bg-wash">
                  <TD>
                    <span className="block font-medium text-ink">{item.submission.jobTitle}</span>
                    <span className="machine inline-flex items-center gap-2 text-xs text-ink-muted">
                      <span>{item.submission.taskId}</span>
                      <span>v{item.submission.version}</span>
                    </span>
                  </TD>
                  <TD className="text-ink-muted">{item.submission.contributorId}</TD>
                  <TD className="text-ink-muted">{timeAgo(item.submission.submittedAt)}</TD>
                  <TD>
                    {item.flags.length > 0 ? (
                      <span className="inline-flex flex-wrap gap-1">
                        {item.flags.map((f) => (
                          <span
                            key={f}
                            className="inline-flex items-center gap-1 rounded-[8px] border border-[var(--revision-ink)]/30 bg-revision-bg px-1.5 py-0.5 text-xs text-revision-ink"
                          >
                            <Flag className="size-3" aria-hidden />
                            {f}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-muted">Routine sample</span>
                    )}
                  </TD>
                  <TD>
                    {item.ai ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                        <Sparkles className="size-3.5" aria-hidden />
                        <AiWord decision={item.ai.decision} />
                        <span className="tabular-nums">{Math.round(item.ai.confidence * 100)}%</span>
                      </span>
                    ) : (
                      <span className="text-xs text-ink-muted">Needs a human</span>
                    )}
                  </TD>
                  <TD className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/review/${item.submission.id}`}>
                        Review
                      </Link>
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </DataTable>
        )}
        <div className="flex items-center gap-2 border-t border-rule px-4 py-3 text-xs text-ink-muted">
          <UserCheck className="size-3.5" aria-hidden />
          You never see your own submissions. Gold and overlap samples are marked only for reviewers.
        </div>
      </Panel>
    </div>
  );
}

function AiWord({ decision }: { decision: "accept" | "revise" | "reject" }) {
  const map = { accept: "Accept", revise: "Revise", reject: "Reject" } as const;
  return <span>{map[decision]}</span>;
}

/** Riskiest first: more flags, then oldest submission. */
function sortByRisk(data: ReviewItem[] | undefined): ReviewItem[] {
  if (!data) return [];
  return [...data].sort((a, b) => {
    if (b.flags.length !== a.flags.length) return b.flags.length - a.flags.length;
    return new Date(a.submission.submittedAt).getTime() - new Date(b.submission.submittedAt).getTime();
  });
}
