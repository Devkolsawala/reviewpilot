import type { Metadata } from "next";
import { JsonLd, SITE_URL } from "@/components/marketing/JsonLd";
import { BlogGrid, type BlogGridPost } from "@/components/blog/BlogGrid";
import { BlogHero } from "@/components/blog/BlogHero";
import { getBlogCategory } from "@/components/blog/category";
import { BLOG_POSTS } from "./[slug]/posts";

export const metadata: Metadata = {
  title: "Review Management Blog - Guides for Indian Businesses | ReviewPilot",
  description:
    "Practical guides on Google Business Profile reviews, Play Store ratings, WhatsApp automation, and AI reply strategies for Indian businesses and app developers.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Review Management Blog - Guides for Indian Businesses | ReviewPilot",
    description:
      "Practical guides on Google Business Profile reviews, Play Store ratings, WhatsApp automation, and AI reply strategies for Indian businesses and app developers.",
    url: `${SITE_URL}/blog`,
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "ReviewPilot Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Review Management Blog - ReviewPilot",
    description:
      "Guides for Indian businesses managing Google reviews, Play Store ratings, WhatsApp automation, and AI replies.",
    images: ["/og-image.svg"],
  },
};

const blogListSchema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "ReviewPilot Blog",
  description:
    "Practical guides on Google Business Profile reviews, Play Store ratings, WhatsApp automation, and AI reply strategies for Indian businesses and app developers.",
  url: `${SITE_URL}/blog`,
  publisher: {
    "@type": "Organization",
    name: "ReviewPilot",
    logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.svg` },
  },
};

function getExcerpt(content: string, metaDescription: string) {
  const paragraph = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#") && !line.startsWith("<"));

  return paragraph || metaDescription;
}

export default function BlogPage() {
  const posts: BlogGridPost[] = Object.entries(BLOG_POSTS)
    .map(([slug, post]) => ({
      slug,
      title: post.title,
      excerpt: getExcerpt(post.content, post.metaDescription),
      category: getBlogCategory(post.tags),
      date: post.dateDisplay,
      author: post.author,
      readTime: post.readTime,
    }))
    .sort(
      (a, b) =>
        new Date(BLOG_POSTS[b.slug].datePublished).getTime() -
        new Date(BLOG_POSTS[a.slug].datePublished).getTime()
    );

  return (
    <div className="bg-zinc-950">
      <JsonLd data={blogListSchema} />
      <BlogHero />
      <BlogGrid posts={posts} />
    </div>
  );
}
