import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Workbench } from "@/components/workbench/workbench";
import { RouteSkeleton } from "@/components/app/route-skeleton";

/**
 * /work/tasks/[id] — image or video workbench.
 *
 * The workbench is a focus surface: it renders its own toolbar and fills the
 * viewport, so it uses AppShell's bare variant (no sidebar, no content padding)
 * rather than the list-screen chrome (docs/DESIGN.md §3).
 */
export default function Page(props: PageProps<"/work/tasks/[id]">) {
  return (
    <AppShell role="contributor" bare>
      <Suspense fallback={<RouteSkeleton variant="workbench" />}>
        <WorkbenchRoute params={props.params} />
      </Suspense>
    </AppShell>
  );
}

async function WorkbenchRoute({
  params,
}: {
  params: PageProps<"/work/tasks/[id]">["params"];
}) {
  const { id } = await params;
  return <Workbench taskId={id} />;
}