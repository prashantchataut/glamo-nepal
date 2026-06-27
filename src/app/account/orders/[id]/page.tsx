import { createMetadata } from "@/lib/seo";
import { OrderDetailClient } from "@/components/account/OrderDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return createMetadata({
    title: `Order ${id}`,
    description: "View GLAMO NEPAL order details, delivery timeline and item summary.",
    path: `/account/orders/${id}`,
    noIndex: true,
  });
}

export default function OrderDetailPage() {
  return <OrderDetailClient />;
}