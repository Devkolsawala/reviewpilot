import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  JsonLd,
  SITE_URL,
  articleSchema,
  faqSchema,
  breadcrumbSchema,
} from "@/components/marketing/JsonLd";
import { CATEGORY_STYLES, getBlogCategory } from "@/components/blog/category";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { ToolCTA } from "@/components/tools/ToolCTA";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BLOG_POSTS, isLivePost, type BlogPost } from "./posts";

export function generateStaticParams() {
  // Consolidated posts (redirectTo set) are not statically generated — they are
  // 308-redirected to their canonical at the edge. Their files/entries persist.
  return Object.keys(BLOG_POSTS)
    .filter((slug) => isLivePost(BLOG_POSTS[slug]))
    .map((slug) => ({ slug }));
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
  let codeBuffer: string[] | null = null;

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

  const flushCode = () => {
    if (codeBuffer === null) return;
    nodes.push(
      <pre
        key={nodes.length}
        className="my-5 overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground"
      >
        <code>{codeBuffer.join("\n")}</code>
      </pre>
    );
    codeBuffer = null;
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
    if (codeBuffer !== null) {
      if (line.startsWith("```")) {
        flushCode();
      } else {
        codeBuffer.push(raw);
      }
      continue;
    }
    if (line.startsWith("```")) {
      flushParagraph();
      codeBuffer = [];
      continue;
    }
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
    if (line.startsWith("::analyzer-cta")) {
      flushParagraph();
      // Sentinel: ::analyzer-cta|<headline>|<body>:: — renders the shared
      // design-system CTA mid-article. Lines without this prefix are untouched,
      // so every other post renders byte-identically.
      const fields = line.replace(/::$/, "").split("|");
      const headline = fields[1]?.trim();
      const body = fields[2]?.trim();
      nodes.push(
        <ToolCTA
          key={nodes.length}
          headline={headline}
          body={body}
          buttonLabel="Analyze your app free"
          href="/tools/play-store-analyzer"
        />
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
  flushCode();
  flushParagraph();
  return nodes;
}

type RelatedPost = {
  slug: string;
  title: string;
  category: ReturnType<typeof getBlogCategory>;
  date: string;
  readTime: string;
};

// Up to 3 related posts: same category first (newest first), backfilled with the
// most-recent posts overall. Computed at build time so the /blog/<slug> hrefs are
// statically rendered and crawlable.
function getRelatedPosts(currentSlug: string): RelatedPost[] {
  const current = BLOG_POSTS[currentSlug];
  if (!current) return [];
  const currentCategory = getBlogCategory(current.tags);

  const all = Object.entries(BLOG_POSTS)
    .filter(([slug, post]) => slug !== currentSlug && isLivePost(post))
    .map(([slug, post]) => ({
      slug,
      title: post.title,
      category: getBlogCategory(post.tags),
      date: post.dateDisplay,
      readTime: post.readTime,
      datePublished: post.datePublished,
    }))
    .sort(
      (a, b) =>
        new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime()
    );

  const related = all.filter((post) => post.category === currentCategory);
  for (const post of all) {
    if (related.length >= 3) break;
    if (!related.some((r) => r.slug === post.slug)) related.push(post);
  }

  return related.slice(0, 3).map((post) => ({
    slug: post.slug,
    title: post.title,
    category: post.category,
    date: post.date,
    readTime: post.readTime,
  }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post: BlogPost | undefined = BLOG_POSTS[params.slug];
  if (!post) notFound();
  const category = getBlogCategory(post.tags);
  const categoryStyle = CATEGORY_STYLES[category];

  const article = articleSchema({
    title: post.title,
    description: post.metaDescription,
    slug: params.slug,
    datePublished: post.datePublished,
    author: post.author,
  });

  const breadcrumb = breadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Blog", url: `${SITE_URL}/blog` },
    { name: post.title, url: `${SITE_URL}/blog/${params.slug}` },
  ]);

  const faqs = post.faqs ?? [];
  const related = getRelatedPosts(params.slug);

  return (
    <div className="py-24 sm:py-28">
      <ReadingProgress />
      <JsonLd data={article} />
      <JsonLd data={breadcrumb} />
      {faqs.length > 0 && (
        <JsonLd
          data={faqSchema(faqs.map((f) => ({ question: f.q, answer: f.a })))}
        />
      )}
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

        {faqs.length > 0 && (
          <section className="mt-16">
            <h2 className="font-sans text-2xl font-semibold tracking-tight mb-6">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`}>
                  <AccordionTrigger className="text-left text-base font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

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

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-sans text-2xl font-semibold tracking-tight mb-6">
              Related reading
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((rp) => {
                const rpStyle = CATEGORY_STYLES[rp.category];
                return (
                  <Link
                    key={rp.slug}
                    href={`/blog/${rp.slug}`}
                    className="group relative flex flex-col rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-colors hover:border-accent/50"
                  >
                    <span
                      className={`inline-flex min-h-6 w-fit items-center rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-wider ${rpStyle.badge}`}
                    >
                      {rp.category}
                    </span>
                    <h3 className="mt-4 font-sans text-lg font-semibold tracking-tight text-foreground decoration-transparent decoration-2 underline-offset-4 transition-[text-decoration-color] duration-200 group-hover:underline group-hover:decoration-accent">
                      {rp.title}
                    </h3>
                    <div className="mt-auto flex items-center gap-2 pt-6 font-mono text-xs text-muted-foreground">
                      <span>{rp.date}</span>
                      <span aria-hidden="true">/</span>
                      <span>{rp.readTime}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
