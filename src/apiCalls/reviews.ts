import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface ReviewPayload {
  name: string;
  review: string;
  location?: string;
  treatment?: string;
  rating?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ReviewItem {
  _id: string;
  name: string;
  review: string;
  location?: string;
  treatment?: string;
  rating?: number;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const getAllReviewsApi = async (): Promise<ReviewItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_REVIEWS, { needAuth: true });
    return res?.data?.reviews ?? [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to fetch reviews");
  }
};

export const addReviewApi = async (
  payload: ReviewPayload,
): Promise<ReviewItem> => {
  try {
    const res = await post(ENDPOINT.ADD_REVIEW, payload, { needAuth: true });
    return res?.data?.review;
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to add review");
  }
};

export const updateReviewApi = async (
  id: string,
  payload: Partial<ReviewPayload>,
): Promise<ReviewItem> => {
  try {
    const res = await post(`${ENDPOINT.UPDATE_REVIEW}/${id}`, payload, {
      needAuth: true,
    });
    return res?.data?.review;
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to update review");
  }
};

export const deleteReviewApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_REVIEW}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to delete review");
  }
};
