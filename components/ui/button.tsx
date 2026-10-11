import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

/**
 * Button — mood-board spec (docs/MOODBOARD-SPEC.md §3).
 *
 * Primary 40px on white cards, 44px on marketing. Black is the marketing CTA.
 * Secondary carries a field border so it stays readable on a card; ghost is for
 * nav-level actions. Every variant is 10px radius, 14/600, with a 3px violet focus
 * ring. `data-ui` is the contract scripts/spec-check.mjs asserts against.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] border text-[14px] font-semibold whitespace-nowrap transition-[background-color,box-shadow,transform] duration-150 ease-out outline-none select-none",
  {
    variants: {
      variant: {
        /** Violet primary. The sheen is the board's top-to-bottom highlight. */
        primary:
          "h-10 border-transparent bg-linear-to-b from-[#7A52FA] to-[var(--primary)] px-[18px] text-white shadow-btn hover:-translate-y-px hover:from-[#8A66FB] hover:to-[var(--primary-hover)] hover:shadow-[var(--elev-card)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)] active:translate-y-0",
        /** Marketing CTA. Trailing arrow only where the board shows one. */
        black:
          "h-11 border-transparent bg-[var(--cta-black)] px-[18px] text-white shadow-btn hover:-translate-y-px hover:bg-[#161C2E] hover:shadow-[var(--elev-card)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)] active:translate-y-0",
        secondary:
          "h-10 border-[var(--border-field)] bg-white px-[18px] text-[var(--fg)] hover:bg-[var(--surface-2)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)]",
        ghost:
          "h-10 border-[var(--border)] bg-white px-[18px] text-[var(--fg)] hover:bg-[var(--surface-2)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)]",
        quiet:
          "h-9 border-transparent bg-transparent px-3 text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)]",
        destructive:
          "h-10 border-transparent bg-[var(--s-rejected-fg)] px-[18px] text-white shadow-btn hover:-translate-y-px focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)]",

        /* Legacy aliases. The pre-moodboard code called these "outline" and
           "link"; they resolve to the new secondary/quiet specs so screens
           migrate one at a time. Drop them once their last caller is gone. */
        outline:
          "h-10 border-[var(--border-field)] bg-white px-[18px] text-[var(--fg)] hover:bg-[var(--surface-2)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)]",
        default:
          "h-10 border-transparent bg-linear-to-b from-[#7A52FA] to-[var(--primary)] px-[18px] text-white shadow-btn hover:-translate-y-px focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)]",
        link:
          "h-9 border-transparent bg-transparent px-2 text-[var(--fg-muted)] underline-offset-4 hover:bg-[var(--surface-2)] hover:text-[var(--fg)] hover:underline focus-visible:ring-[3px] focus-visible:ring-[var(--primary-ring)]",
      },
      size: {
        xs: "h-8 rounded-[8px] px-2.5 text-[13px]",
        sm: "h-8 rounded-[8px] px-3 text-[13px]",
        md: "",
        lg: "h-11 rounded-[10px] px-5",
        icon: "size-10 p-0",
        "icon-sm": "size-8 rounded-[8px] p-0",
        "icon-xs": "size-6 rounded-[6px] p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

/** Only the four variants the mood board specifies carry a data-ui contract. */
const VARIANT_UI: Record<string, string | undefined> = {
  primary: "btn-primary",
  black: "btn-black",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  const ui = variant ? VARIANT_UI[variant] : undefined;
  return (
    <Comp
      data-ui={ui}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };