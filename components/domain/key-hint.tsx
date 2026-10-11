import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * KeyHint — a small key chip. Work tools teach their shortcuts by showing them, not
 * by documenting them somewhere else. Decorative only: the label already names the
 * action, so the chip is hidden from assistive tech rather than read as stray text.
 */
export function KeyHint({
  keys,
  className,
}: {
  /** One key ("B") or a chord in order (["⌘", "Z"]). */
  keys: string | string[];
  className?: string;
}) {
  const list = Array.isArray(keys) ? keys : [keys];
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-0.5", className)}>
      {list.map((k) => (
        <kbd
          key={k}
          className="grid min-w-[18px] place-items-center rounded-[4px] border border-rule bg-surface-2 px-1 py-px font-sans text-[10px] font-medium leading-4 text-ink-muted"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

/** A hint list for the bottom of a workbench: "B box · V select · Del delete". */
export function KeyHintList({
  hints,
  className,
}: {
  hints: { keys: string | string[]; label: string }[];
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted",
        className,
      )}
    >
      {hints.map((h) => (
        <li key={h.label} className="flex items-center gap-1.5">
          <KeyHint keys={h.keys} />
          <span>{h.label}</span>
        </li>
      ))}
    </ul>
  );
}