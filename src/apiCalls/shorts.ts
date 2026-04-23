import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface ShortPayload {
  title: string;
  shortUrl: string;
  thumbnail?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ShortItem {
  _id: string;
  title: string;
  shortUrl: string;
  thumbnail?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const getAllShortsApi = async (): Promise<ShortItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_SHORTS, { needAuth: true });
    return res?.data?.shorts ?? [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to fetch shorts");
  }
};

export const addShortApi = async (
  payload: ShortPayload,
): Promise<ShortItem> => {
  try {
    const res = await post(ENDPOINT.ADD_SHORT, payload, { needAuth: true });
    return res?.data?.short;
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to add short");
  }
};

export const updateShortApi = async (
  id: string,
  payload: Partial<ShortPayload>,
): Promise<ShortItem> => {
  try {
    const res = await post(`${ENDPOINT.UPDATE_SHORT}/${id}`, payload, {
      needAuth: true,
    });
    return res?.data?.short;
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to update short");
  }
};

export const deleteShortApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_SHORT}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to delete short");
  }
};
