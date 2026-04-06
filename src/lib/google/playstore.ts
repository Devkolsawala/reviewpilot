import { google } from "googleapis";
import { analyzeSentiment, extractKeywords } from "@/lib/ai/sentiment";
import type { Review } from "@/types/review";

export async function getPlayStoreClient(credentials: Record<string, unknown>) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email as string,
      private_key: credentials.private_key as string,
      project_id: credentials.project_id as string,
    },
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  const authClient = await auth.getClient();
  return google.androidpublisher({
    version: "v3",
    auth: authClient as Parameters<typeof google.androidpublisher>[0]["auth"],
  });
}

export async function verifyConnection(
  credentials: Record<string, unknown>,
  packageName: string
): Promise<{ valid: boolean; reviewCount?: number; error?: string }> {
  try {
    const client = await getPlayStoreClient(credentials);
    const response = await client.reviews.list({ packageName });
    return {
      valid: true,
      reviewCount: response.data.reviews?.length || 0,
    };
  } catch (error: unknown) {
    const err = error as { code?: number; response?: { status?: number }; message?: string };
    const code = err.code || err.response?.status;
    if (code === 403) {
      return {
        valid: false,
        error:
          "Permission denied. Make sure the service account has 'View app information' and 'Reply to reviews' permissions in Google Play Console → Users & Permissions.",
      };
    }
    if (code === 404) {
      return {
        valid: false,
        error:
          "App not found. Check that the package name is correct (e.g., com.example.myapp). The app must be published on Play Store.",
      };
    }
    if (
      err.message?.includes("invalid_grant") ||
      err.message?.includes("private_key")
    ) {
      return {
        valid: false,
        error:
          "Invalid service account credentials. Make sure you uploaded the correct JSON key file.",
      };
    }
    return {
      valid: false,
      error: `Connection failed: ${err.message || "Unknown error"}`,
    };
  }
}

export async function fetchPlayStoreReviews(
  credentials: Record<string, unknown>,
  packageName: string
): Promise<Review[]> {
  const client = await getPlayStoreClient(credentials);
  const allRawReviews: unknown[] = [];
  let nextPageToken: string | undefined;

  do {
    const response = await client.reviews.list({
      packageName,
      token: nextPageToken,
    });
    if (response.data.reviews) {
      allRawReviews.push(...response.data.reviews);
    }
    nextPageToken =
      response.data.tokenPagination?.nextPageToken || undefined;
  } while (nextPageToken);

  return allRawReviews
    .map((raw) => transformPlayStoreReview(raw as RawReviewData))
    .filter((r): r is Review => r !== null);
}

export async function replyToPlayStoreReview(
  credentials: Record<string, unknown>,
  packageName: string,
  reviewId: string,
  replyText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const truncatedReply =
      replyText.length > 350
        ? replyText.substring(0, 347) + "..."
        : replyText;

    const client = await getPlayStoreClient(credentials);
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

// Keep the old export name for backward compat with existing cron/reply routes
export const publishPlayStoreReply = async (
  credentials: Record<string, unknown>,
  packageName: string,
  reviewId: string,
  replyText: string
): Promise<boolean> => {
  const result = await replyToPlayStoreReview(
    credentials,
    packageName,
    reviewId,
    replyText
  );
  return result.success;
};

interface RawReviewData {
  reviewId?: string;
  authorName?: string;
  comments?: Array<{
    userComment?: {
      text?: string;
      starRating?: number;
      reviewerLanguage?: string;
      lastModified?: { seconds?: string };
      deviceMetadata?: Record<string, unknown>;
    };
  }>;
}

export function transformPlayStoreReview(
  review: RawReviewData,
  connectionId?: string
): Review | null {
  const userComment = review.comments?.[0]?.userComment;
  if (!userComment) return null;

  const text = userComment.text || "";
  const rating = userComment.starRating || 0;

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
    reply_status: "pending" as const,
    sentiment: analyzeSentiment(text, rating),
    keywords: extractKeywords(text),
    is_read: false,
    review_created_at: userComment.lastModified?.seconds
      ? new Date(
          parseInt(userComment.lastModified.seconds) * 1000
        ).toISOString()
      : new Date().toISOString(),
  };
}
