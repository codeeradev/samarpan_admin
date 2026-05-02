import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

export interface SpecializationItem {
  _id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SpecializationPayload {
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

export const getAllSpecializationsApi = async (params?: {
  isActive?: boolean;
}): Promise<SpecializationItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_SPECIALIZATIONS, { needAuth: true, params });
    return res?.data?.specializations || [];
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to fetch specializations");
  }
};

export const addSpecializationApi = async (
  payload: SpecializationPayload,
): Promise<SpecializationItem> => {
  try {
    const res = await post(ENDPOINT.ADD_SPECIALIZATION, payload, {
      needAuth: true,
    });

    return res.data.specialization;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to add specialization");
  }
};

export const updateSpecializationApi = async (
  id: string,
  payload: SpecializationPayload,
): Promise<SpecializationItem> => {
  try {
    const res = await post(`${ENDPOINT.UPDATE_SPECIALIZATION}/${id}`, payload, {
      needAuth: true,
    });

    return res.data.specialization;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to update specialization");
  }
};

export const deleteSpecializationApi = async (id: string): Promise<void> => {
  try {
    await post(
      `${ENDPOINT.DELETE_SPECIALIZATION}/${id}`,
      {},
      { needAuth: true },
    );
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to delete specialization");
  }
};
