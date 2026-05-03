import { createMetadata } from "@/lib/seo";
import { OrderDetailClient } from "@/components/account/OrderDetailClient";

export function generateMetadata({ params }: { params: { id: string } }) {
  return createMetadata({
    title: `Order ${params.id}`,
    description: "View GLAMO NEPAL order details, delivery timeline and item summary.",
    path: `/account/orders/${params.id}`,
    noIndex: true,
  });
}

export default function OrderDetailPage() {
  return <OrderDetailClient />;
}