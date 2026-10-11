import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card — the base surface of the mood board: white, 1px light border, 16px radius,
 * one soft shadow, 20 to 24px padding, sitting on the lilac-grey canvas.
 */
export function Card({
  className,
  interactive,
  ...props
}: React.ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      data-ui="card"
      className={cn(
        "rounded-[16px] border border-[var(--border)] bg-white shadow-[var(--elev-card)]",
        interactive &&
          "transition-[box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:shadow-[var(--elev-float)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-start justify-between gap-4 p-5 pb-0", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-3 border-t border-[var(--border)] p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-[17px] leading-tight font-bold text-[var(--fg)]", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-1 text-[13px] text-[var(--fg-muted)]", className)} {...props} />;
}