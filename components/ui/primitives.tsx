import * as React from "react";
import { cn } from "@/lib/utils";

/** ProgressBar — 6px, fully rounded, violet fill; green when the work is done. */
export function ProgressBar({
  value,
  complete,
  label,
  className,
}: {
  /** 0 to 100. */
  value: number;
  complete?: boolean;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      data-ui="progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[#EEF2F7]", className)}
    >
      <div
        className={cn("h-full rounded-full", complete ? "bg-[var(--s-accepted-fg)]" : "bg-[var(--primary)]")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** FilterChip — the marketplace filter row. Active is violet text with an underline. */
export function FilterChip({
  active,
  className,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-ui="filter-chip"
      aria-pressed={active}
      className={cn(
        "h-9 rounded-[10px] px-3 text-[14px] font-medium transition-colors",
        active
          ? "bg-[var(--primary-tint)] text-[var(--primary-hover)]"
          : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]",
        className,
      )}
      {...props}
    />
  );
}

/** Avatar — 32px in the app bar, 28px in the sidebar workspace switcher. */
export function Avatar({
  name,
  size = 32,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      data-ui="avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-[var(--primary-tint)] font-semibold text-[var(--primary-hover)] select-none",
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}

/** SegmentedControl — white pill on a light track, sliding indicator. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onValueChange,
  className,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      data-ui="segmented"
      role="tablist"
      className={cn("inline-flex gap-1 rounded-[12px] bg-[var(--surface-2)] p-1", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(o.value)}
            className={cn(
              "h-8 rounded-[8px] px-3 text-[14px] font-medium transition-all duration-150 ease-out",
              active
                ? "bg-white text-[var(--fg)] shadow-[var(--elev-card)]"
                : "text-[var(--fg-muted)] hover:text-[var(--fg)]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * PhotoSlot — a labelled stand-in for imagery that has not been delivered yet.
 * When the real file lands in public/images/ the caller passes `src` and this
 * renders an <img> instead. Any image that ships without a caption must be
 * labelled "Illustrative image"; this exists so nothing quietly pretends.
 */
export function PhotoSlot({
  src,
  alt,
  caption,
  className,
  style,
  children,
}: {
  src?: string;
  alt: string;
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const label = caption ?? "Illustrative image";
  if (src) {
    return (
      <figure className={cn("relative overflow-hidden rounded-[12px]", className)} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="size-full object-cover" />
        <figcaption className="absolute bottom-2 left-2 rounded-[6px] bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
          {label}
        </figcaption>
      </figure>
    );
  }
  return (
    <div
      data-ui="photo-slot"
      className={cn("photo-slot rounded-[12px]", className)}
      style={style}
      role="img"
      aria-label={`${alt}. ${label} placeholder.`}
    >
      <span className="relative z-10 text-[12px] font-medium">{label}</span>
      {children}
    </div>
  );
}