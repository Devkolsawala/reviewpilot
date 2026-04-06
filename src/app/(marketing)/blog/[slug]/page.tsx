import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const BLOG_CONTENT: Record<string, { title: string; date: string; content: string }> = {
  "how-to-reply-google-reviews": {
    title: "How to Reply to Google Reviews: The Complete Guide (2026)",
    date: "March 25, 2026",
    content: `
Replying to Google reviews is one of the most impactful things you can do for your local business. Here's everything you need to know.

## Why Reply to Google Reviews?

Businesses that reply to reviews see a 12% increase in their average rating over time. Google's algorithm also favors businesses that actively engage with their reviewers, boosting your local search ranking.

## Replying to Positive Reviews (4-5 Stars)

The key is to be genuine and specific. Don't just say "Thanks!" — reference something specific from their review.

**Example:** "Thank you so much, Priya! We're glad you enjoyed the paneer tikka — it's our chef's specialty. We look forward to serving you again!"

## Replying to Negative Reviews (1-2 Stars)

Never be defensive. Acknowledge the issue, apologize, and offer to make it right.

**Example:** "We're sorry about the long wait, Amit. That's not our standard. We've since added staff during peak hours. We'd love a chance to give you a better experience."

## Replying to Mixed Reviews (3 Stars)

Thank them for the positive, acknowledge the negative, and share what you're doing about it.

## Using AI to Scale Review Replies

Tools like ReviewPilot can generate context-aware replies in seconds using AI. You review and approve — the AI handles the heavy lifting. This is especially useful if you receive 50+ reviews per month.

## Best Practices

1. Reply within 24-48 hours
2. Keep replies under 200 words
3. Use the reviewer's first name
4. Never copy-paste the same reply
5. Include a call-to-action when appropriate
    `,
  },
  "play-store-review-management": {
    title: "Play Store Review Management: A Developer's Guide",
    date: "March 20, 2026",
    content: `
Managing Google Play Store reviews effectively can be the difference between a 3.5 and a 4.5 star app. Here's how to do it right.

## The 350-Character Limit

Play Store replies are limited to 350 characters. This is tight — you need to be concise while still being helpful.

## Setting Up an App Context Profile

Before you start replying, document your app's key features, known issues, and common questions. This context helps you (or AI tools) write better replies.

## Handling Crash Reports

When users report crashes, acknowledge the issue and ask for device details if possible. Always mention if a fix is coming.

**Example:** "Sorry about the crash, Rahul. We've identified this issue on Samsung devices and a fix is in our next update (v2.4). Thanks for your patience!"

## Auto-Reply Strategies

Consider auto-publishing replies to 4-5 star reviews and drafting replies for 1-3 stars for manual review. This saves time while keeping quality control.

## Tracking Your Impact

Monitor your rating trend over time. A consistent reply strategy typically shows results within 2-4 weeks.
    `,
  },
  "reviewpilot-vs-competitors": {
    title: "ReviewPilot vs Birdeye vs Podium: Honest Comparison (2026)",
    date: "March 15, 2026",
    content: `
Choosing a review management platform? Here's an honest comparison of the top options for Indian businesses.

## Pricing Comparison

| Platform | Starting Price | Best For |
|----------|---------------|----------|
| ReviewPilot | ₹1,500/mo | Small businesses & app developers |
| Birdeye | ₹25,000/mo | Enterprise businesses |
| Podium | ₹20,000/mo | Multi-location businesses |
| AppFollow | ₹15,000/mo | App developers only |

## Feature Comparison

**ReviewPilot** is the only platform that supports both Google Business Profile AND Google Play Store reviews. Competitors typically focus on one or the other.

**AI Replies:** ReviewPilot and Birdeye both offer AI-generated replies. Podium does not.

**SMS Campaigns:** ReviewPilot and Podium support SMS review collection. AppFollow does not.

## The Verdict

For Indian businesses and app developers, ReviewPilot offers the best value — you get 90% of the features at 10% of the price. The AI reply quality is comparable to Birdeye, and the Play Store support puts it ahead of Podium.

If you're an enterprise with 50+ locations and need advanced features like custom integrations, Birdeye might be worth the premium.
    `,
  },
};

export function generateStaticParams() {
  return Object.keys(BLOG_CONTENT).map((slug) => ({ slug }));
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = BLOG_CONTENT[params.slug];
  if (!post) notFound();

  return (
    <div className="py-20">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" className="mb-8" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground mb-2">{post.date}</p>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl mb-8">
          {post.title}
        </h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {post.content.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return (
                <h2 key={i} className="font-heading text-2xl font-bold mt-8 mb-4">
                  {line.replace("## ", "")}
                </h2>
              );
            }
            if (line.startsWith("**Example:**")) {
              return (
                <blockquote key={i} className="border-l-4 border-teal-500 pl-4 my-4 italic text-muted-foreground">
                  {line.replace("**Example:** ", "")}
                </blockquote>
              );
            }
            if (line.trim().startsWith("|")) {
              return null; // Skip table rows for simplicity
            }
            if (line.trim().match(/^\d\./)) {
              return (
                <p key={i} className="ml-4 my-1">
                  {line.trim()}
                </p>
              );
            }
            if (line.trim()) {
              return (
                <p key={i} className="my-3 text-muted-foreground leading-relaxed">
                  {line.trim().replace(/\*\*(.*?)\*\*/g, "$1")}
                </p>
              );
            }
            return null;
          })}
        </div>
      </article>
    </div>
  );
}
