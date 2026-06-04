import { BLOG_POSTS, getBlogBySlug as getBlogBySlugFromCatalog, getRelatedPosts as getRelatedPostsFromCatalog, type BlogPost } from "@/lib/data/blog-content";
import { fetchBlogPosts, fetchBlogPost } from "@/lib/api/blog";

let apiAvailable: boolean | null = null;
let apiCheckExpiry = 0;
const API_CHECK_TTL = 5 * 60 * 1000; // 5 minutes

async function checkApiAvailable(): Promise<boolean> {
  if (apiAvailable !== null && Date.now() < apiCheckExpiry) return apiAvailable;
  try {
    await fetchBlogPosts({ limit: 1 });
    apiAvailable = true;
  } catch {
    apiAvailable = false;
  }
  apiCheckExpiry = Date.now() + API_CHECK_TTL;
  return apiAvailable;
}

export type { BlogPost };
export { BLOG_CATEGORIES } from "@/lib/data/blog-content";

export async function getBlogPosts(params?: { page?: number; limit?: number; category?: string }): Promise<{ posts: BlogPost[]; total: number }> {
  if (await checkApiAvailable()) {
    try {
      return await fetchBlogPosts(params);
    } catch {
      apiAvailable = false;
      apiCheckExpiry = Date.now() + API_CHECK_TTL;
    }
  }
  let posts = [...BLOG_POSTS];
  if (params?.category) posts = posts.filter((p) => p.category === params.category);
  const page = params?.page ?? 1;
  const limit = params?.limit ?? posts.length;
  const start = (page - 1) * limit;
  return { posts: posts.slice(start, start + limit), total: posts.length };
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  if (await checkApiAvailable()) {
    try {
      return await fetchBlogPost(slug);
    } catch {
      apiAvailable = false;
      apiCheckExpiry = Date.now() + API_CHECK_TTL;
    }
  }
  return getBlogBySlugFromCatalog(slug) ?? null;
}

export async function getRelatedPosts(slug: string, limit = 3): Promise<BlogPost[]> {
  return getRelatedPostsFromCatalog(slug, limit);
}

export const BLOG_POSTS_SYNC = BLOG_POSTS;