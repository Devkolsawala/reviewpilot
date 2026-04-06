/**
 * 15 mock Google Business Profile reviews in the raw GBP API v4 format.
 * Distribution: 3 ONE | 2 TWO | 3 THREE | 3 FOUR | 4 FIVE
 * 8 unreplied (reviewReply: null), 7 already replied.
 * Context: Indian restaurant / retail business (Spice Garden Restaurant, Bangalore)
 */

import type { GBPReview } from "@/types/review";

const ACCOUNT_ID = "123456789012345678";
const LOCATION_ID = "987654321098765432";
const base = `accounts/${ACCOUNT_ID}/locations/${LOCATION_ID}/reviews`;

const iso = (daysAgo: number, hoursOffset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursOffset);
  return d.toISOString();
};

export const mockGBPReviews: GBPReview[] = [
  // ─── ONE star (3 reviews) ─────────────────────────────────────
  {
    name: `${base}/gbpr-001`,
    reviewId: "gbpr-001",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLplYm1=s40-c",
      displayName: "Meera Joshi",
      isAnonymous: false,
    },
    starRating: "ONE",
    comment:
      "Terrible experience. We booked a table for 8pm and weren't seated until 9:15pm. No apology, no explanation. The waiter seemed bothered when we asked about our order. Food was cold when it arrived. Never coming back.",
    createTime: iso(2, 3),
    updateTime: iso(2, 3),
    reviewReply: null,
  },
  {
    name: `${base}/gbpr-002`,
    reviewId: "gbpr-002",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLqRst2=s40-c",
      displayName: "Rajesh Kumar",
      isAnonymous: false,
    },
    starRating: "ONE",
    comment:
      "Found a hair in my biryani. When I complained, the staff was dismissive and offered a discount instead of replacing the dish. Health standards are clearly not a priority here. Reporting to FSSAI.",
    createTime: iso(5, 1),
    updateTime: iso(5, 1),
    reviewReply: null,
  },
  {
    name: `${base}/gbpr-003`,
    reviewId: "gbpr-003",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLabc3=s40-c",
      displayName: "Sunita Rao",
      isAnonymous: false,
    },
    starRating: "ONE",
    comment:
      "Ordered takeaway, was told 30 minutes. Waited 1 hour 20 minutes. Called 3 times. When I arrived the food was clearly sitting there for 40 minutes — everything was soggy and cold. Complete waste of money.",
    createTime: iso(8),
    updateTime: iso(8),
    reviewReply: {
      comment:
        "Sunita, we are deeply sorry for the unacceptable wait time and the quality of your food. This is not the standard we hold ourselves to. Please DM us your order details so we can make this right with a full refund.",
      updateTime: iso(7, 18),
    },
  },

  // ─── TWO star (2 reviews) ─────────────────────────────────────
  {
    name: `${base}/gbpr-004`,
    reviewId: "gbpr-004",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLdef4=s40-c",
      displayName: "Fatima Sheikh",
      isAnonymous: false,
    },
    starRating: "TWO",
    comment:
      "The food quality has gone down compared to 6 months ago. Paneer tikka was dry and the dal makhani tasted different. Staff was friendly enough but the kitchen seems to have changed. Hope they get back to their old standard.",
    createTime: iso(12),
    updateTime: iso(12),
    reviewReply: null,
  },
  {
    name: `${base}/gbpr-005`,
    reviewId: "gbpr-005",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLghi5=s40-c",
      displayName: "Deepak Shetty",
      isAnonymous: false,
    },
    starRating: "TWO",
    comment:
      "Overpriced for what you get. Butter chicken was bland, naan was thick and chewy. The restaurant looks nice but the food doesn't justify the prices. Spent ₹1800 for 2 people and left disappointed.",
    createTime: iso(15),
    updateTime: iso(15),
    reviewReply: {
      comment:
        "Deepak, thank you for your honest feedback. We take flavour consistency very seriously and your comments have been shared with our head chef. We'd love to invite you back on us to show you what Spice Garden is really about.",
      updateTime: iso(14, 12),
    },
  },

  // ─── THREE star (3 reviews) ───────────────────────────────────
  {
    name: `${base}/gbpr-006`,
    reviewId: "gbpr-006",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLjkl6=s40-c",
      displayName: "Amit Kumar",
      isAnonymous: false,
    },
    starRating: "THREE",
    comment:
      "Food was good but the wait time was too long. We waited 45 minutes for our starters. The staff was friendly and the place is clean. Would come back but only on weekdays — weekends seem chaotic.",
    createTime: iso(3, 5),
    updateTime: iso(3, 5),
    reviewReply: null,
  },
  {
    name: `${base}/gbpr-007`,
    reviewId: "gbpr-007",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLmno7=s40-c",
      displayName: "Prachi Deshmukh",
      isAnonymous: false,
    },
    starRating: "THREE",
    comment:
      "Average experience. The garlic naan was excellent — genuinely the best I've had. But the main courses were inconsistent; chicken was perfectly cooked but the prawn curry was underseasoned. Potential is there.",
    createTime: iso(20),
    updateTime: iso(20),
    reviewReply: {
      comment:
        "Thank you, Prachi! We are glad the garlic naan hit the mark — it's hand-crafted fresh each day. Your feedback on the prawn curry has been passed on directly to our chef. We hope to serve you a much better experience next time!",
      updateTime: iso(19, 8),
    },
  },
  {
    name: `${base}/gbpr-008`,
    reviewId: "gbpr-008",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLpqr8=s40-c",
      displayName: "Vivek Nair",
      isAnonymous: false,
    },
    starRating: "THREE",
    comment:
      "The restaurant looks beautiful inside — great ambiance, good music, nice lighting. But the menu is too limited for vegetarians. My wife had only 3-4 real options. Hope they expand the veg section.",
    createTime: iso(25),
    updateTime: iso(25),
    reviewReply: null,
  },

  // ─── FOUR star (3 reviews) ────────────────────────────────────
  {
    name: `${base}/gbpr-009`,
    reviewId: "gbpr-009",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLstu9=s40-c",
      displayName: "Kavita Deshmukh",
      isAnonymous: false,
    },
    starRating: "FOUR",
    comment:
      "Great food and ambiance. The paneer tikka was absolutely excellent! Slightly overpriced but the quality does make up for it mostly. Service was attentive without being intrusive. Would visit again soon.",
    createTime: iso(4),
    updateTime: iso(4),
    reviewReply: {
      comment:
        "Thank you so much, Kavita! The paneer tikka is indeed our chef's signature preparation. We appreciate your feedback on pricing and are always working to offer the best value. See you again soon!",
      updateTime: iso(3, 14),
    },
  },
  {
    name: `${base}/gbpr-010`,
    reviewId: "gbpr-010",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLvwx10=s40-c",
      displayName: "Sanjay Malhotra",
      isAnonymous: false,
    },
    starRating: "FOUR",
    comment:
      "Really good North Indian food in Bangalore. The Dal Makhani here is among the best I have tried outside of Delhi. Staff was very helpful with allergy information. Parking is the only issue — very limited.",
    createTime: iso(10, 2),
    updateTime: iso(10, 2),
    reviewReply: null,
  },
  {
    name: `${base}/gbpr-011`,
    reviewId: "gbpr-011",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLyza11=s40-c",
      displayName: "Anjali Sharma",
      isAnonymous: false,
    },
    starRating: "FOUR",
    comment:
      "Lovely place for a family dinner. Kids menu is thoughtfully designed. The mango kulfi was outstanding. Only small complaint is that the AC was too cold — we had to ask them to turn it down twice.",
    createTime: iso(18),
    updateTime: iso(18),
    reviewReply: {
      comment:
        "Anjali, thank you for the lovely review! We're glad the family enjoyed dinner together. Noted on the temperature — we'll ensure more consistent comfort for all guests. The mango kulfi is made fresh daily, glad it was a hit!",
      updateTime: iso(17, 10),
    },
  },

  // ─── FIVE star (4 reviews) ────────────────────────────────────
  {
    name: `${base}/gbpr-012`,
    reviewId: "gbpr-012",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLabc12=s40-c",
      displayName: "Vikram Singh",
      isAnonymous: false,
    },
    starRating: "FIVE",
    comment:
      "Best North Indian restaurant in Koramangala, no contest. The Rogan Josh is authentic — tastes exactly like what you would find in Kashmir. Staff are warm and attentive. We celebrated our anniversary here and it was perfect.",
    createTime: iso(1, 4),
    updateTime: iso(1, 4),
    reviewReply: {
      comment:
        "Thank you so much, Vikram! Happy anniversary to you both — we are honoured you chose Spice Garden for such a special occasion. The Rogan Josh recipe is a family heirloom. We hope to see you back for many more celebrations!",
      updateTime: iso(1, 2),
    },
  },
  {
    name: `${base}/gbpr-013`,
    reviewId: "gbpr-013",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLdef13=s40-c",
      displayName: "Rekha Iyer",
      isAnonymous: false,
    },
    starRating: "FIVE",
    comment:
      "Absolutely incredible! Ordered the full thali and it was a royal feast. 12 items, all perfectly prepared. The chef came out to check on us personally which was a wonderful touch. Definitely coming back next week.",
    createTime: iso(6, 2),
    updateTime: iso(6, 2),
    reviewReply: null,
  },
  {
    name: `${base}/gbpr-014`,
    reviewId: "gbpr-014",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLghi14=s40-c",
      displayName: "Suresh Pillai",
      isAnonymous: false,
    },
    starRating: "FIVE",
    comment:
      "Wow, just wow. I have been to many Indian restaurants across India and abroad, and Spice Garden is genuinely world-class. The spice balance in every dish is exceptional. Fast service, elegant presentation, fair pricing.",
    createTime: iso(14),
    updateTime: iso(14),
    reviewReply: null,
  },
  {
    name: `${base}/gbpr-015`,
    reviewId: "gbpr-015",
    reviewer: {
      profilePhotoUrl: "https://lh3.googleusercontent.com/a/ACg8ocLjkl15=s40-c",
      displayName: "Manpreet Kaur",
      isAnonymous: false,
    },
    starRating: "FIVE",
    comment:
      "Ordered catering for our office party (50 pax). Everything arrived on time, hot, perfectly packed. The butter chicken and palak paneer were the stars of the evening. Everyone loved it. Will definitely order again for corporate events.",
    createTime: iso(22),
    updateTime: iso(22),
    reviewReply: {
      comment:
        "Manpreet, thank you for trusting us with your office celebration! Catering for 50 people is always a joyful challenge for our team. We're thrilled the butter chicken and palak paneer were crowd favourites. We look forward to your next event!",
      updateTime: iso(21, 6),
    },
  },
];
