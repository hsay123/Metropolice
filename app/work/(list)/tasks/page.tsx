"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, ImageIcon, Play, Video, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/primitives";
import { PageHeader } from "@/components/domain/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { DataTable, TBody, TD, TH, THead, TR } from "@/components/domain/table";
import { RewardAmount } from "@/components/domain/machine";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/domain/states";
import { useAvailableTasks, useClaimTask } from "@/lib/api/hooks";
import { useLeaseStore } from "@/lib/store/lease";
import { TEST_TOKEN_NOTE } from "@/lib/config";
import { formatAmount } from "@/lib/format";
import type { AvailableTask } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * /work/tasks — the contributor task queue, rebuilt to docs/moodboard/tiles/
 * pd_marketplace.png: a filter-chip row, 44px row thumbnails, and the rubric and
 * reward shown before a claim (AGENTS.md A2). The claim is idempotent on the client
 * (see lib/api/client.ts).
 */

export default function TaskQueue() {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useAvailableTasks();
  const claim = useClaimTask();
  const setLease = useLeaseStore((s) => s.setLease);

  const [modality, setModality] = React.useState<"all" | "image" | "video">("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const tasks = React.useMemo(() => {
    const list = data ?? [];
    return modality === "all" ? list : list.filter((t) => t.modality === modality);
  }, [data, modality]);

  const selected = tasks.find((t) => t.id === selectedId) ?? tasks[0] ?? null;

  function onClaim(task: AvailableTask) {
    claim.mutate(task.id, {
      onSuccess: (lease) => {
        setLease(lease);
        toast.success("Task claimed", {
          description: "Your lease starts now. Label the item and submit.",
        });
        router.push(`/work/tasks/${task.id}`);
      },
      onError: (err) => {
        toast.error("Could not claim the task", {
          description: err instanceof Error ? err.message : "Try again in a moment.",
        });
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        context="Contributor"
        title="Task queue"
        description="Read the rubric and the reward before you claim. A claim opens a 90-minute lease."
      />

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <Panel className="self-start">
          <PanelHeader
            title="Available tasks"
            description={
              data ? `${tasks.length} of ${data.length} tasks shown` : "Checking what is available"
            }
          />

          {/* Filter chips, not a select: the board's marketplace row. */}
          <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-3 py-2.5">
            {(["all", "image", "video"] as const).map((key) => (
              <FilterChip key={key} active={modality === key} onClick={() => setModality(key)}>
                {key === "all" ? "All tasks" : key === "image" ? "Images" : "Video"}
              </FilterChip>
            ))}
            <span className="ml-auto pr-2 text-[13px] text-[var(--fg-muted)]">
              {TEST_TOKEN_NOTE}
            </span>
          </div>

          {isPending ? (
            <div className="p-5">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : isError ? (
            <div className="p-5">
              <ErrorState
                message="We could not load the task queue. Check your connection and try again."
                onRetry={() => refetch()}
              />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No tasks match your filters"
                description="Clear the filter or check back after the next job is published."
                action={
                  <Button variant="secondary" size="sm" onClick={() => setModality("all")}>
                    Clear filter
                  </Button>
                }
              />
            </div>
          ) : (
            <DataTable>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Task</TH>
                  <TH>Type</TH>
                  <TH numeric>Reward</TH>
                  <TH numeric>Effort</TH>
                  <TH>Deadline</TH>
                </TR>
              </THead>
              <TBody>
                {tasks.map((t) => {
                  const active = selected?.id === t.id;
                  return (
                    <TR
                      key={t.id}
                      aria-selected={active}
                      className={cn(
                        "cursor-pointer",
                        active ? "bg-[var(--primary-tint)] hover:bg-[var(--primary-tint)]" : "",
                      )}
                      onClick={() => setSelectedId(t.id)}
                    >
                      <TD>
                        <span className="flex items-center gap-3">
                          <Thumb task={t} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-[var(--fg)]">
                              {t.jobTitle}
                            </span>
                            <span className="machine block text-[12px] text-[var(--fg-muted)]">
                              {t.id}
                            </span>
                          </span>
                        </span>
                      </TD>
                      <TD>
                        <span className="inline-flex items-center gap-1.5 text-[var(--fg-muted)]">
                          {t.modality === "image" ? (
                            <ImageIcon className="size-4" aria-hidden />
                          ) : (
                            <Video className="size-4" aria-hidden />
                          )}
                          <span className="text-[14px]">{t.modality === "image" ? "Image" : "Video"}</span>
                        </span>
                      </TD>
                      <TD numeric>
                        <span className="font-semibold tabular-nums">{formatAmount(t.reward)}</span>
                      </TD>
                      <TD numeric className="text-[var(--fg-muted)]">
                        {t.estimatedMinutes} min
                      </TD>
                      <TD className="text-[var(--fg-muted)]">
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Clock className="size-3.5" aria-hidden />
                          {formatDeadline(t.deadline)}
                        </span>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </DataTable>
          )}

          <div className="flex items-center gap-2 border-t border-[var(--border)] px-5 py-3.5 text-[13px] text-[var(--fg-muted)]">
            <Wallet className="size-4" aria-hidden />
            Paid for accepted work only. Every payout leaves a receipt.
          </div>
        </Panel>

        <div className="self-start lg:sticky lg:top-[88px]">
          {selected ? (
            <TaskDetail
              task={selected}
              claiming={claim.isPending && claim.variables === selected.id}
              onClaim={() => onClaim(selected)}
            />
          ) : (
            <Panel>
              <PanelBody>
                <p className="text-[14px] text-[var(--fg-muted)]">
                  Select a task to read its rubric before claiming.
                </p>
              </PanelBody>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

/** 44x44 row thumbnail (docs/MOODBOARD-SPEC.md §3). Video carries a play mark. */
function Thumb({ task }: { task: AvailableTask }) {
  const src = task.asset.thumbUrl ?? task.asset.url;
  return (
    <span className="relative block size-11 shrink-0 overflow-hidden rounded-[10px] bg-[var(--surface-2)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" className="size-full object-cover" />
      {task.modality === "video" && (
        <span
          className="absolute right-0.5 bottom-0.5 grid size-4 place-items-center rounded-[6px] bg-[var(--cta-black)]/85 text-white"
          aria-hidden
        >
          <Play className="size-2.5 fill-current" />
        </span>
      )}
    </span>
  );
}

function TaskDetail({
  task,
  claiming,
  onClaim,
}: {
  task: AvailableTask;
  claiming: boolean;
  onClaim: () => void;
}) {
  return (
    <Panel>
      <PanelHeader
        title={task.jobTitle}
        description={`${task.modality === "image" ? "Image" : "Video"} task, about ${task.estimatedMinutes} minutes`}
      />
      <PanelBody className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[var(--fg-muted)]">Reward</span>
          <RewardAmount amount={task.reward} />
        </div>

        <div>
          <p className="text-[13px] text-[var(--fg-muted)]">Classes to use</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(task.classes ?? []).map((c) => (
              <span
                key={c}
                className="rounded-[8px] bg-[var(--primary-tint)] px-2 py-0.5 text-[12px] font-medium text-[var(--primary-hover)]"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] text-[var(--fg-muted)]">Rubric</p>
          <ul className="mt-1.5 flex flex-col gap-1.5 text-[14px] text-[var(--fg)]">
            {task.rubric.map((r) => (
              <li key={r.id} className="flex gap-2">
                <span
                  className="mt-[7px] size-1 shrink-0 rounded-[2px] bg-[var(--primary)]"
                  aria-hidden
                />
                {r.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="border-t border-[var(--border)] pt-3 text-[12px] text-[var(--fg-muted)]">
          Claiming does not start a timer you cannot pause; you have 90 minutes and can submit any
          time before then.
        </p>

        <Button className="w-full" onClick={onClaim} disabled={claiming}>
          {claiming ? "Claiming…" : "Claim task"}
        </Button>
      </PanelBody>
    </Panel>
  );
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
