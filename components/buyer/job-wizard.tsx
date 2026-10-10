"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, useReducedMotion } from "motion/react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Panel, PanelBody, PanelHeader, DetailRow } from "@/components/domain/panel";
import { useCreateJob, usePublishJob } from "@/lib/api/hooks";
import type { CreateJobInput } from "@/lib/api/real";
import { formatAmount } from "@/lib/format";
import { VIDEO_LABELS, TEST_TOKEN_NOTE } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * /buyer/jobs/new — the funding wizard. Data type, schema, rubric, budget and
 * reward, deadline, data rights, then review and fund (AGENTS.md A5). The budget
 * is locked on Monad when the job is funded; a job with no testable rubric rule
 * cannot be launched (PRD §9).
 */

const JobForm = z
  .object({
    title: z.string().trim().min(4, "Give the job a short, specific name."),
    modality: z.enum(["image", "video"]),
    classes: z.array(z.string().trim().min(1)).min(1, "Add at least one class."),
    rewardPerTask: z.coerce
      .number()
      .positive("Reward must be more than 0.")
      .max(1_000, "Keep the reward under 1,000 test USDC."),
    budget: z.coerce.number().positive("Budget must be more than 0."),
    deadline: z.string().min(1, "Pick a deadline."),
    dataRightsAttested: z
      .boolean()
      .refine((v) => v === true, { message: "Confirm you may share this data." }),
  })
  .superRefine((val, ctx) => {
    if (val.budget < val.rewardPerTask) {
      ctx.addIssue({
        code: "custom",
        path: ["budget"],
        message: "Budget must cover at least one reward.",
      });
    }
    const when = new Date(val.deadline).getTime();
    if (val.deadline && Number.isFinite(when) && when <= Date.now()) {
      ctx.addIssue({ code: "custom", path: ["deadline"], message: "Pick a deadline in the future." });
    }
  });

type JobFormValues = z.input<typeof JobForm>;

const STEPS = [
  { key: "type", title: "Data type", fields: ["title", "modality"] as const },
  { key: "schema", title: "Schema", fields: ["classes"] as const },
  // The rubric list is plain component state (see the note in the component), so
  // its validation is manual and it has no RHF field names.
  { key: "rubric", title: "Rubric", fields: [] as const },
  { key: "money", title: "Reward and budget", fields: ["rewardPerTask", "budget"] as const },
  { key: "rights", title: "Deadline and data rights", fields: ["deadline", "dataRightsAttested"] as const },
  { key: "review", title: "Review and fund", fields: [] as const },
] as const;

/** A testable rule needs enough words to mean something. */
const RULE_MIN = 10;

function defaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(18, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function JobWizard() {
  const router = useRouter();
  const create = useCreateJob();
  const publish = usePublishJob();
  const reduce = useReducedMotion();

  const [step, setStep] = React.useState(0);
  const [classDraft, setClassDraft] = React.useState("");
  // The rubric list lives in plain state. useFieldArray plus a transforming zod
  // resolver loses appended rows when a prior validation pass rewrites the form
  // values, so we keep this list and validate it by hand.
  const [rules, setRules] = React.useState<string[]>([""]);
  const [rulesError, setRulesError] = React.useState<string | null>(null);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(JobForm),
    mode: "onTouched",
    defaultValues: {
      title: "",
      modality: "image",
      classes: ["cup", "pen"],
      rewardPerTask: 0.5,
      budget: 20,
      deadline: defaultDeadline(),
      dataRightsAttested: false,
    },
  });
  const {
    register,
    control,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = form;

  const modality = useWatch({ control, name: "modality" });
  const classes = useWatch({ control, name: "classes" });
  const reward = Number(useWatch({ control, name: "rewardPerTask" })) || 0;
  const budget = Number(useWatch({ control, name: "budget" })) || 0;
  const title = useWatch({ control, name: "title" });
  const deadline = useWatch({ control, name: "deadline" });
  const dataRights = useWatch({ control, name: "dataRightsAttested" });

  const funding = create.isPending || publish.isPending;
  const tasksFunded = reward > 0 ? Math.floor(budget / reward) : 0;

  function validateRules(): boolean {
    const cleaned = rules.map((r) => r.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setRulesError("Add at least one testable rule. No rubric, no launch.");
      return false;
    }
    if (cleaned.some((r) => r.length < RULE_MIN)) {
      setRulesError("Each rule needs enough detail for the code or a reviewer to test it.");
      return false;
    }
    setRulesError(null);
    return true;
  }

  function updateRule(index: number, value: string) {
    setRules((prev) => prev.map((r, i) => (i === index ? value : r)));
    if (rulesError) setRulesError(null);
  }

  function addRule() {
    setRules((prev) => [...prev, ""]);
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  async function next() {
    if (step === 2 && !validateRules()) return;
    const ok = await trigger(STEPS[step].fields as unknown as (keyof JobFormValues)[]);
    if (ok) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function addClass() {
    const value = classDraft.trim();
    if (!value) return;
    if (classes.includes(value)) {
      setClassDraft("");
      return;
    }
    setValue("classes", [...classes, value], { shouldValidate: true });
    setClassDraft("");
  }

  function removeClass(value: string) {
    setValue(
      "classes",
      classes.filter((c) => c !== value),
      { shouldValidate: true },
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!validateRules()) {
      setStep(2);
      return;
    }
    const payload: CreateJobInput = {
      title: values.title.trim(),
      modality: values.modality,
      classes:
        values.modality === "video"
          ? [...VIDEO_LABELS]
          : values.classes.map((c) => c.trim()).filter(Boolean),
      rubric: rules
        .map((r) => r.trim())
        .filter(Boolean)
        .map((text, i) => ({ id: `r${i + 1}`, text })),
      rewardPerTask: Number(values.rewardPerTask),
      budget: Number(values.budget),
      deadline: new Date(values.deadline).toISOString(),
      dataRightsAttested: true,
    };

    let jobId: string;
    try {
      const job = await create.mutateAsync(payload);
      jobId = job.id;
    } catch (err) {
      toast.error("Could not create the job", {
        description: err instanceof Error ? err.message : "Try again in a moment.",
      });
      return;
    }

    try {
      await publish.mutateAsync(jobId);
      toast.success("Job funded", {
        description: "The budget is locked on Monad. Contributors can claim tasks now.",
      });
    } catch (err) {
      toast.error("The job was created but not funded", {
        description:
          err instanceof Error
            ? `${err.message} Open the job and try funding again.`
            : "Open the job and try funding again.",
      });
    }
    router.push(`/buyer/jobs/${jobId}`);
  });

  return (
    <div className="flex flex-col gap-6">
      <Stepper steps={STEPS} current={step} />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {step === 0 && (
              <Panel>
                <PanelHeader
                  title="What kind of data are you labelling?"
                  description="This sets the annotation schema and how review runs."
                />
                <PanelBody className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="job-title">Job name</Label>
                    <Input
                      id="job-title"
                      placeholder="Pick and place, kitchen set"
                      {...register("title")}
                      aria-invalid={Boolean(errors.title)}
                    />
                    <FieldError message={errors.title?.message} />
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Data type"
                    className="grid gap-3 sm:grid-cols-2"
                    onKeyDown={(e) => {
                      if (
                        e.key === "ArrowRight" ||
                        e.key === "ArrowLeft" ||
                        e.key === "ArrowDown" ||
                        e.key === "ArrowUp"
                      ) {
                        e.preventDefault();
                        const next = modality === "image" ? "video" : "image";
                        setValue("modality", next, { shouldValidate: true });
                        if (next === "video") {
                          setValue("classes", [...VIDEO_LABELS], { shouldValidate: true });
                        }
                      }
                    }}
                  >
                    <ModalityCard
                      title="Images"
                      body="Draw boxes around objects. Kimi reviews first, people handle the hard cases."
                      selected={modality === "image"}
                      onSelect={() => {
                        setValue("modality", "image", { shouldValidate: true });
                      }}
                    />
                    <ModalityCard
                      title="Video"
                      body="Mark action segments with timecode. A person reviews every clip."
                      selected={modality === "video"}
                      onSelect={() => {
                        setValue("modality", "video", { shouldValidate: true });
                        setValue("classes", [...VIDEO_LABELS], { shouldValidate: true });
                      }}
                    />
                  </div>
                </PanelBody>
              </Panel>
            )}

            {step === 1 && (
              <Panel>
                <PanelHeader
                  title="Schema"
                  description={
                    modality === "video"
                      ? "Video uses the fixed action-segment schema. Every clip is labelled with these actions."
                      : "The classes a contributor can assign. Keep them mutually exclusive."
                  }
                />
                <PanelBody className="flex flex-col gap-4">
                  {modality === "video" ? (
                    <div className="flex flex-wrap gap-1.5">
                      {VIDEO_LABELS.map((label) => (
                        <span
                          key={label}
                          className="rounded-[2px] bg-brand-tint px-2.5 py-1 text-sm text-brand"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="class-add">Classes</Label>
                        <div className="flex gap-2">
                          <Input
                            id="class-add"
                            value={classDraft}
                            placeholder="red_block"
                            onChange={(e) => setClassDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addClass();
                              }
                            }}
                          />
                          <Button type="button" variant="outline" onClick={addClass}>
                            <Plus aria-hidden />
                            Add
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {classes.length === 0 && (
                          <p className="text-sm text-ink-muted">No classes yet. Add at least one.</p>
                        )}
                        {classes.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1.5 rounded-[2px] bg-brand-tint py-1 pl-2.5 pr-1.5 text-sm text-brand"
                          >
                            {c}
                            <button
                              type="button"
                              onClick={() => removeClass(c)}
                              aria-label={`Remove ${c}`}
                              className="rounded-[2px] p-0.5 hover:bg-brand/15"
                            >
                              <X className="size-3.5" aria-hidden />
                            </button>
                          </span>
                        ))}
                      </div>
                      <FieldError message={errors.classes?.message} />
                    </>
                  )}
                </PanelBody>
              </Panel>
            )}

            {step === 2 && (
              <Panel>
                <PanelHeader
                  title="Rubric"
                  description="Rules the code or a reviewer can test. A contributor sees these before claiming."
                />
                <PanelBody className="flex flex-col gap-4">
                  {rules.map((rule, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="mt-2.5 text-xs text-ink-muted tabular-nums">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <Textarea
                          rows={2}
                          value={rule}
                          onChange={(e) => updateRule(index, e.target.value)}
                          placeholder="A box contains the whole object with at most 5 px of slack on any edge."
                          aria-label={`Rubric rule ${index + 1}`}
                          aria-invalid={Boolean(rulesError) && rule.trim().length < RULE_MIN}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove rule ${index + 1}`}
                        disabled={rules.length === 1}
                        onClick={() => removeRule(index)}
                        className="mt-1"
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  ))}
                  <div>
                    <Button type="button" variant="outline" size="sm" onClick={addRule}>
                      <Plus aria-hidden />
                      Add rule
                    </Button>
                  </div>
                  <FieldError message={rulesError ?? undefined} />
                </PanelBody>
              </Panel>
            )}

            {step === 3 && (
              <Panel>
                <PanelHeader
                  title="Reward and budget"
                  description="Reward per accepted task, and the total you lock in escrow."
                />
                <PanelBody className="flex flex-col gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="reward">Reward per accepted task</Label>
                      <Input
                        id="reward"
                        type="number"
                        min="0"
                        step="0.1"
                        inputMode="decimal"
                        {...register("rewardPerTask")}
                        aria-invalid={Boolean(errors.rewardPerTask)}
                      />
                      <FieldError message={errors.rewardPerTask?.message} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="budget">Total budget</Label>
                      <Input
                        id="budget"
                        type="number"
                        min="0"
                        step="1"
                        inputMode="decimal"
                        {...register("budget")}
                        aria-invalid={Boolean(errors.budget)}
                      />
                      <FieldError message={errors.budget?.message} />
                    </div>
                  </div>
                  <p className="rounded-[2px] border border-rule bg-wash px-3 py-2 text-sm text-ink">
                    This budget funds about{" "}
                    <span className="font-medium tabular-nums">{tasksFunded}</span> accepted{" "}
                    {tasksFunded === 1 ? "task" : "tasks"}. Money is only paid for work that passes
                    review.
                  </p>
                  <p className="text-xs text-ink-muted">{TEST_TOKEN_NOTE}</p>
                </PanelBody>
              </Panel>
            )}

            {step === 4 && (
              <Panel>
                <PanelHeader
                  title="Deadline and data rights"
                  description="When contributors must submit by, and your word on the data."
                />
                <PanelBody className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deadline">Submission deadline</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      {...register("deadline")}
                      aria-invalid={Boolean(errors.deadline)}
                    />
                    <FieldError message={errors.deadline?.message} />
                  </div>

                  <label className="flex items-start gap-3 rounded-[2px] border border-field-edge px-3 py-3">
                    <Checkbox
                      checked={dataRights}
                      onCheckedChange={(v) => setValue("dataRightsAttested", v === true, { shouldValidate: true })}
                      aria-invalid={Boolean(errors.dataRightsAttested)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-ink">
                      I confirm I may share this data and it contains no personal or restricted
                      content. Use synthetic or permission-cleared media.
                    </span>
                  </label>
                  <FieldError message={errors.dataRightsAttested?.message} />
                </PanelBody>
              </Panel>
            )}

            {step === 5 && (
              <Panel>
                <PanelHeader
                  title="Review and fund"
                  description="Check it over. Funding locks the budget on Monad testnet."
                />
                <PanelBody className="flex flex-col gap-4">
                  <Summary title={title} modality={modality} classes={classes} reward={reward} budget={budget} deadline={deadline} />
                  <div className="flex flex-col gap-2 rounded-[2px] border border-rule bg-wash px-3 py-3 text-sm text-ink">
                    <p className="font-medium">What happens when you fund</p>
                    <ul className="list-disc space-y-1 pl-4 text-ink-muted">
                      <li>The budget is locked in escrow on Monad. One receipt is written per payout.</li>
                      <li>Contributors see the reward and the rubric before they claim a task.</li>
                      <li>Only work that passes review is paid. Rejections always state a reason.</li>
                      <li>Raw media and labels stay private. The export carries hashes and a manifest.</li>
                    </ul>
                  </div>
                  <p className="text-xs text-ink-muted">{TEST_TOKEN_NOTE}</p>
                </PanelBody>
              </Panel>
            )}
          </motion.div>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || funding}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button key="continue" type="button" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button key="submit" type="submit" disabled={funding}>
                {funding ? "Funding…" : "Fund job"}
              </Button>
            )}
          </div>
        </div>

        <div className="self-start lg:sticky lg:top-[72px]">
          <Panel>
            <PanelHeader title="Summary" description="Updates as you fill the steps." />
            <PanelBody>
              <Summary
                title={title}
                modality={modality}
                classes={classes}
                reward={reward}
                budget={budget}
                deadline={deadline}
                compact
              />
            </PanelBody>
          </Panel>
        </div>
      </form>
    </div>
  );
}

function ModalityCard({
  title,
  body,
  selected,
  onSelect,
}: {
  title: string;
  body: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-1 rounded-[6px] border px-4 py-3 text-left transition-colors",
        selected ? "border-brand bg-brand-tint" : "border-field-edge hover:bg-wash",
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-4 items-center justify-center rounded-[2px] border",
            selected ? "border-brand bg-brand text-white" : "border-field-edge",
          )}
          aria-hidden
        >
          {selected && <Check className="size-3" />}
        </span>
        <span className="font-display text-base font-semibold text-ink">{title}</span>
      </span>
      <span className="text-sm text-ink-muted">{body}</span>
    </button>
  );
}

function Stepper({
  steps,
  current,
}: {
  steps: readonly { key: string; title: string }[];
  current: number;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Funding steps">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-[2px] text-xs font-medium tabular-nums",
                done && "bg-brand text-white",
                active && "border border-brand text-brand",
                !done && !active && "border border-rule text-ink-muted",
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                active ? "font-medium text-ink" : "text-ink-muted",
              )}
            >
              {s.title}
            </span>
            {i < steps.length - 1 && <span className="ml-1 h-px w-5 bg-rule" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function Summary({
  title,
  modality,
  classes,
  reward,
  budget,
  deadline,
  compact = false,
}: {
  title?: string;
  modality: "image" | "video";
  classes: string[];
  reward: number;
  budget: number;
  deadline?: string;
  compact?: boolean;
}) {
  const tasksFunded = reward > 0 ? Math.floor(budget / reward) : 0;
  const shown = modality === "video" ? [...VIDEO_LABELS] : classes;
  return (
    <div className="flex flex-col">
      <DetailRow label="Name">
        <span className={cn(!title && "text-ink-muted")}>{title || "Untitled job"}</span>
      </DetailRow>
      <DetailRow label="Data type">{modality === "video" ? "Video" : "Images"}</DetailRow>
      <DetailRow label={modality === "video" ? "Actions" : "Classes"}>
        {shown.length === 0 ? (
          <span className="text-ink-muted">None yet</span>
        ) : compact ? (
          <span className="tabular-nums">{shown.length}</span>
        ) : (
          <span className="flex flex-wrap justify-end gap-1">
            {shown.map((c) => (
              <span key={c} className="rounded-[2px] bg-brand-tint px-2 py-0.5 text-xs text-brand">
                {c}
              </span>
            ))}
          </span>
        )}
      </DetailRow>
      <DetailRow label="Reward / task">
        <span className="tabular-nums">{formatAmount(reward)}</span>
      </DetailRow>
      <DetailRow label="Budget">
        <span className="tabular-nums">{formatAmount(budget)}</span>
      </DetailRow>
      <DetailRow label="Funds about">
        <span className="tabular-nums">
          {tasksFunded} {tasksFunded === 1 ? "task" : "tasks"}
        </span>
      </DetailRow>
      <DetailRow label="Deadline">
        <span className={cn(!deadline && "text-ink-muted")}>
          {deadline ? new Date(deadline).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Not set"}
        </span>
      </DetailRow>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-[var(--rejected-ink)]">
      {message}
    </p>
  );
}
