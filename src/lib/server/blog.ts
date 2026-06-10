import { BLOG_POSTS, getBlogBySlug as getLocalBlogBySlug, getRelatedPosts as getLocalRelatedPosts, type BlogPost } from "@/lib/data/blog-content";
import { backendJson } from "./backend";

interface DbBlogRow {
  id: string; title: string; slug: string; excerpt?: string | null; content?: string | null;
  category?: string | null; cover_image_url?: string | null; published_at?: string | null;
  created_at?: string | null; read_time_minutes?: number | null;
}

const DEFAULT_AUTHOR = { name: "GLAMO Editorial", avatar: "/images/editorial/newsletter-vanity.svg" };

function mapDbBlog(row: Record<string, unknown>): BlogPost {
  const publishedAt = (row.published_at as string | null) || (row.created_at as string | null) || new Date().toISOString();
  const readMinutes = Number(row.read_time_minutes) || 4;
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    slug: String(row.slug ?? ""),
    excerpt: String(row.excerpt ?? ""),
    content: String(row.content ?? ""),
    category: String(row.category ?? "Skincare"),
    image: (row.cover_image_url as string | null) || "/images/editorial/newsletter-vanity.svg",
    author: DEFAULT_AUTHOR,
    date: publishedAt.slice(0, 10),
    readTime: `${readMinutes} min read`,
  };
}

export async function getServerBlogPosts(params?: { page?: number; limit?: number; category?: string }): Promise<{ posts: BlogPost[]; total: number }> {
  try {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    query.set("page", String(params?.page ?? 1));
    query.set("limit", String(params?.limit ?? 50));
    const payload = await backendJson<{ success?: boolean; data?: DbBlogRow[]; total?: number }>(`/blogs?${query.toString()}`);
    if (Array.isArray(payload?.data) && payload.data.length > 0) {
      return { posts: payload.data.map((row) => mapDbBlog(row as unknown as Record<string, unknown>)), total: payload.total ?? payload.data.length };
    }
  } catch {}
  let posts = [...BLOG_POSTS];
  if (params?.category) posts = posts.filter((p) => p.category === params.category);
  return { posts: posts.slice(0, params?.limit ?? posts.length), total: posts.length };
}

export async function getServerBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const payload = await backendJson<{ success?: boolean; data?: DbBlogRow }>(`/blogs/${encodeURIComponent(slug)}`);
    if (payload?.data) return mapDbBlog(payload.data as unknown as Record<string, unknown>);
  } catch {}
  return getLocalBlogBySlug(slug) ?? null;
}

export async function getServerRelatedPosts(slug: string, limit = 3): Promise<BlogPost[]> {
  try {
    const { posts } = await getServerBlogPosts({ limit: limit + 1 });
    const related = posts.filter((p) => p.slug !== slug).slice(0, limit);
    if (related.length > 0) return related;
  } catch {}
  return getLocalRelatedPosts(slug, limit);
}