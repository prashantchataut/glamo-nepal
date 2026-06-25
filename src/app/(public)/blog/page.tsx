import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { getServerBlogPost, getServerRelatedPosts } from "@/lib/server/blog";
import { BLOG_POSTS } from "@/lib/data/blog-content";
import { absoluteUrl } from "@/lib/utils";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import BlogPostClient from "./BlogPostClient";

export const revalidate = 600;
export const dynamicParams = true;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getServerBlogPost(slug);
  return createMetadata({
    title: post?.title ?? "Blog - GLAMO NEPAL",
    description: post?.excerpt ?? "Beauty tips, skincare routines and Nepal beauty advice from GLAMO NEPAL.",
    path: `/blog/${slug}`,
    image: post?.image,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getServerBlogPost(slug);
  if (!post) notFound();
  const related = await getServerRelatedPosts(post.slug, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: absoluteUrl(post.image),
    url: absoluteUrl(`/blog/${post.slug}`),
    author: { "@type": "Organization", name: post.author.name },
    publisher: {
      "@type": "Organization",
      name: "GLAMO NEPAL",
      logo: { "@type": "ImageObject", url: absoluteUrl("/images/logo.svg") },
    },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/blog/${post.slug}`),
    },
  };

  return (
    <>
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])]} />
      <BlogPostClient post={post} related={related} />
    </>
  );
}