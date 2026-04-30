import { get } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface GoogleReviewItem {
  id: string;
  authorName: string;
  authorUrl?: string;
  profilePhotoUrl?: string;
  rating?: number;
  relativeTimeDescription?: string;
  text: string;
  time?: number | null;
  language?: string;
}

export interface GoogleReviewsSummary {
  placeId?: string;
  placeName: string;
  rating: number;
  reviews: GoogleReviewItem[];
  source: string;
  fetchedAt?: string;
}

function normalizeGoogleReviewItem(
  item: Record<string, any>,
  index: number,
): GoogleReviewItem {
  const authorName =
    item.authorName ||
    item.author_name ||
    item.name ||
    `Google Reviewer ${index + 1}`;
  const text = item.text || item.review || "";

  return {
    id:
      item.id ||
      item._id ||
      `${authorName}-${item.time || item.updatedAt || index}`,
    authorName,
    authorUrl: item.authorUrl || item.author_url || "",
    profilePhotoUrl: item.profilePhotoUrl || item.profile_photo_url || "",
    rating:
      typeof item.rating === "number" ? item.rating : Number(item.rating || 5),
    relativeTimeDescription:
      item.relativeTimeDescription ||
      item.relative_time_description ||
      item.updatedAt ||
      item.createdAt ||
      "",
    text,
    time:
      typeof item.time === "number" || item.time === null
        ? item.time
        : undefined,
    language: item.language || item.original_language || "",
  };
}

function normalizeGoogleReviewsSummary(
  payload: Record<string, any> | undefined,
): GoogleReviewsSummary {
  const rawReviews = Array.isArray(payload?.reviews)
    ? payload.reviews
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    placeId: payload?.placeId || payload?.place_id || "",
    placeName: payload?.placeName || payload?.name || "Samarpan Hospital",
    rating:
      typeof payload?.rating === "number"
        ? payload.rating
        : Number(payload?.rating || 0),
    reviews: rawReviews.map((item, index) =>
      normalizeGoogleReviewItem(item, index),
    ),
    source: payload?.source || "google",
    fetchedAt: payload?.fetchedAt || payload?.updatedAt || "",
  };
}

export const getGoogleReviewsApi = async (): Promise<GoogleReviewsSummary> => {
  try {
    const res = await get(ENDPOINT.GET_GOOGLE_REVIEWS, { needAuth: true });
    return normalizeGoogleReviewsSummary(res?.data);
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to fetch reviews");
  }
};
