import { redirect } from "next/navigation";

export default function LegacyProductRedirect({ params }: { params: { slug: string } }) {
  redirect(`/products/${params.slug}`);
}
