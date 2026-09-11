import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface FeedbackItem {
  _id: string;
  fullName: string;
  contactNumber: string;
  email?: string;
  address?: string;
  comments: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getFeedbackApi = async (): Promise<FeedbackItem[]> => {
  const res = await get(ENDPOINT.GET_FEEDBACK, { needAuth: true });
  return res?.data?.feedback ?? [];
};

export const deleteFeedbackApi = async (id: string): Promise<void> => {
  await post(`${ENDPOINT.DELETE_FEEDBACK}/${id}`, undefined, {
    needAuth: true,
  });
};
