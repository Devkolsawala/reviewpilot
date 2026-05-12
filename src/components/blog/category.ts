export const BLOG_CATEGORIES = [
  "All",
  "App Developers",
  "Local Business",
  "AI",
  "Templates",
  "Comparison",
  "WhatsApp",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
export type FilterableBlogCategory = Exclude<BlogCategory, "All">;

export const CATEGORY_STYLES: Record<
  FilterableBlogCategory,
  { badge: string; border: string; glow: string }
> = {
  "App Developers": {
    badge: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    border: "#fb7185",
    glow: "from-rose-500/15",
  },
  "Local Business": {
    badge: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    border: "#38bdf8",
    glow: "from-sky-500/15",
  },
  AI: {
    badge: "border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    border: "#6366f1",
    glow: "from-indigo-500/15",
  },
  Templates: {
    badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    border: "#34d399",
    glow: "from-emerald-500/15",
  },
  Comparison: {
    badge: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    border: "#f59e0b",
    glow: "from-amber-500/15",
  },
  WhatsApp: {
    badge: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    border: "#38bdf8",
    glow: "from-sky-500/15",
  },
};

export function getBlogCategory(tags: string[]): FilterableBlogCategory {
  const joined = tags.join(" ").toLowerCase();

  if (joined.includes("whatsapp")) return "WhatsApp";
  if (
    joined.includes("play store") ||
    joined.includes("app developer") ||
    joined.includes("aso") ||
    joined.includes("rating recovery")
  ) {
    return "App Developers";
  }
  if (joined.includes("ai")) return "AI";
  if (joined.includes("template")) return "Templates";
  if (joined.includes("comparison") || joined.includes("pricing") || joined.includes("tools")) {
    return "Comparison";
  }

  return "Local Business";
}
