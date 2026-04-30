import { BRANDS, PRODUCTS } from "@/lib/mock/products";
import { slugify } from "@/lib/utils";

export interface BrandProfile {
  name: string;
  slug: string;
  productCount: number;
  madeInNepalCount: number;
  categories: string[];
  concerns: string[];
  description: string;
  image: string;
}

export function getBrandProfiles(): BrandProfile[] {
  return BRANDS.map((name, index) => {
    const products = PRODUCTS.filter((product) => product.brand === name);
    const categories = Array.from(new Set(products.map((product) => product.category)));
    const concerns = Array.from(new Set(products.flatMap((product) => product.concernTags))).slice(0, 5);
    return {
      name,
      slug: slugify(name),
      productCount: products.length,
      madeInNepalCount: products.filter((product) => product.madeInNepal).length,
      categories,
      concerns,
      image: `/brands/brand-${(index % 8) + 1}.svg`,
      description: products.length
        ? `${name} appears in GLAMO NEPAL's mock catalog across ${categories.join(", ") || "beauty"}. Final supplier approval, images and brand authorization are required before launch.`
        : `${name} is reserved as a brand profile placeholder for future supplier-approved GLAMO NEPAL catalog data.`,
    };
  });
}

export function getBrandProfile(slug: string) {
  return getBrandProfiles().find((brand) => brand.slug === slug);
}

export function getBrandProducts(slug: string) {
  const profile = getBrandProfile(slug);
  if (!profile) return [];
  return PRODUCTS.filter((product) => product.brand === profile.name);
}
