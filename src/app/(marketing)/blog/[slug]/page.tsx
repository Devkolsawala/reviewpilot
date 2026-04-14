import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd, SITE_URL, SITE_OG } from "@/components/marketing/JsonLd";
import { BLOG_POSTS, type BlogPost } from "./posts";

export function generateStaticParams() {
  return Object.keys(BLOG_POSTS).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
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
                <Link key={j} href={m[2]} className="text-teal-600 hover:underline">
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
        <h2 key={nodes.length} className="font-heading text-2xl font-bold mt-10 mb-4">
          {line.replace("## ", "")}
        </h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph();
      nodes.push(
        <h3 key={nodes.length} className="font-heading text-xl font-semibold mt-6 mb-3">
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
          className="border-l-4 border-teal-500 pl-4 my-4 italic text-muted-foreground"
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
    <div className="py-20">
      <JsonLd data={blogSchema} />
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" className="mb-8" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((t) => (
            <span
              key={t}
              className="text-xs font-medium text-teal-600 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded"
            >
              {t}
            </span>
          ))}
        </div>

        <h1 className="font-heading text-3xl font-bold sm:text-4xl mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-10">
          <span>By {post.author}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.datePublished}>{post.dateDisplay}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readTime}</span>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {renderMarkdown(post.content)}
        </div>

        <div className="mt-16 rounded-xl border-2 border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 p-8 text-center">
          <h3 className="font-heading text-xl font-bold mb-2">
            Ready to automate your reviews?
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Start your free 7-day trial. No credit card. Plans from ₹1,500/mo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/signup">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/how-it-works">See How It Works</Link>
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
