import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

export interface OPDItem {
  _id: string;
  fullName: string;
  contactNumber: string;
  email?: string;
  address?: string;
  message: string;
  createdAt?: string;
}

export const getOPDApi = async (): Promise<OPDItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_OPD, { needAuth: true });
    return res?.data?.contacts || [];
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to fetch OPD contacts");
  }
};

export const deleteOPDApi = async (id: string): Promise<void> => {
  try {
    await post(
      `${ENDPOINT.DELETE_OPD}/${id}`,
      {},
      { needAuth: true },
    );
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to delete OPD contact");
  }
};
