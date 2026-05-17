// Preset reviews shared between the homepage InteractiveAIDemo and the
// /tools/ai-review-reply-generator tool page. One source of truth so the chips
// stay in sync.

export type ReplyPlatform = "play-store" | "gbp" | "other";
export type ReplyTone = "Friendly" | "Professional" | "Apologetic" | "Confident";

export interface ReplyPreset {
  id: string;
  label: string;
  platform: ReplyPlatform;
  reviewText: string;
  suggestedRating: 1 | 2 | 3 | 4 | 5;
  suggestedTone: ReplyTone;
}

export const REPLY_PRESETS: ReplyPreset[] = [
  // ── Play Store ──────────────────────────────────────────────────────────
  {
    id: "play-1",
    label: "Crash complaint",
    platform: "play-store",
    reviewText:
      "App keeps crashing every time I try to log in. Lost all my saved data twice already. Worst app, complete waste of money.",
    suggestedRating: 1,
    suggestedTone: "Apologetic",
  },
  {
    id: "play-5",
    label: "5★ praise",
    platform: "play-store",
    reviewText:
      "Genuinely the best budgeting app I've used in India. Clean UI, no ads, and the new dark mode is beautiful. Worth every rupee.",
    suggestedRating: 5,
    suggestedTone: "Friendly",
  },
  {
    id: "play-feature",
    label: "Feature request",
    platform: "play-store",
    reviewText:
      "Solid app overall but please add CSV export and a widget. Would be 5 stars then. Also dark mode toggle would be nice.",
    suggestedRating: 4,
    suggestedTone: "Professional",
  },
  {
    id: "play-onboarding",
    label: "Confusing onboarding",
    platform: "play-store",
    reviewText:
      "Spent 20 minutes trying to figure out how to add my first entry. The tutorial skipped past the main button. Lost interest.",
    suggestedRating: 2,
    suggestedTone: "Apologetic",
  },
  {
    id: "play-battery",
    label: "Battery drain",
    platform: "play-store",
    reviewText:
      "App drains my battery like crazy in the background. 30% gone in 2 hours just from this app being open. Otherwise useful.",
    suggestedRating: 2,
    suggestedTone: "Professional",
  },
  {
    id: "play-subscription",
    label: "Subscription issue",
    platform: "play-store",
    reviewText:
      "Charged me twice for the annual plan even though I cancelled within the trial. Support hasn't replied for 5 days.",
    suggestedRating: 1,
    suggestedTone: "Apologetic",
  },

  // ── Google Business Profile ────────────────────────────────────────────
  {
    id: "gbp-glowing",
    label: "Glowing 5★",
    platform: "gbp",
    reviewText:
      "Dr. Sharma is incredibly thorough and patient. Took the time to explain everything. Highly recommend for anyone in the Ahmedabad area.",
    suggestedRating: 5,
    suggestedTone: "Friendly",
  },
  {
    id: "gbp-bad",
    label: "Bad service 1★",
    platform: "gbp",
    reviewText:
      "Worst experience. Booked an appointment, waited an hour, and the staff was rude when I asked about the delay. Will not return.",
    suggestedRating: 1,
    suggestedTone: "Apologetic",
  },
  {
    id: "gbp-wait",
    label: "Wait time complaint",
    platform: "gbp",
    reviewText:
      "Waited 45 minutes past my appointment time. Staff was polite but the wait was unacceptable. Won't be coming back.",
    suggestedRating: 2,
    suggestedTone: "Apologetic",
  },
  {
    id: "gbp-hidden",
    label: "Hidden gem 4★",
    platform: "gbp",
    reviewText:
      "Tucked away on a side street but the food was excellent and prices fair. Service was attentive without being pushy. Will come back.",
    suggestedRating: 4,
    suggestedTone: "Friendly",
  },
  {
    id: "gbp-wrong-order",
    label: "Wrong order",
    platform: "gbp",
    reviewText:
      "Ordered veg thali, got non-veg. When I pointed it out the waiter argued before bringing the right one. Food itself was fine.",
    suggestedRating: 2,
    suggestedTone: "Apologetic",
  },
  {
    id: "gbp-staff",
    label: "Helpful staff",
    platform: "gbp",
    reviewText:
      "The team went out of their way to find a part for my old laptop. Honest pricing and quick turnaround. Recommended.",
    suggestedRating: 5,
    suggestedTone: "Friendly",
  },

  // ── Other / Custom ─────────────────────────────────────────────────────
  {
    id: "other-1star",
    label: "Generic 1★",
    platform: "other",
    reviewText:
      "Not what I expected. The product description was misleading and customer service didn't help. Disappointed overall.",
    suggestedRating: 1,
    suggestedTone: "Apologetic",
  },
  {
    id: "other-5star",
    label: "Generic 5★",
    platform: "other",
    reviewText:
      "Exceeded expectations. Easy to use, well-priced, and the team was responsive when I had a quick question. Happy customer.",
    suggestedRating: 5,
    suggestedTone: "Friendly",
  },
];

export const PRESETS_BY_PLATFORM: Record<ReplyPlatform, ReplyPreset[]> = {
  "play-store": REPLY_PRESETS.filter((p) => p.platform === "play-store"),
  gbp: REPLY_PRESETS.filter((p) => p.platform === "gbp"),
  other: REPLY_PRESETS.filter((p) => p.platform === "other"),
};

export const PLATFORM_META: Record<
  ReplyPlatform,
  { label: string; shortLabel: string; charLimit: number; icon: string }
> = {
  "play-store": {
    label: "Play Store",
    shortLabel: "Play Store",
    charLimit: 350,
    icon: "📱",
  },
  gbp: {
    label: "Google Business Profile",
    shortLabel: "GBP",
    charLimit: 4096,
    icon: "📍",
  },
  other: {
    label: "Other / Custom",
    shortLabel: "Other",
    charLimit: 1000,
    icon: "✨",
  },
};
