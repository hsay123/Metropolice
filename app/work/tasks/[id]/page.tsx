import { Suspense } from "react";
import { Workbench } from "@/components/workbench/workbench";
import { RouteSkeleton } from "@/components/app/route-skeleton";

/** /work/tasks/[id] — image or video workbench (Phase 1 builds the image branch). */
export default function Page(props: PageProps<"/work/tasks/[id]">) {
  return (
    <Suspense fallback={<RouteSkeleton variant="workbench" />}>
      <WorkbenchRoute params={props.params} />
    </Suspense>
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
