import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface TpaItem {
  _id: string;
  title: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getAllTpaApi = async (): Promise<TpaItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_TPA, { needAuth: true });
    return res?.data?.tpa ?? [];
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to fetch TPA items",
    );
  }
};

export const addTpaApi = async (image: File, title: string): Promise<TpaItem> => {
  try {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("image", image);

    const res = await post(ENDPOINT.ADD_TPA, formData, {
      needAuth: true,
    });

    return res?.data?.tpa;
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to add TPA item");
  }
};

export const updateTpaApi = async (
  id: string,
  title: string,
): Promise<TpaItem> => {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_TPA}/${id}`,
      { title },
      { needAuth: true },
    );

    return res?.data?.tpa;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to update TPA item",
    );
  }
};

export const deleteTpaApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_TPA}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to delete TPA item",
    );
  }
};
