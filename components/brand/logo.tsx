import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The PhysicalData mark: a violet rounded delta. One shape, drawn once, so the
 * logo never depends on a font glyph or an image request.
 */
export function LogoMark({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="PhysicalData"
      className={cn("shrink-0", className)}
    >
      <path
        d="M12 2.4c1.5 0 2.7.9 3.3 2.2l3.6 8c.9 2-.6 4.2-2.8 4.2H7.9c-2.2 0-3.7-2.2-2.8-4.2l3.6-8c.6-1.3 1.8-2.2 3.3-2.2Z"
        fill="var(--primary)"
      />
      <path
        d="M12 8.6c.6 0 1.1.3 1.3.8l1.9 4.2c.4.8-.2 1.7-1.1 1.7H9.9c-.9 0-1.5-.9-1.1-1.7l1.9-4.2c.2-.5.7-.8 1.3-.8Z"
        fill="#fff"
        fillOpacity=".92"
      />
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
  showWord = true,
}: {
  className?: string;
  href?: string;
  showWord?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      {showWord && (
        <span className="font-display text-[17px] font-bold tracking-[-0.02em] text-[var(--fg)]">
          PhysicalData
        </span>
      )}
    </Link>
  );
}