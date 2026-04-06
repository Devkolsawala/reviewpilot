import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure profile exists
  await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: user.email, plan: "free" }, { onConflict: "id" });

  // Get user's first connection or create a test one
  let { data: connection } = await supabase
    .from("connections")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!connection) {
    const { data: newConn } = await supabase
      .from("connections")
      .insert({
        user_id: user.id,
        type: "play_store",
        name: "Test App (Demo)",
        external_id: "com.test.demo",
        credentials: {},
        is_active: true,
      })
      .select("id")
      .single();
    connection = newConn;
  }

  if (!connection) {
    return NextResponse.json(
      { error: "Could not create test connection" },
      { status: 500 }
    );
  }

  // Create/update a default app context
  await supabase.from("app_contexts").upsert(
    {
      connection_id: connection.id,
      description:
        "StatusSaver lets users view and download WhatsApp statuses before they disappear. Features include batch download, auto-save mode, and repost to story.",
      key_features: [
        "View all WhatsApp statuses",
        "Download photos and videos",
        "Batch download",
        "Auto-save mode",
        "Repost to WhatsApp story",
      ],
      common_questions: [
        "How to grant storage permission on Android 13+",
        "Does it work with WhatsApp Business?",
        "Why are some statuses not showing?",
      ],
      known_issues: [
        "Auto-save may miss statuses during deep sleep mode - fix coming in v3.2",
        "Occasional lag when downloading HD videos",
      ],
      tone: "friendly",
      auto_reply_enabled: true,
      auto_reply_min_rating: 1,
      auto_reply_max_rating: 5,
    },
    { onConflict: "connection_id" }
  );

  const fakeReviews = [
    { author: "Rahul Sharma", rating: 1, text: "App crashes every time I try to download a status. Worst app ever. Fix this!" },
    { author: "Priya Patel", rating: 5, text: "Amazing app! I love how easy it is to save WhatsApp statuses. The batch download feature is a lifesaver. Keep up the great work!" },
    { author: "Amit Kumar", rating: 2, text: "Too many ads! An ad after every single download is ridiculous. Would give 5 stars without the ads." },
    { author: "Sneha Reddy", rating: 4, text: "Good app overall. Works well for photos but videos sometimes take too long to download. Please optimize video downloads." },
    { author: "Vikram Singh", rating: 1, text: "Cannot download anything. Shows permission denied error. Useless app!" },
    { author: "Neha Gupta", rating: 5, text: "Best status saver app I have used. Auto save feature is brilliant. Thank you developers!" },
    { author: "Arjun Nair", rating: 3, text: "App is okay but the UI looks outdated. Also please add dark mode. It would be much better with a modern design." },
    { author: "Kavya Iyer", rating: 2, text: "Does it work with WhatsApp Business? I can only see regular WhatsApp statuses. Please add WA Business support." },
    { author: "Rohan Desai", rating: 5, text: "Finally an app that actually works! Downloaded 50+ statuses without any issues. Highly recommended!" },
    { author: "Ananya Mishra", rating: 1, text: "After the last update the app stopped working completely. Please roll back the update or fix the bugs ASAP." },
    { author: "Karthik Rao", rating: 4, text: "Nice app. One suggestion - please add a feature to save statuses from specific contacts only. That would be super useful." },
    { author: "Divya Menon", rating: 3, text: "How do I use the auto-save feature? I enabled it but it doesnt seem to save anything automatically. Need a tutorial or something." },
    { author: "Suresh Pillai", rating: 5, text: "I have been using this app for 6 months now and it has never let me down. Reliable and fast. 10/10 would recommend." },
    { author: "Meera Joshi", rating: 2, text: "The app keeps showing notification even when I am not using it. Very annoying. Please fix the notification issue." },
    { author: "Aditya Verma", rating: 4, text: "Great concept and mostly works well. Just wish the download speed was faster for HD videos. Otherwise perfect app." },
  ];

  let seeded = 0;
  for (let i = 0; i < fakeReviews.length; i++) {
    const review = fakeReviews[i];
    const sentiment =
      review.rating >= 4
        ? "positive"
        : review.rating <= 2
          ? "negative"
          : "neutral";
    const keywords =
      review.text
        .toLowerCase()
        .match(
          /\b(crash|ads?|download|permission|update|feature|speed|dark mode|auto.save|notification)\b/g
        ) || [];

    const { error } = await supabase.from("reviews").upsert(
      {
        connection_id: connection.id,
        source: "play_store",
        external_review_id: `test-review-${i + 1}`,
        author_name: review.author,
        rating: review.rating,
        review_text: review.text,
        review_language: "en",
        reply_status: "pending",
        sentiment,
        keywords,
        review_created_at: new Date(
          Date.now() - i * 3600000 * Math.random() * 48
        ).toISOString(),
      },
      { onConflict: "connection_id,external_review_id" }
    );

    if (!error) seeded++;
  }

  return NextResponse.json({
    success: true,
    message: `Seeded ${seeded} test reviews for connection "${connection.id}"`,
    connectionId: connection.id,
    reviewCount: seeded,
  });
}
