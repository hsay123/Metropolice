import { explainReason, REASON_CODE_LABELS, type ReasonCode } from "@/lib/reasonCodes";
import { cn } from "@/lib/utils";

/**
 * ReasonCode — the code for reviewers, the plain language for contributors.
 * Rejections never show a bare code to the person who did the work.
 */
export function ReasonCode({
  code,
  showCode = true,
  className,
}: {
  code: string;
  showCode?: boolean;
  className?: string;
}) {
  const label = (REASON_CODE_LABELS as Record<string, string>)[code] ?? code;
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      {showCode && (
        <span className="machine shrink-0 text-xs text-ink-muted">
          {(code as ReasonCode) in REASON_CODE_LABELS ? code : code}
        </span>
      )}
      <span className="text-sm text-ink">{label !== code ? label : explainReason(code)}</span>
    </span>
  );
}

/** The full plain-language sentence for a reason code, for result views. */
export function ReasonText({ code, className }: { code: string; className?: string }) {
  return <p className={cn("text-sm text-ink", className)}>{explainReason(code)}</p>;
}
