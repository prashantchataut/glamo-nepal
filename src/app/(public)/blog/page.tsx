import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBlogPost, getRelatedPosts, getBlogPosts } from "@/lib/data/blog";
import { absoluteUrl } from "@/lib/utils";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import BlogPostClient from "./BlogPostClient";

export async function generateStaticParams() {
  const { posts } = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  return createMetadata({
    title: post?.title ?? "Blog — GLAMO NEPAL",
    description: post?.excerpt ?? "Beauty tips, skincare routines and Nepal beauty advice from GLAMO NEPAL.",
    path: `/blog/${params.slug}`,
    image: post?.image,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post.slug, 3);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: absoluteUrl(post.image),
    author: { "@type": "Organization", name: post.author.name },
    publisher: { "@type": "Organization", name: "GLAMO NEPAL" },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };

  return (
    <>
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])]} />
      <BlogPostClient post={post} related={related} />
    </>
  );
}