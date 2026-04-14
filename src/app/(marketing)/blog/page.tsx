import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
    title: "How to Get More Google Reviews in 2026: A Complete Guide for Indian Businesses",
    excerpt:
      "The highest-converting methods for getting more Google reviews in India — SMS asks, QR codes, WhatsApp, timing, and the automation layer that 10× your volume.",
    category: "Guide",
    date: "April 2, 2026",
    author: "Dev Kolsawala",
    readTime: "11 min read",
  },
  {
    slug: "how-to-reply-to-negative-google-reviews",
    title: "How to Reply to Negative Google Reviews (15 Templates That Win Customers Back)",
    excerpt:
      "15 battle-tested reply templates covering restaurants, salons, apps, hotels, and even fake reviews — plus the 5 principles that turn critics into advocates.",
    category: "Templates",
    date: "April 5, 2026",
    author: "Aditya Raj Singh",
    readTime: "12 min read",
  },
  {
    slug: "best-review-management-software-india-2026",
    title: "Best Review Management Software in India 2026: Honest Comparison",
    excerpt:
      "Detailed, self-aware comparison of ReviewPilot, Birdeye, Podium, Famepilot, Simplify360, and AppFollow — with scoring on price, GBP, Play Store, and India fit.",
    category: "Comparison",
    date: "April 8, 2026",
    author: "Dev Kolsawala",
    readTime: "10 min read",
  },
  {
    slug: "play-store-review-management-2026",
    title: "Why Play Store Reviews Make or Break Your App (And How to Manage Them at Scale)",
    excerpt:
      "Play Store rating is a revenue multiplier. Learn how to manage volume, the 350-char limit, multi-language replies, and the auto-reply strategy that lifts ratings.",
    category: "App Developers",
    date: "April 10, 2026",
    author: "Aditya Raj Singh",
    readTime: "13 min read",
  },
  {
    slug: "ai-vs-human-review-replies-2026",
    title: "AI vs Human Review Replies: What Actually Works in 2026",
    excerpt:
      "A balanced take on AI vs human replies — quality, speed, detection risk, and the hybrid strategy most successful Indian businesses are quietly using today.",
    category: "AI",
    date: "April 12, 2026",
    author: "Dev Kolsawala",
    readTime: "10 min read",
  },
];

export default function BlogPage() {
  return (
    <div className="py-20 sm:py-28">
      <JsonLd data={blogListSchema} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-sm text-teal-600 mb-4">
            Review Management Guides
          </div>
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">Blog</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Practical guides on AI review management, Google Business Profile automation,
            Play Store ratings, and local SEO — written for Indian businesses.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow group">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-medium text-teal-600 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="font-heading text-lg font-semibold mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                    <span>{post.author} · {post.date}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
