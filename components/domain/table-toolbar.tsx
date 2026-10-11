"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TH } from "@/components/domain/table";
import { cn } from "@/lib/utils";

export type SortDir = "asc" | "desc";

/**
 * Toolbar that sits above a data table. Left side is search and filters, right
 * side is a summary or a bulk action. It is part of the panel, not a second card.
 */
export function TableToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-rule px-4 py-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A sortable column header. The sort state is announced through aria-sort on the
 * th, and the button is a real control with a visible focus ring.
 */
export function SortHeader({
  label,
  active,
  dir,
  onToggle,
  numeric,
  className,
}: {
  label: React.ReactNode;
  active: boolean;
  dir: SortDir;
  onToggle: () => void;
  numeric?: boolean;
  className?: string;
}) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <TH
      numeric={numeric}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={className}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "group inline-flex min-h-6 -my-1 items-center gap-1 rounded-[8px] text-xs font-medium transition-colors",
          active ? "text-ink" : "text-ink-muted hover:text-ink",
        )}
      >
        {label}
        <Icon
          className={cn("size-3 shrink-0", !active && "text-ink-muted/60 group-hover:text-ink-muted")}
          aria-hidden
        />
      </button>
    </TH>
  );
}

/** Prev/next pagination with a page count. Returns nothing when there is one page. */
export function TablePagination({
  page,
  pageCount,
  onPage,
  className,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-2", className)}>
      <span className="tabular-nums text-xs text-ink-muted">
        Page {page} of {pageCount}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
