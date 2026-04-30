export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  author: { name: string; avatar: string };
  date: string;
  readTime: string;
}

export const BLOG_CATEGORIES = ["All", "Skincare", "Makeup", "Owner Notes", "Nepal Beauty", "Tutorial"];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "How to Build a Kathmandu Skincare Routine",
    slug: "kathmandu-skincare-routine",
    excerpt: "A practical GLAMO routine for sun, dust, humidity and seasonal dryness in Nepal.",
    content: `<h2>Start with the local context</h2><p>Kathmandu routines need to account for sun, dust, commute time, changing humidity and indoor dryness. The best frontend copy should stay helpful without making medical claims.</p><h2>Morning routine</h2><p>Cleanse gently, use a light serum if desired, apply moisturizer, then finish with a generous layer of SPF. Reapplication messaging should be added before launch.</p><h2>Evening routine</h2><p>Remove sunscreen and makeup fully, add a treatment product only when needed, and support the skin barrier with a comfortable moisturizer.</p>`,
    category: "Skincare",
    image: "/images/blog-skincare.svg",
    author: { name: "GLAMO Editorial", avatar: "/images/product-placeholder-cream.svg" },
    date: "2026-04-29",
    readTime: "5 min read",
  },
  {
    id: "2",
    title: "Festival Makeup That Lasts",
    slug: "festival-makeup-that-lasts",
    excerpt: "Primer, tint, lip and setting tips for Dashain, Tihar and wedding events.",
    content: `<h2>Plan for long wear</h2><p>Festival days often include travel, food, photos and long family gatherings. Lightweight layers usually last better than one heavy layer.</p><h2>Choose flexible textures</h2><p>Skin tint, cream blush and a comfortable matte lip can create a polished look while still feeling wearable.</p><h2>Keep it launch-safe</h2><p>Use supplier-approved claims for waterproof or transfer-proof language. Until verified, use softer wording like humidity-resistant or long-wear.</p>`,
    category: "Makeup",
    image: "/images/blog-makeup.svg",
    author: { name: "GLAMO Editorial", avatar: "/images/product-placeholder-lipstick.svg" },
    date: "2026-04-29",
    readTime: "4 min read",
  },
  {
    id: "3",
    title: "What GLAMO Still Needs Before Launch",
    slug: "glamo-launch-readiness",
    excerpt: "A transparent handoff note covering product images, supplier data, backend APIs, payments and legal review.",
    content: `<h2>Frontend completed as a mock-ready build</h2><p>The storefront includes production-style pages, mock data, checkout simulation, SEO files and backend-ready TypeScript contracts.</p><h2>Owner inputs still required</h2><p>Real product photography, supplier-approved product details, backend APIs, authentication, Khalti/eSewa/card credentials, courier/COD business rules, analytics IDs and legal policy review remain owner responsibilities.</p>`,
    category: "Owner Notes",
    image: "/images/blog-handoff.svg",
    author: { name: "GLAMO Handoff", avatar: "/images/product-placeholder-tools.svg" },
    date: "2026-04-29",
    readTime: "3 min read",
  },
];

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(currentSlug: string, limit = 3): BlogPost[] {
  const current = getBlogBySlug(currentSlug);
  if (!current) return BLOG_POSTS.slice(0, limit);
  const sameCategory = BLOG_POSTS.filter((p) => p.slug !== currentSlug && p.category === current.category);
  const others = BLOG_POSTS.filter((p) => p.slug !== currentSlug && p.category !== current.category);
  return [...sameCategory, ...others].slice(0, limit);
}
