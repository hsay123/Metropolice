"use client";


import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, ImageIcon, Video, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
 * /work/tasks — the contributor task queue. Reward, effort, deadline and data type
 * in a table; the rubric and reward are shown before a claim (AGENTS.md A2). The
 * claim is idempotent on the client (see lib/api/client.ts).
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

  const selected =
    tasks.find((t) => t.id === selectedId) ?? tasks[0] ?? null;

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
              data
                ? `${tasks.length} of ${data.length} tasks shown`
                : "Checking what is available"
            }
            actions={
              <div className="flex items-center gap-2">
                <Label htmlFor="modality-filter" className="text-xs text-ink-muted">
                  Data type
                </Label>
                <Select
                  value={modality}
                  onValueChange={(v) => setModality(v as typeof modality)}
                >
                  <SelectTrigger id="modality-filter" size="sm" className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />

          {isPending ? (
            <div className="p-4">
              <TableSkeleton rows={4} cols={5} />
            </div>
          ) : isError ? (
            <div className="p-4">
              <ErrorState
                message="We could not load the task queue. Check your connection and try again."
                onRetry={() => refetch()}
              />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No tasks match your filters"
                description="Clear the filter or check back after the next job is published."
                action={
                  <Button variant="outline" size="sm" onClick={() => setModality("all")}>
                    Clear filter
                  </Button>
                }
              />
            </div>
          ) : (
            <DataTable>
              <THead>
                <TR className="border-rule">
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
                      className={cn("cursor-pointer", active ? "bg-brand-tint" : "hover:bg-wash")}
                      onClick={() => setSelectedId(t.id)}
                    >
                      <TD>
                        <span className="block font-medium text-ink">{t.jobTitle}</span>
                        <span className="machine text-xs text-ink-muted">{t.id}</span>
                      </TD>
                      <TD>
                        <span className="inline-flex items-center gap-1.5 text-ink-muted">
                          {t.modality === "image" ? (
                            <ImageIcon className="size-3.5" aria-hidden />
                          ) : (
                            <Video className="size-3.5" aria-hidden />
                          )}
                          <span className="text-sm capitalize">{t.modality}</span>
                        </span>
                      </TD>
                      <TD numeric>
                        <span className="font-medium">{formatAmount(t.reward)}</span>
                      </TD>
                      <TD numeric className="text-ink-muted">
                        {t.estimatedMinutes} min
                      </TD>
                      <TD className="text-ink-muted">
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

          <div className="flex items-center gap-2 border-t border-rule px-4 py-3 text-xs text-ink-muted">
            <Wallet className="size-3.5" aria-hidden />
            {TEST_TOKEN_NOTE}
          </div>
        </Panel>

        <div className="self-start lg:sticky lg:top-[72px]">
          {selected ? (
            <TaskDetail
              task={selected}
              claiming={claim.isPending && claim.variables === selected.id}
              onClaim={() => onClaim(selected)}
            />
          ) : (
            <Panel>
              <PanelBody>
                <p className="text-sm text-ink-muted">
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
          <span className="text-xs text-ink-muted">Reward</span>
          <RewardAmount amount={task.reward} />
        </div>

        <div>
          <p className="text-xs text-ink-muted">Classes to use</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(task.classes ?? []).map((c) => (
              <span
                key={c}
                className="rounded-[8px] border border-field-edge px-1.5 py-0.5 text-xs text-ink"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-ink-muted">Rubric</p>
          <ul className="mt-1.5 flex flex-col gap-1.5 text-sm text-ink">
            {task.rubric.map((r) => (
              <li key={r.id} className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-[8px] bg-ink-muted" aria-hidden />
                {r.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="border-t border-rule pt-3 text-xs text-ink-muted">
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
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
