import { Suspense } from "react";
import { JobDetail } from "@/components/buyer/job-detail";
import { RouteSkeleton } from "@/components/app/route-skeleton";

/**
 * /buyer/jobs/[id] — job detail. The static shell renders while `await params`
 * streams inside Suspense, so the route still prerenders.
 */
export default function Page(props: PageProps<"/buyer/jobs/[id]">) {
  return (
    <Suspense fallback={<RouteSkeleton variant="detail" />}>
      <JobDetailRoute params={props.params} />
    </Suspense>
  );
}

async function JobDetailRoute({
  params,
}: {
  params: PageProps<"/buyer/jobs/[id]">["params"];
}) {
  const { id } = await params;
  return <JobDetail jobId={id} />;
}
