import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOC_ARTICLES, generateDocStaticParams } from "./articles";
import { SITE_URL } from "@/components/marketing/JsonLd";

export function generateStaticParams() {
  return generateDocStaticParams();
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = DOC_ARTICLES[params.slug];
  if (!article) return {};
  const url = `${SITE_URL}/docs/${params.slug}`;
  return {
    title: `${article.title} | ReviewPilot Help`,
    description: article.description,
    alternates: { canonical: `/docs/${params.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      url,
      images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: ["/og-image.svg"],
    },
  };
}

function renderMarkdown(md: string): React.ReactNode[] {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;
  let tableRows: string[][] = [];
  let inTable = false;

  const flushList = () => {
    if (!listBuffer.length) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    nodes.push(
      <Tag key={nodes.length} className={listType === "ol" ? "my-4 ml-6 list-decimal space-y-1" : "my-4 ml-6 list-disc space-y-1"}>
        {listBuffer}
      </Tag>
    );
    listBuffer = [];
    listType = null;
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    const [header, , ...body] = tableRows;
    nodes.push(
      <div key={nodes.length} className="my-6 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {header.map((cell, i) => (
                <th key={i} className="border border-border bg-secondary px-4 py-2 text-left font-semibold">
                  {cell.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className="even:bg-secondary/40">
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-border px-4 py-2 text-muted-foreground">
                    {renderInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
      }
      const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) {
        return <Link key={i} href={m[2]} className="text-accent hover:underline">{m[1]}</Link>;
      }
      return <span key={i}>{p}</span>;
    });
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Table row
    if (line.startsWith("|")) {
      if (!inTable) { flushList(); inTable = true; }
      tableRows.push(line.split("|").slice(1, -1));
      continue;
    }
    if (inTable) { flushTable(); }

    if (!line.trim()) { flushList(); continue; }

    if (line.startsWith("## ")) {
      flushList();
      nodes.push(<h2 key={nodes.length} className="font-sans text-xl font-semibold tracking-tight mt-10 mb-3 text-foreground">{line.slice(3)}</h2>);
      continue;
    }
    if (line.startsWith("### ")) {
      flushList();
      nodes.push(<h3 key={nodes.length} className="font-sans text-base font-semibold tracking-tight mt-6 mb-2 text-foreground">{line.slice(4)}</h3>);
      continue;
    }
    if (line.startsWith("> ")) {
      flushList();
      nodes.push(
        <blockquote key={nodes.length} className="border-l-2 border-accent pl-4 my-4 italic text-muted-foreground bg-card/40 py-2 pr-4 rounded-r">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }
    if (line.match(/^[-*]\s/)) {
      if (listType !== "ul") { flushList(); listType = "ul"; }
      listBuffer.push(<li key={listBuffer.length} className="text-muted-foreground">{renderInline(line.replace(/^[-*]\s/, ""))}</li>);
      continue;
    }
    if (line.match(/^\d+\.\s/)) {
      if (listType !== "ol") { flushList(); listType = "ol"; }
      listBuffer.push(<li key={listBuffer.length} className="text-muted-foreground">{renderInline(line.replace(/^\d+\.\s/, ""))}</li>);
      continue;
    }
    flushList();
    nodes.push(<p key={nodes.length} className="my-3 text-muted-foreground leading-relaxed">{renderInline(line)}</p>);
  }
  flushList();
  flushTable();
  return nodes;
}

// Related articles in the same category
function getRelated(currentSlug: string, category: string) {
  return Object.entries(DOC_ARTICLES)
    .filter(([slug, a]) => slug !== currentSlug && a.category === category)
    .slice(0, 3);
}

export default function DocArticlePage({ params }: { params: { slug: string } }) {
  const article = DOC_ARTICLES[params.slug];
  if (!article) notFound();

  const related = getRelated(params.slug, article.category);

  return (
    <div className="py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Button variant="ghost" size="sm" className="mb-8 -ml-2" asChild>
          <Link href="/docs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Help Center
          </Link>
        </Button>

        {/* Category badge */}
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-accent" />
          <span className="text-sm text-accent font-medium">{article.category}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-sm text-muted-foreground">{article.readTime}</span>
        </div>

        {/* Title */}
        <h1 className="font-sans text-3xl font-semibold tracking-tight sm:text-4xl mb-4">
          {article.title}
        </h1>
        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          {article.description}
        </p>

        <hr className="border-border mb-10" />

        {/* Content */}
        <div className="prose-neutral">
          {renderMarkdown(article.content)}
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="font-sans text-lg font-semibold tracking-tight mb-4">Related articles</h2>
            <ul className="space-y-3">
              {related.map(([slug, a]) => (
                <li key={slug}>
                  <Link
                    href={`/docs/${slug}`}
                    className="flex items-center justify-between group rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm hover:border-accent/40 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium group-hover:text-accent transition-colors">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.readTime}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="relative mt-12 overflow-hidden rounded-3xl border border-border/60 bg-[linear-gradient(135deg,rgba(99,102,241,0.12)_0%,rgba(139,92,246,0.08)_50%,rgba(217,70,239,0.12)_100%)] p-8 text-center">
          <h3 className="font-sans text-lg font-semibold tracking-tight mb-2">Still have questions?</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Email us at{" "}
            <a href="mailto:dev.kolsawala45@gmail.com" className="text-accent hover:underline">
              dev.kolsawala45@gmail.com
            </a>{" "}
            or book a live demo and we&apos;ll walk you through it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="gradient" asChild>
              <Link href="/demo">Book a Demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="subtle" asChild>
              <Link href="/docs">Back to Help Center</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
