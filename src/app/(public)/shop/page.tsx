import ShopPageContent from "./ShopPageContent";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = createMetadata({
  title: "Shop Beauty Products",
  description: "Browse GLAMO NEPAL skincare, makeup, haircare, bodycare, fragrance and beauty tools with Nepal-market filters and NPR pricing.",
  path: "/shop",
  keywords: ["shop beauty Nepal", "skincare Nepal", "makeup Nepal", "sunscreen Nepal", "GLAMO NEPAL shop"],
});

type SearchParams = Record<string, string | string[] | undefined>;

function normalizeSearchParams(searchParams?: SearchParams) {
  const normalized: Record<string, string> = {};
  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) normalized[key] = value.join(",");
    else if (typeof value === "string") normalized[key] = value;
  });
  return normalized;
}

export default function ShopPage({ searchParams }: { searchParams?: SearchParams }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }])} />
      <ShopPageContent initialSearchParams={normalizeSearchParams(searchParams)} />
    </>
  );
}
