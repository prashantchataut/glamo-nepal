import { Product } from "@/store/useCartStore";
import { PRODUCTS, CATEGORIES, BRANDS, SKIN_TYPES, CONCERNS, SORT_OPTIONS, TRENDING_SEARCHES } from "@/lib/mock/products";

export { CATEGORIES, BRANDS, SKIN_TYPES, CONCERNS, SORT_OPTIONS, TRENDING_SEARCHES };
export { PRODUCTS as MOCK_PRODUCTS } from "@/lib/mock/products";

export const SITE_CONFIG = {
  name: "GLAMO",
  tagline: "Nepal",
  fullTitle: "GLAMO NEPAL",
  description: "Premium Nepali beauty, cosmetics and personal care curated from Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal.",
  phone: "+977 9818212188",
  whatsapp: "https://wa.me/9779818212188",
  email: "hello@glamonepal.com",
  website: "https://glamonepal.com",
  address: "Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal",
  currency: "NPR",
  instagramHandle: "@glamo_nepal",
  paymentMethods: ["Khalti", "eSewa", "Cash on Delivery", "Cards"],
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/glamo_nepal/",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/glamonepal",
  },
  logo: "/images/logo.svg",
  openingHours: "Mo-Fr 10:00-19:00, Sa 10:00-17:00",
  coordinates: { latitude: 27.6944, longitude: 85.3244 },
};

export const NAV_CATEGORIES = CATEGORIES.map((c) => ({ name: c.name, href: `/shop?category=${c.slug}`, description: c.description }));
export const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop", hasMegaMenu: true },
  { name: "New Arrivals", href: "/collections/new-arrivals" },
  { name: "Routines", href: "/routines" },
  { name: "About", href: "/about" },
];

export const ANNOUNCEMENT_MESSAGES = [
  { icon: "truck" as const, text: "FREE DELIVERY INSIDE VALLEY ON ORDERS OVER NPR 2,500" },
  { icon: "shield" as const, text: "AUTHENTIC BEAUTY CURATION" },
  { icon: "leaf" as const, text: "MADE IN NEPAL PICKS AVAILABLE" },
  { icon: "phone" as const, text: "+977 9818212188" },
];

export const HERO_SLIDES = [
  {
    id: 1,
    title1: "The",
    title2: "Festival Glow",
    subtitle: "Fresh skincare, soft glam makeup and gifting edits curated for celebrations across Nepal.",
    cta: "Shop Festival Edit",
    ctaLink: "/collections/festival-ready",
    image: "/images/editorial/hero-editorial.svg",
    bgColor: "bg-brand-surfaceWarm",
    annotation: "Festival Edit",
  },
  {
    id: 2,
    title1: "Everyday",
    title2: "Beauty Essentials",
    subtitle: "Discover bestsellers for bright mornings, polished workdays and effortless evening touch-ups.",
    cta: "Shop Best Sellers",
    ctaLink: "/collections/best-sellers",
    image: "/images/editorial/shop-collage.svg",
    bgColor: "bg-brand-primary-light",
    annotation: "Best Sellers",
  },
  {
    id: 3,
    title1: "Made in",
    title2: "Nepal Favorites",
    subtitle: "Celebrate local beauty with curated picks, thoughtful gifting ideas and easy NPR shopping.",
    cta: "Shop Local Picks",
    ctaLink: "/collections/made-in-nepal",
    image: "/images/editorial/new-year-editorial.svg",
    bgColor: "bg-brand-surfacePink",
    annotation: "Local Love",
  },
];

export const CATEGORY_PILLS = CATEGORIES.slice(0, 6).map((category) => ({
  id: category.slug,
  name: category.name,
  image: category.image,
  link: `/category/${category.slug}`,
}));

export const TRUST_BADGES = [
  { icon: "heart" as const, text: "Beauty advice in Nepal" },
  { icon: "shield" as const, text: "Authenticity-first catalog" },
  { icon: "sparkles" as const, text: "Premium GLAMO styling" },
  { icon: "leaf" as const, text: "Made in Nepal filters" },
  { icon: "award" as const, text: "Curated bestsellers" },
];

export const FEATURED_PRODUCTS: Product[] = PRODUCTS.filter((p) => p.isFeatured).slice(0, 8);
export const PROMO_BANNERS = [
  { id: 1, title: "Festival Beauty Edit", subtitle: "Curated skincare, lip and fragrance picks for celebrations and gifting.", cta: "Shop the Edit", ctaLink: "/collections/festival-ready", tag: "Festival", image: "/images/editorial/new-year-editorial.svg", gradient: "from-black/80 via-black/30 to-transparent" },
  { id: 2, title: "Visit Our Store", subtitle: "Find us at Naya Baneshwor, Mantra In & Out Square, Kathmandu.", cta: "Get Directions", ctaLink: "/contact", tag: "In Store", image: "/images/editorial/shop-collage.svg", gradient: "from-brand-primary/90 via-[#8B3A8F]/40 to-transparent" },
];
export const SHOP_CATEGORIES = CATEGORIES.map((c) => ({ id: c.slug, name: c.name, image: c.image, slug: c.slug }));
export const GLOW_EDIT_TABS = ["Best Sellers", "New Arrivals", "On Sale", "Made in Nepal"];
export const GLOW_EDIT_PRODUCTS: Record<string, Product[]> = {
  "Best Sellers": PRODUCTS.filter((p) => p.isBestSeller).slice(0, 4),
  "New Arrivals": PRODUCTS.filter((p) => p.isNewArrival).slice(0, 4),
  "On Sale": PRODUCTS.filter((p) => p.badge === "Sale" || p.originalPrice).slice(0, 4),
  "Made in Nepal": PRODUCTS.filter((p) => p.madeInNepal).slice(0, 4),
};
export const INSTAGRAM_POSTS = [
  { id: "ig1", image: "/images/product-placeholder-haircare.svg", caption: "@glamo_nepal Festival glow essentials" },
  { id: "ig2", image: "/images/product-placeholder-bodycare.svg", caption: "@glamo_nepal Daily skincare rituals" },
  { id: "ig3", image: "/images/promo-store.svg", caption: "@glamo_nepal Beauty tools and more" },
  { id: "ig4", image: "/images/product-placeholder-cream.svg", caption: "@glamo_nepal Serum season" },
  { id: "ig5", image: "/images/promo-new-year.svg", caption: "@glamo_nepal Made for you" },
  { id: "ig6", image: "/images/product-placeholder-serum-2.svg", caption: "@glamo_nepal Body care love" },
];

export const BRAND_LOGOS = BRANDS.slice(0, 8).map((name, index) => ({ id: index + 1, name, image: `/brands/brand-${index + 1}.svg` }));
