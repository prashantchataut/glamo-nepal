import { redirect } from "next/navigation";

export default async function LegacyOrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/order-confirmation/${encodeURIComponent(id)}`);
}
