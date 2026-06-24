import { ReviewsView } from "@/components/admin/reviews/ReviewsView";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Reviews", description: "Moderate product reviews, skin feedback and Q&A patterns.", path: "/admin/reviews", noIndex: true });
export const dynamic = "force-dynamic";

export default function ReviewsPage() {
  return <ReviewsView />;
}
