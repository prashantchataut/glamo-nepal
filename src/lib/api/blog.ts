import { apiRequest } from "@/lib/api/client";
import type { BlogPost } from "@/lib/mock/blog";

export async function fetchBlogPosts(params?: { page?: number; limit?: number; category?: string }): Promise<{ posts: BlogPost[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.category) searchParams.set("category", params.category);
  const query = searchParams.toString();
  const path = query ? `/blog/posts?${query}` : "/blog/posts";
  const response = await apiRequest<{ data: BlogPost[]; meta: { total: number } }>(path);
  return { posts: response.data?.data ?? [], total: response.data?.meta?.total ?? 0 };
}

export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  const response = await apiRequest<BlogPost>(`/blog/posts/${slug}`);
  return response.data ?? null;
}

export async function fetchRelatedPosts(slug: string, limit = 3): Promise<BlogPost[]> {
  const response = await apiRequest<{ data: BlogPost[] }>(`/blog/posts/${slug}/related?limit=${limit}`);
  return response.data?.data ?? [];
}