import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";
import { CATEGORY_STYLES, getBlogCategory } from "@/components/blog/category";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { BLOG_POSTS, type BlogPost } from "./posts";

export function generateStaticParams() {
  return Object.keys(BLOG_POSTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = BLOG_POSTS[params.slug];
  if (!post) return {};
  const url = `${SITE_URL}/blog/${params.slug}`;
  return {
    title: `${post.metaTitle || post.title}`,
    description: post.metaDescription,
    alternates: { canonical: `/blog/${params.slug}` },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: "article",
      url,
      publishedTime: post.datePublished,
      authors: [post.author],
      images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.metaDescription,
      images: ["/og-image.svg"],
    },
  };
}

function renderMarkdown(md: string): React.ReactNode {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let buffer: string[] = [];

  const flushParagraph = () => {
    if (!buffer.length) return;
    const text = buffer.join(" ");
    nodes.push(
      <p key={nodes.length} className="my-4 text-muted-foreground leading-relaxed">
        {renderInline(text)}
      </p>
    );
    buffer = [];
  };

  const renderInline = (text: string): React.ReactNode => {
    // bold **x**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return (
          <strong key={i} className="text-foreground font-semibold">
            {p.slice(2, -2)}
          </strong>
        );
      }
      // links [text](url)
      const linkMatches = p.split(/(\[[^\]]+\]\([^)]+\))/g);
      return (
        <span key={i}>
          {linkMatches.map((lm, j) => {
            const m = lm.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (m) {
              return (
                <Link key={j} href={m[2]} className="text-accent hover:underline">
                  {m[1]}
                </Link>
              );
            }
            return <span key={j}>{lm}</span>;
          })}
        </span>
      );
    });
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      nodes.push(
        <h2 key={nodes.length} className="font-sans text-2xl font-semibold tracking-tight mt-10 mb-4">
          {line.replace("## ", "")}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      nodes.push(
        <h3 key={nodes.length} className="font-sans text-xl font-semibold tracking-tight mt-6 mb-3">
          {line.replace("### ", "")}
        </h3>
      );
      continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph();
      nodes.push(
        <blockquote
          key={nodes.length}
          className="border-l-2 border-accent pl-4 my-4 italic text-muted-foreground"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }
    if (line.match(/^[-*]\s/)) {
      flushParagraph();
      nodes.push(
        <li key={nodes.length} className="ml-6 list-disc my-1 text-muted-foreground">
          {renderInline(line.replace(/^[-*]\s/, ""))}
        </li>
      );
      continue;
    }
    if (line.match(/^\d+\.\s/)) {
      flushParagraph();
      nodes.push(
        <li key={nodes.length} className="ml-6 list-decimal my-1 text-muted-foreground">
          {renderInline(line.replace(/^\d+\.\s/, ""))}
        </li>
      );
      continue;
    }
    buffer.push(line);
  }
  flushParagraph();
  return nodes;
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post: BlogPost | undefined = BLOG_POSTS[params.slug];
  if (!post) notFound();
  const category = getBlogCategory(post.tags);
  const categoryStyle = CATEGORY_STYLES[category];

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    image: SITE_OG,
    datePublished: post.datePublished,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "ReviewPilot",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
    },
    mainEntityOfPage: `${SITE_URL}/blog/${params.slug}`,
    keywords: post.tags.join(", "),
  };

  return (
    <div className="py-24 sm:py-28">
      <ReadingProgress />
      <JsonLd data={blogSchema} />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Blog
        </Link>

        <h1 className="mb-5 font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {post.title}
        </h1>

        <div className="mb-12 flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
          <span
            className={`rounded-full border px-2.5 py-1 uppercase tracking-wider ${categoryStyle.badge}`}
          >
            {category}
          </span>
          <span>{post.author}</span>
          <span aria-hidden="true">/</span>
          <time dateTime={post.datePublished}>{post.dateDisplay}</time>
          <span aria-hidden="true">/</span>
          <span>{post.readTime}</span>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {renderMarkdown(post.content)}
        </div>

        <div className="mt-16 relative overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,rgba(99,102,241,0.12)_0%,rgba(139,92,246,0.08)_50%,rgba(217,70,239,0.12)_100%)] p-10 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid mask-radial-fade opacity-30"
          />
          <div className="relative">
            <h3 className="font-sans text-2xl font-semibold tracking-tight">
              Ready to automate your reviews?
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              7-day free trial. No credit card. From $16/mo.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="gradient" size="lg" asChild>
                <Link href="/signup">
                  Start free trial <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="subtle" size="lg" asChild>
                <Link href="/how-it-works">See how it works</Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
