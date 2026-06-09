import { Suspense } from "react";
import TrackOrderClient from "./TrackOrderClient";
import { OrderTrackSkeleton } from "@/components/common/SkeletonComponents";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Track Your Order",
  description: "Look up your GLAMO Nepal order status by order number. No login required.",
  path: "/track-order",
  noIndex: true,
});

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<OrderTrackSkeleton />}>
      <TrackOrderClient />
    </Suspense>
  );
}