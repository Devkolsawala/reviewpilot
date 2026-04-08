import { google } from "googleapis";
import { analyzeSentiment, extractKeywords } from "@/lib/ai/sentiment";
import type { Review } from "@/types/review";

// ---------------------------------------------------------------------------
// Credential resolution
// ---------------------------------------------------------------------------

/**
 * Returns credentials to use for Play Store API calls.
 * If the user uploaded their own service account JSON it is used directly.
 * Otherwise we fall back to ReviewPilot's shared service account stored in
 * the GOOGLE_PLAY_SERVICE_ACCOUNT_KEY environment variable.
 */
function getCredentials(
  userCredentials?: Record<string, unknown> | null
): Record<string, unknown> {
  if (
    userCredentials &&
    userCredentials.client_email &&
    userCredentials.private_key
  ) {
    return userCredentials;
  }

  const keyString = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
  if (!keyString) {
    throw new Error(
      "Play Store not configured. Set GOOGLE_PLAY_SERVICE_ACCOUNT_KEY in environment variables."
    );
  }

  try {
    return JSON.parse(keyString) as Record<string, unknown>;
  } catch {
    throw new Error(
      "Invalid GOOGLE_PLAY_SERVICE_ACCOUNT_KEY — must be valid JSON."
    );
  }
}

// ---------------------------------------------------------------------------
// Authenticated client
// ---------------------------------------------------------------------------

async function getPlayStoreClient(
  userCredentials?: Record<string, unknown> | null
) {
  const credentials = getCredentials(userCredentials);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email as string,
      private_key: credentials.private_key as string,
      project_id: credentials.project_id as string | undefined,
    },
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  const authClient = await auth.getClient();
  return google.androidpublisher({
    version: "v3",
    auth: authClient as Parameters<typeof google.androidpublisher>[0]["auth"],
  });
}

// ---------------------------------------------------------------------------
// Public API — packageName first, optional userCredentials last
// ---------------------------------------------------------------------------

export async function verifyConnection(
  packageName: string,
  userCredentials?: Record<string, unknown> | null
): Promise<{ valid: boolean; reviewCount?: number; error?: string }> {
  try {
    const client = await getPlayStoreClient(userCredentials);
    const response = await client.reviews.list({ packageName, maxResults: 100 });
    return {
      valid: true,
      reviewCount: response.data.reviews?.length || 0,
    };
  } catch (error: unknown) {
    const err = error as {
      code?: number;
      response?: { status?: number };
      message?: string;
    };
    const code = err.code || err.response?.status;

    if (code === 403) {
      return {
        valid: false,
        error: userCredentials
          ? "Permission denied. Make sure the service account has 'View app information' and 'Reply to reviews' permissions in Play Console."
          : "Permission denied. Make sure you invited the ReviewPilot email in Play Console → Users & Permissions and granted both 'View app information' and 'Reply to reviews' permissions. It can take a few minutes for permissions to activate — try again shortly.",
      };
    }
    if (code === 404) {
      return {
        valid: false,
        error:
          "App not found. Double-check the package name (e.g., com.example.myapp). The app must be published on Play Store.",
      };
    }
    if (
      err.message?.includes("invalid_grant") ||
      err.message?.includes("private_key")
    ) {
      return {
        valid: false,
        error: "Invalid credentials. Please check your service account configuration.",
      };
    }
    return {
      valid: false,
      error: `Connection failed: ${err.message || "Unknown error"}`,
    };
  }
}

export async function fetchPlayStoreReviews(
  packageName: string,
  userCredentials?: Record<string, unknown> | null
): Promise<Review[]> {
  const client = await getPlayStoreClient(userCredentials);
  const allRawReviews: unknown[] = [];
  let nextPageToken: string | undefined;
  let pageNum = 0;

  console.log(`[FETCH] Starting Play Store fetch for package: ${packageName}`);

  do {
    pageNum++;
    const response = await client.reviews.list({
      packageName,
      maxResults: 100,      // request maximum per page
      token: nextPageToken,
    });
    const pageCount = response.data.reviews?.length || 0;
    console.log(`[FETCH] Page ${pageNum}: got ${pageCount} reviews (token: ${nextPageToken || "first"})`);
    if (response.data.reviews) {
      allRawReviews.push(...response.data.reviews);
    }
    nextPageToken =
      response.data.tokenPagination?.nextPageToken || undefined;
  } while (nextPageToken);

  console.log(`[FETCH] Total raw reviews from Play Store: ${allRawReviews.length}`);

  const transformed = allRawReviews
    .map((raw) => transformPlayStoreReview(raw as RawReviewData))
    .filter((r): r is Review => r !== null);

  console.log(`[FETCH] After transform: ${transformed.length} valid reviews (${allRawReviews.length - transformed.length} skipped)`);
  return transformed;
}

export async function replyToPlayStoreReview(
  packageName: string,
  reviewId: string,
  replyText: string,
  userCredentials?: Record<string, unknown> | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const truncatedReply =
      replyText.length > 350
        ? replyText.substring(0, 347) + "..."
        : replyText;

    const client = await getPlayStoreClient(userCredentials);
    await client.reviews.reply({
      packageName,
      reviewId,
      requestBody: { replyText: truncatedReply },
    });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { success: false, error: err.message || "Unknown error" };
  }
}

// Backward-compat alias (not used externally, kept for safety)
export const publishPlayStoreReply = async (
  packageName: string,
  reviewId: string,
  replyText: string,
  userCredentials?: Record<string, unknown> | null
): Promise<boolean> => {
  const result = await replyToPlayStoreReview(
    packageName,
    reviewId,
    replyText,
    userCredentials
  );
  return result.success;
};

// ---------------------------------------------------------------------------
// Transform helper
// ---------------------------------------------------------------------------

interface RawReviewData {
  reviewId?: string;
  authorName?: string;
  comments?: Array<{
    userComment?: {
      text?: string;
      starRating?: number;
      reviewerLanguage?: string;
      lastModified?: { seconds?: string; nanos?: number };
      deviceMetadata?: Record<string, unknown>;
    };
    developerComment?: {
      text?: string;
      lastModified?: { seconds?: string; nanos?: number };
    };
  }>;
}

export function transformPlayStoreReview(
  review: RawReviewData,
  connectionId?: string
): Review | null {
  const userComment = review.comments?.[0]?.userComment;
  if (!userComment) {
    console.log(`[TRANSFORM] Skipping review ${review.reviewId} — no user comment`);
    return null;
  }

  const text = userComment.text || "";
  const rating = userComment.starRating || 0;

  // Parse timestamp — Play Store uses seconds since epoch
  let reviewDate: string;
  if (userComment.lastModified?.seconds) {
    reviewDate = new Date(parseInt(userComment.lastModified.seconds) * 1000).toISOString();
  } else {
    reviewDate = new Date().toISOString();
  }

  // Detect existing developer reply across all comments
  const devReplyComment = review.comments?.find((c) => c.developerComment);
  const hasExistingReply = !!devReplyComment?.developerComment?.text;
  let replyPublishedAt: string | undefined;
  if (hasExistingReply && devReplyComment?.developerComment?.lastModified?.seconds) {
    replyPublishedAt = new Date(
      parseInt(devReplyComment.developerComment.lastModified.seconds) * 1000
    ).toISOString();
  }

  return {
    id: "",
    connection_id: connectionId,
    source: "play_store" as const,
    external_review_id: review.reviewId || "",
    author_name: review.authorName || "Anonymous",
    rating,
    review_text: text,
    review_language: userComment.reviewerLanguage || "en",
    device_info: userComment.deviceMetadata || {},
    reply_status: hasExistingReply ? "published" as const : "pending" as const,
    reply_text: devReplyComment?.developerComment?.text || undefined,
    reply_published_at: replyPublishedAt,
    sentiment: analyzeSentiment(text, rating),
    keywords: extractKeywords(text),
    is_read: hasExistingReply,
    review_created_at: reviewDate,
  };
}

// ---------------------------------------------------------------------------
// Helper — shared service account email for display in wizard
// ---------------------------------------------------------------------------

export function getSharedServiceAccountEmail(): string {
  return (
    process.env.NEXT_PUBLIC_PLAY_SERVICE_ACCOUNT_EMAIL || "Not configured"
  );
}
