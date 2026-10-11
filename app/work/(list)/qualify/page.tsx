"use client";


import * as React from "react";
import Link from "next/link";
import { Check, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/domain/page-header";
import { Panel, PanelBody, PanelHeader } from "@/components/domain/panel";
import { cn } from "@/lib/utils";

/**
 * /work/qualify — a short check on the labelling rules before the queue opens.
 * Gold-task style: the questions are the real rules, and the check does not say
 * whether any particular task is gold (AGENTS.md A6).
 */

type Question = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correct: string;
  explanation: string;
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    prompt: "A box leaves about 8 px of slack along the bottom edge of the cup. What is correct?",
    options: [
      { id: "a", text: "Submit it as is; a few pixels do not matter" },
      { id: "b", text: "Tighten the box so it hugs the object" },
      { id: "c", text: "Delete the box and move on" },
    ],
    correct: "b",
    explanation: "The rubric allows at most 5 px of slack on any edge. Tighten the box before submitting.",
  },
  {
    id: "q2",
    prompt: "An object listed in the rubric is half behind another object, so you cannot box the whole thing.",
    options: [
      { id: "a", text: "Skip it; a partial object cannot be boxed" },
      { id: "b", text: "Box the visible extent and set a lower confidence" },
      { id: "c", text: "Box the whole table to be safe" },
    ],
    correct: "b",
    explanation: "Box the visible extent of the object and lower the confidence. Do not box things that are not the object.",
  },
  {
    id: "q3",
    prompt: "The image is too blurry to tell whether the object is a pen or a pencil.",
    options: [
      { id: "a", text: "Guess the most likely class and move on" },
      { id: "b", text: "Choose 'other' and add a short note" },
      { id: "c", text: "Return the task as unclear" },
    ],
    correct: "c",
    explanation: "If the item cannot be labelled reliably, return it rather than guessing. Guessing costs you and the buyer.",
  },
];

export default function Qualify() {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const answered = Object.keys(answers).length;
  const score = QUESTIONS.filter((q) => answers[q.id] === q.correct).length;
  const passed = score === QUESTIONS.length;
  const allAnswered = answered === QUESTIONS.length;

  function reset() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        context="Contributor"
        title="Qualification"
        description="Three questions on the labelling rules. Score all three to open the task queue."
      />

      {submitted && (
        <div
          role="status"
          className={cn(
            "flex items-start gap-3 rounded-[12px] border px-4 py-3",
            passed
              ? "border-[var(--accepted-ink)]/30 bg-accepted-bg"
              : "border-[var(--revision-ink)]/30 bg-revision-bg",
          )}
        >
          <span
            className={cn(
              "mt-0.5",
              passed ? "text-accepted-ink" : "text-revision-ink",
            )}
          >
            {passed ? <Check className="size-4" aria-hidden /> : <TriangleAlert className="size-4" aria-hidden />}
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">
              {passed
                ? "You passed. The task queue is open."
                : `${score} of ${QUESTIONS.length} correct. Read the notes below and try again.`}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {passed
                ? "You can start claiming tasks. The reward and rubric are shown before you claim."
                : "Nothing is lost. Fix the answers marked below."}
            </p>
            <div className="mt-3 flex gap-2">
              {passed ? (
                <Button asChild>
                  <Link href="/work/tasks">
                    Go to task queue
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={reset}>
                  <RotateCcw aria-hidden />
                  Try again
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {QUESTIONS.map((q, i) => {
          const chosen = answers[q.id];
          const wrong = submitted && chosen !== q.correct;
          return (
            <Panel key={q.id} className={cn(wrong && "border-[var(--rejected-ink)]/40")}>
              <PanelHeader title={`Question ${i + 1}`} />
              <PanelBody className="flex flex-col gap-3">
                <p className="max-w-[70ch] text-sm text-ink">{q.prompt}</p>
                <RadioGroup
                  value={chosen}
                  onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                  disabled={submitted && passed}
                  className="gap-1"
                >
                  {q.options.map((opt) => {
                    const isAnswer = submitted && opt.id === q.correct;
                    const isChosenWrong = wrong && opt.id === chosen;
                    return (
                      <Label
                        key={opt.id}
                        htmlFor={`${q.id}-${opt.id}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-[8px] border border-transparent px-2 py-1.5 text-sm font-normal",
                          "hover:bg-wash has-[:focus-visible]:border-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40",
                          isAnswer && "bg-accepted-bg",
                          isChosenWrong && "bg-rejected-bg",
                        )}
                      >
                        <RadioGroupItem id={`${q.id}-${opt.id}`} value={opt.id} />
                        <span className="flex-1">{opt.text}</span>
                        {isAnswer && <Check className="size-4 text-accepted-ink" aria-hidden />}
                        {isChosenWrong && <TriangleAlert className="size-4 text-rejected-ink" aria-hidden />}
                      </Label>
                    );
                  })}
                </RadioGroup>
                {wrong && (
                  <p className="border-t border-rule pt-2 text-sm text-ink-muted">
                    {q.explanation}
                  </p>
                )}
              </PanelBody>
            </Panel>
          );
        })}
      </div>

      {!passed && (
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
          >
            Check answers
          </Button>
          <span className="text-sm text-ink-muted">
            {allAnswered ? "All questions answered." : `Answer all ${QUESTIONS.length} to check.`}
          </span>
        </div>
      )}
    </div>
  );
}
