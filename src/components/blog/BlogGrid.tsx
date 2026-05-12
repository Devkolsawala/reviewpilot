"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  BLOG_CATEGORIES,
  CATEGORY_STYLES,
  type BlogCategory,
  type FilterableBlogCategory,
} from "./category";

export type BlogGridPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: FilterableBlogCategory;
  date: string;
  author: string;
  readTime: string;
};

const INITIAL_VISIBLE = 9;
const LOAD_MORE_COUNT = 6;

export function BlogGrid({ posts }: { posts: BlogGridPost[] }) {
  const [active, setActive] = useState<BlogCategory>("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const filteredPosts = useMemo(() => {
    if (active === "All") return posts;
    return posts.filter((post) => post.category === active);
  }, [active, posts]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredPosts.length;

  const selectCategory = (category: BlogCategory) => {
    setActive(category);
    setVisibleCount(INITIAL_VISIBLE);
  };

  return (
    <>
      <div className="sticky top-16 z-10 border-y border-zinc-800/80 bg-zinc-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
          {BLOG_CATEGORIES.map((category) => {
            const isActive = active === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => selectCategory(category)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "border-indigo-500 bg-indigo-600 text-white"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <section className="bg-zinc-950 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div layout className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visiblePosts.map((post, index) => (
                <BlogCard key={post.slug} post={post} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>

          {canLoadMore ? (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + LOAD_MORE_COUNT)}
                className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-indigo-500 hover:text-white"
              >
                Load more
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function BlogCard({ post, index }: { post: BlogGridPost; index: number }) {
  const styles = CATEGORY_STYLES[post.category];
  const isFeatured = index === 0;
  const isTall = index > 0 && index % 4 === 3;
  const showExcerpt = isFeatured || !isTall;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12, transition: { duration: 0.16 } }}
      transition={{ duration: 0.28, delay: index * 0.06 }}
      whileHover={{ y: -4, borderColor: styles.border }}
      className={`group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 ${
        isFeatured ? "lg:col-span-2" : ""
      } ${isTall ? "lg:min-h-[360px]" : ""}`}
    >
      <Link href={`/blog/${post.slug}`} className="absolute inset-0 z-10" aria-label={post.title} />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${styles.glow} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <span
          className={`rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-wider ${styles.badge}`}
        >
          {post.category}
        </span>
        <span className="rounded-full border border-zinc-800 px-2.5 py-1 font-mono text-xs text-zinc-500">
          {post.readTime}
        </span>
      </div>

      <div className={`relative ${isFeatured ? "mt-16" : isTall ? "mt-24" : "mt-10"}`}>
        <h2
          className={`font-sans font-semibold tracking-tight text-white underline decoration-transparent decoration-2 underline-offset-4 transition-[text-decoration-color] duration-200 group-hover:decoration-indigo-400 ${
            isFeatured ? "max-w-3xl text-2xl sm:text-3xl" : isTall ? "text-2xl" : "text-lg"
          }`}
        >
          {post.title}
        </h2>
        {showExcerpt ? (
          <p
            className={`mt-3 text-sm leading-6 text-zinc-400 ${
              isFeatured ? "max-w-2xl" : "line-clamp-2"
            }`}
          >
            {post.excerpt}
          </p>
        ) : null}
      </div>

      <div className="relative mt-8 flex items-center justify-between gap-4 font-mono text-xs text-zinc-500">
        {isTall ? (
          <span className="rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1.5">
            {post.author}
          </span>
        ) : (
          <span>
            {post.author} <span aria-hidden="true">/</span> {post.date}
          </span>
        )}
        <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
      </div>
    </motion.article>
  );
}
