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
};

export const NAV_CATEGORIES = CATEGORIES.map((c) => ({ name: c.name, href: `/shop?category=${c.slug}`, description: c.description }));
export const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop", hasMegaMenu: true },
  { name: "Our Story", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

export const ANNOUNCEMENT_MESSAGES = [
  { icon: "truck" as const, text: "FREE DELIVERY INSIDE VALLEY ON ORDERS OVER NPR 2,500" },
  { icon: "shield" as const, text: "AUTHENTIC BEAUTY CURATION" },
  { icon: "leaf" as const, text: "MADE IN NEPAL PICKS AVAILABLE" },
  { icon: "phone" as const, text: "+977 9818212188" },
];

export const HERO_SLIDES = [
  { id: 1, title1: "Kathmandu", title2: "Glow Edit", subtitle: "Premium skincare, makeup and beauty rituals curated for Nepal's climate and pace.", cta: "Shop New In", ctaLink: "/shop?sort=newest", image: "/images/hero-glow.svg", bgColor: "bg-brand-bgLight", annotation: "GLAMO NEPAL" },
  { id: 2, title1: "Festival", title2: "Ready Beauty", subtitle: "Build your Dashain, Tihar and wedding-season vanity with reliable essentials.", cta: "Explore Makeup", ctaLink: "/shop?category=makeup", image: "/images/hero-festival.svg", bgColor: "bg-[#F4E9E2]", annotation: "NPR Pricing" },
  { id: 3, title1: "Made In", title2: "Nepal Picks", subtitle: "Discover Nepal-made beauty favorites with transparent mock audit notes for handoff.", cta: "Shop Local", ctaLink: "/shop?madeInNepal=1", image: "/images/hero-nepal.svg", bgColor: "bg-[#E6F0EC]", annotation: "Local Love" },
];

export const CATEGORY_PILLS = PRODUCTS.slice(0, 8).map((p, index) => ({ id: index + 1, name: p.name, image: p.image, link: `/product/${p.slug}` }));
export const TRUST_BADGES = [
  { icon: "heart" as const, text: "Beauty advice in Nepal" },
  { icon: "shield" as const, text: "Authenticity-first catalog" },
  { icon: "sparkles" as const, text: "Premium GLAMO styling" },
  { icon: "leaf" as const, text: "Made in Nepal filters" },
  { icon: "award" as const, text: "Backend-ready contracts" },
];
export const FEATURED_PRODUCTS: Product[] = PRODUCTS.filter((p) => p.isFeatured).slice(0, 8);
export const PROMO_BANNERS = [
  { id: 1, title: "Dashain Beauty Refresh", subtitle: "Curated skincare, lip and fragrance picks for festive gifting.", cta: "Shop Festival Picks", ctaLink: "/shop?concerns=Long%20Wear", tag: "Festival Edit", image: "/images/promo-dashain.svg", gradient: "from-black/80 via-black/30 to-transparent" },
  { id: 2, title: "Naya Baneshwor Pickup", subtitle: "Frontend-ready pickup messaging for GLAMO NEPAL's physical location.", cta: "Contact Store", ctaLink: "/contact", tag: "Store Info", image: "/images/promo-store.svg", gradient: "from-[#8B3A8F]/90 via-[#8B3A8F]/40 to-transparent" },
];
export const SHOP_CATEGORIES = CATEGORIES.map((c) => ({ id: c.slug, name: c.name, image: c.image, slug: c.slug }));
export const GLOW_EDIT_TABS = ["Best Sellers", "New Arrivals", "On Sale", "Made in Nepal"];
export const GLOW_EDIT_PRODUCTS: Record<string, Product[]> = {
  "Best Sellers": PRODUCTS.filter((p) => p.isBestSeller).slice(0, 4),
  "New Arrivals": PRODUCTS.filter((p) => p.isNewArrival).slice(0, 4),
  "On Sale": PRODUCTS.filter((p) => p.badge === "Sale" || p.originalPrice).slice(0, 4),
  "Made in Nepal": PRODUCTS.filter((p) => p.madeInNepal).slice(0, 4),
};
export const INSTAGRAM_POSTS = PRODUCTS.slice(0, 6).map((p) => ({ id: p.id, image: p.image, caption: `${SITE_CONFIG.instagramHandle} ${p.name}` }));
export const BLOG_POSTS = [
  { id: 1, title: "How to Build a Kathmandu Skincare Routine", category: "Skincare", excerpt: "A simple routine framework for sun, dust, humidity and seasonal dryness.", image: "/images/blog-skincare.svg", slug: "kathmandu-skincare-routine" },
  { id: 2, title: "Festival Makeup That Lasts", category: "Makeup", excerpt: "Primer, tint, lip and setting tips for Dashain, Tihar and wedding events.", image: "/images/blog-makeup.svg", slug: "festival-makeup-that-lasts" },
  { id: 3, title: "What GLAMO Still Needs Before Launch", category: "Owner Notes", excerpt: "Product images, supplier-approved claims, legal policy review and payment credentials.", image: "/images/blog-handoff.svg", slug: "glamo-launch-readiness" },
];
export const BRAND_LOGOS = BRANDS.slice(0, 8).map((name, index) => ({ id: index + 1, name, image: `/brands/brand-${index + 1}.svg` }));
