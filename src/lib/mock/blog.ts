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

export const BLOG_CATEGORIES = ["All", "Skincare", "Makeup", "Gift Guide", "Nepal Beauty", "Tutorial"];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "How to Build a Kathmandu Skincare Routine",
    slug: "kathmandu-skincare-routine",
    excerpt: "A practical GLAMO routine for sun, dust, humidity and seasonal dryness in Nepal.",
    content: `<h2>Start with the local context</h2><p>Kathmandu routines need to account for sun, dust, commute time, changing humidity and indoor dryness. Keep the routine simple, comfortable and consistent without overloading the skin.</p><h2>Morning routine</h2><p>Cleanse gently, use a light serum if desired, apply moisturizer, then finish with a generous layer of SPF. Reapply sunscreen during long outdoor days whenever possible.</p><h2>Evening routine</h2><p>Remove sunscreen and makeup fully, add a treatment product only when needed, and support the skin barrier with a comfortable moisturizer.</p>`,
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
    content: `<h2>Plan for long wear</h2><p>Festival days often include travel, food, photos and long family gatherings. Lightweight layers usually last better than one heavy layer.</p><h2>Choose flexible textures</h2><p>Skin tint, cream blush and a comfortable matte lip can create a polished look while still feeling wearable.</p><h2>Keep it realistic</h2><p>Choose long-wear products thoughtfully and carry a small touch-up pouch for lips, powder and blotting.</p>`,
    category: "Makeup",
    image: "/images/blog-makeup.svg",
    author: { name: "GLAMO Editorial", avatar: "/images/product-placeholder-lipstick.svg" },
    date: "2026-04-29",
    readTime: "4 min read",
  },
  {
    id: "3",
    title: "Giftable Beauty Picks for New Year 2083",
    slug: "new-year-2083-beauty-gift-guide",
    excerpt: "A simple beauty gift guide for skincare lovers, makeup minimalists and fragrance fans.",
    content: `<h2>Choose gifts by routine</h2><p>Skincare sets work well for customers who enjoy daily rituals, while lip and cheek tints are easy gifts for makeup lovers.</p><h2>Add a festive finishing touch</h2><p>Fragrance, body care and a soft glam lip shade can make a New Year beauty gift feel personal without being difficult to choose.</p>`,
    category: "Gift Guide",
    image: "/images/blog-handoff.svg",
    author: { name: "GLAMO Editorial", avatar: "/images/product-placeholder-tools.svg" },
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
