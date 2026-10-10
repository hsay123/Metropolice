import { Suspense } from "react";
import { JobWizard } from "@/components/buyer/job-wizard";
import { PageHeader } from "@/components/domain/page-header";
import { RouteSkeleton } from "@/components/app/route-skeleton";

/**
 * /buyer/jobs/new — the funding wizard (AGENTS.md A5). The wizard reads the
 * current time and library-generated ids, so it sits inside a Suspense boundary:
 * the static shell renders on the server and the form renders on the client.
 */
export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        context="Buyer"
        title="Post a labelling job"
        description="Define the schema, the rubric and the reward. Fund it to open it to contributors."
      />
      <Suspense fallback={<RouteSkeleton variant="detail" />}>
        <JobWizard />
      </Suspense>
    </div>
  );
}
