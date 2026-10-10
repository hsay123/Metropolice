import { Suspense } from "react";
import { ReviewConsole } from "@/components/review/review-console";
import { RouteSkeleton } from "@/components/app/route-skeleton";

/** /review/[submissionId] — the review console for one submission. */
export default function Page(props: PageProps<"/review/[submissionId]">) {
  return (
    <Suspense fallback={<RouteSkeleton variant="workbench" />}>
      <ConsoleRoute params={props.params} />
    </Suspense>
  );
}

async function ConsoleRoute({
  params,
}: {
  params: PageProps<"/review/[submissionId]">["params"];
}) {
  const { submissionId } = await params;
  return <ReviewConsole submissionId={submissionId} />;
}
