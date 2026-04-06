import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, guides, and insights on review management, local SEO, and app store optimization.",
};

const POSTS = [
  {
    slug: "how-to-reply-google-reviews",
    title: "How to Reply to Google Reviews: The Complete Guide (2026)",
    excerpt:
      "Learn the best practices for replying to positive, negative, and neutral Google Business reviews with real examples.",
    category: "Guide",
    date: "March 25, 2026",
    readTime: "8 min read",
  },
  {
    slug: "play-store-review-management",
    title: "Play Store Review Management: A Developer's Guide",
    excerpt:
      "How to manage Google Play Store reviews at scale, improve your app rating, and reduce churn through better review responses.",
    category: "Guide",
    date: "March 20, 2026",
    readTime: "6 min read",
  },
  {
    slug: "reviewpilot-vs-competitors",
    title: "ReviewPilot vs Birdeye vs Podium: Honest Comparison (2026)",
    excerpt:
      "A detailed comparison of review management platforms for Indian businesses. Features, pricing, and real user experiences.",
    category: "Comparison",
    date: "March 15, 2026",
    readTime: "10 min read",
  },
];

export default function BlogPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">Blog</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Tips and guides on review management, local SEO, and ASO.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-medium text-teal-600 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="font-heading text-lg font-semibold mb-2 group-hover:text-teal-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{post.date}</span>
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
