import { Suspense } from "react";
import { ReceiptView } from "@/components/public/receipt-view";
import { RouteSkeleton } from "@/components/app/route-skeleton";

/**
 * /receipts/[id] — the public receipt. The static shell renders while `await
 * params` streams inside Suspense, so the route still prerenders (Next.js 16:
 * params is a Promise; see node_modules/next/dist/docs).
 */
export default function Page(props: PageProps<"/receipts/[id]">) {
  return (
    <Suspense fallback={<RouteSkeleton variant="detail" />}>
      <ReceiptRoute params={props.params} />
    </Suspense>
  );
}

async function ReceiptRoute({
  params,
}: {
  params: PageProps<"/receipts/[id]">["params"];
}) {
  const { id } = await params;
  return <ReceiptView receiptId={id} />;
}
