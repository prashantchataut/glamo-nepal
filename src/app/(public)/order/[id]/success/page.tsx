import { redirect } from "next/navigation";

export default function LegacyOrderSuccessPage({ params }: { params: { id: string } }) {
  redirect(`/order-confirmation/${encodeURIComponent(params.id)}`);
}
