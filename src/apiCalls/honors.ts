import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

export interface HonorItem {
  _id: string;
  title: string;
  organization: string;
  year: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HonorPayload {
  title: string;
  organization?: string;
  year?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

function normalizeHonorItem(honor: Record<string, any>): HonorItem {
  return {
    _id: honor._id,
    title: honor.title || "",
    organization: honor.organization || "",
    year: honor.year || "",
    description: honor.description || "",
    sortOrder:
      typeof honor.sortOrder === "number"
        ? honor.sortOrder
        : Number(honor.sortOrder) || 0,
    isActive: honor.isActive !== false,
    createdAt: honor.createdAt,
    updatedAt: honor.updatedAt,
  };
}

function toRequestPayload(payload: HonorPayload) {
  return {
    title: payload.title.trim(),
    organization: payload.organization?.trim() || "",
    year: payload.year?.trim() || "",
    description: payload.description?.trim() || "",
    sortOrder: payload.sortOrder ?? 0,
    isActive: payload.isActive ?? true,
  };
}

export const getAllHonorsApi = async (): Promise<HonorItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_HONORS, { needAuth: true });
    return (res?.data?.honors ?? []).map(normalizeHonorItem);
  } catch (error) {
    throw createApiRequestError(error, "Failed to fetch honors");
  }
};

export const addHonorApi = async (
  payload: HonorPayload,
): Promise<HonorItem> => {
  try {
    const res = await post(ENDPOINT.ADD_HONOR, toRequestPayload(payload), {
      needAuth: true,
    });
    return normalizeHonorItem(res?.data?.honor ?? {});
  } catch (error) {
    throw createApiRequestError(error, "Failed to add honor");
  }
};

export const updateHonorApi = async (
  id: string,
  payload: HonorPayload,
): Promise<HonorItem> => {
  try {
    const res = await post(`${ENDPOINT.UPDATE_HONOR}/${id}`, toRequestPayload(payload), {
      needAuth: true,
    });
    return normalizeHonorItem(res?.data?.honor ?? {});
  } catch (error) {
    throw createApiRequestError(error, "Failed to update honor");
  }
};

export const deleteHonorApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_HONOR}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error) {
    throw createApiRequestError(error, "Failed to delete honor");
  }
};
