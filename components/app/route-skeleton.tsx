import { cn } from "@/lib/utils";

/**
 * RouteSkeleton — a server-rendered placeholder for a dynamic route while its
 * params and data stream in. Rendered inside the Suspense boundary that wraps the
 * `await params` access, so the route can still prerender (AGENTS.md: keep the
 * static shell when a route reads URL data).
 */
export function RouteSkeleton({
  variant = "detail",
  className,
}: {
  variant?: "detail" | "workbench";
  className?: string;
}) {
  if (variant === "workbench") {
    return (
      <div className={cn("flex flex-col gap-4", className)} aria-busy>
        <div className="h-14 animate-pulse rounded-[12px] border border-rule bg-sheet" />
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="h-[560px] animate-pulse rounded-[12px] bg-stage/90" />
          <div className="h-[560px] animate-pulse rounded-[12px] border border-rule bg-sheet" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} aria-busy>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-20 animate-pulse rounded-[8px] bg-wash" />
        <div className="h-6 w-56 animate-pulse rounded-[8px] bg-wash" />
      </div>
      <div className="h-40 animate-pulse rounded-[12px] border border-rule bg-sheet" />
      <div className="h-64 animate-pulse rounded-[12px] border border-rule bg-sheet" />
    </div>
  );
}
