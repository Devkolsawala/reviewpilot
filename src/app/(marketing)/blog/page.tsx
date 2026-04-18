import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd, SITE_URL } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "Review Management Blog — Tips & Guides | ReviewPilot",
  description:
    "Expert guides on Google review management, Play Store ratings, AI reply automation, and local SEO for Indian businesses. Practical advice, real templates.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Review Management Blog — Tips & Guides | ReviewPilot",
    description:
      "Practical guides on AI review management, Google Business Profile, Play Store ratings, and local SEO for Indian SMBs.",
    url: `${SITE_URL}/blog`,
    type: "website",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "ReviewPilot Blog — AI Review Management Guides" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPilot Blog — Review Management Guides",
    description: "Tips, templates, and guides for Indian businesses managing Google and Play Store reviews.",
    images: ["/og-image.svg"],
  },
};

const blogListSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "ReviewPilot Blog",
  description:
    "Expert guides on AI review management, Google Business Profile automation, Play Store rating improvement, and local SEO for Indian businesses.",
  url: `${SITE_URL}/blog`,
  publisher: {
    "@type": "Organization",
    name: "ReviewPilot",
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
  },
};

const POSTS = [
  {
    slug: "how-to-get-more-google-reviews-2026",
    title: "How to get more Google reviews in 2026: a complete guide for Indian businesses",
    excerpt:
      "The highest-converting methods for getting more Google reviews in India — SMS asks, QR codes, WhatsApp, timing, and the automation layer that 10× your volume.",
    category: "Guide",
    date: "April 2, 2026",
    author: "Dev Kolsawala",
    readTime: "11 min read",
    featured: true,
  },
  {
    slug: "how-to-reply-to-negative-google-reviews",
    title: "How to reply to negative Google reviews (15 templates that win customers back)",
    excerpt:
      "15 battle-tested reply templates covering restaurants, salons, apps, hotels, and even fake reviews — plus the 5 principles that turn critics into advocates.",
    category: "Templates",
    date: "April 5, 2026",
    author: "Aditya Raj Singh",
    readTime: "12 min read",
  },
  {
    slug: "best-review-management-software-india-2026",
    title: "Best review management software in India 2026: an honest comparison",
    excerpt:
      "Detailed, self-aware comparison of ReviewPilot, Birdeye, Podium, Famepilot, Simplify360, and AppFollow — with scoring on price, GBP, Play Store, and India fit.",
    category: "Comparison",
    date: "April 8, 2026",
    author: "Dev Kolsawala",
    readTime: "10 min read",
  },
  {
    slug: "play-store-review-management-2026",
    title: "Why Play Store reviews make or break your app (and how to manage them at scale)",
    excerpt:
      "Play Store rating is a revenue multiplier. Learn how to manage volume, the 350-char limit, multi-language replies, and the auto-reply strategy that lifts ratings.",
    category: "App Developers",
    date: "April 10, 2026",
    author: "Aditya Raj Singh",
    readTime: "13 min read",
  },
  {
    slug: "ai-vs-human-review-replies-2026",
    title: "AI vs human review replies: what actually works in 2026",
    excerpt:
      "A balanced take on AI vs human replies — quality, speed, detection risk, and the hybrid strategy most successful Indian businesses are quietly using today.",
    category: "AI",
    date: "April 12, 2026",
    author: "Dev Kolsawala",
    readTime: "10 min read",
  },
];

export default function BlogPage() {
  const [featured, ...rest] = POSTS;

  return (
    <div className="py-24 sm:py-32">
      <JsonLd data={blogListSchema} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Field notes
          </p>
          <h1 className="mt-3 font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
            The{" "}
            <span className="text-gradient-brand font-serif italic">
              ReviewPilot
            </span>{" "}
            blog
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Practical guides on AI review management, Google Business Profile
            automation, Play Store ratings, and local SEO — written for Indian
            businesses.
          </p>
        </div>

        {/* Featured */}
        <Link
          href={`/blog/${featured.slug}`}
          className="group mt-16 block overflow-hidden rounded-3xl border border-border/60 bg-card/40 backdrop-blur-sm transition-colors hover:border-accent/40"
        >
          <div className="relative grid gap-0 md:grid-cols-2">
            <div
              aria-hidden
              className="relative h-48 bg-[linear-gradient(135deg,#6366f1_0%,#8b5cf6_50%,#d946ef_100%)] md:h-auto"
            >
              <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
              <span className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                Featured · {featured.category}
              </span>
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-10">
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="font-mono uppercase tracking-wider">
                  {featured.date}
                </span>
                <span>·</span>
                <span>{featured.readTime}</span>
              </div>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-tight transition-colors group-hover:text-accent sm:text-3xl">
                {featured.title}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {featured.excerpt}
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-accent">
                Read the guide
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </Link>

        {/* Grid */}
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-2">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-colors hover:border-accent/40"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/80">
                  {post.category}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {post.readTime}
                </span>
              </div>
              <h2 className="mt-4 font-sans text-lg font-semibold tracking-tight transition-colors group-hover:text-accent">
                {post.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
              <div className="mt-5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {post.author} · {post.date}
                </span>
                <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
