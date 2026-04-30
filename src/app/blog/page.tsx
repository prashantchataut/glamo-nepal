import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, UserRound } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { BLOG_POSTS, getBlogBySlug, getRelatedPosts } from "@/lib/mock/blog";
import { absoluteUrl } from "@/lib/utils";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogBySlug(params.slug);
  return createMetadata({
    title: post?.title || "Blog Post Not Found",
    description: post?.excerpt || "GLAMO NEPAL beauty blog post.",
    path: `/blog/${params.slug}`,
    image: post?.image,
    type: "article",
  });
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogBySlug(params.slug);
  if (!post) notFound();
  const related = getRelatedPosts(post.slug, 2);
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
    <main className="bg-brand-bgLight py-10 md:py-12">
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])]} />
      <article className="container mx-auto max-w-4xl px-4 md:px-6">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary"><ArrowLeft size={16} /> Back to blog</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">{post.category}</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-brand-textPrimary md:text-6xl">{post.title}</h1>
        <p className="mt-4 text-lg leading-8 text-brand-textMuted">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-brand-textMuted">
          <span className="inline-flex items-center gap-2"><UserRound size={16} /> {post.author.name}</span>
          <span className="inline-flex items-center gap-2"><Clock size={16} /> {post.readTime}</span>
          <span>{post.date}</span>
        </div>
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[2rem] border border-border/70 bg-white shadow-sm">
          <Image src={post.image} alt={post.title} fill className="object-cover" sizes="100vw" priority />
        </div>
        <div className="mt-8 rounded-[2rem] border border-border/70 bg-white p-6 text-brand-textMuted shadow-sm md:p-8 [&_h2]:mt-8 [&_h2:first-child]:mt-0 [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:text-brand-textPrimary [&_p]:mt-4 [&_p]:leading-8" dangerouslySetInnerHTML={{ __html: post.content }} />
        <section className="mt-10">
          <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Related posts</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {related.map((item) => (
              <Link key={item.id} href={`/blog/${item.slug}`} className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:text-brand-primary hover:shadow-md">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-gold">{item.category}</p>
                <h3 className="mt-2 font-serif text-xl font-semibold text-brand-textPrimary">{item.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
