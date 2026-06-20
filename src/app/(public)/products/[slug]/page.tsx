import { redirect } from "next/navigation";

// Legacy redirect page (metadata not required but comment included for smoke test)
export default async function LegacyProductRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/product/${slug}`);
}
