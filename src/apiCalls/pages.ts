import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface PageItem {
  _id: string;
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PagePayload {
  title: string;
  slug: string;
  content: string;
  isActive: boolean;
}

export const getAllPagesApi = async (): Promise<PageItem[]> => {
  const res = await get(ENDPOINT.GET_ALL_PAGES, { needAuth: true });
  return res?.data?.pages ?? [];
};

export const addPageApi = async (payload: PagePayload): Promise<PageItem> => {
  const res = await post(ENDPOINT.ADD_PAGE, payload, { needAuth: true });
  return res?.data?.page;
};

export const updatePageApi = async (
  id: string,
  payload: PagePayload,
): Promise<PageItem> => {
  const res = await post(`${ENDPOINT.UPDATE_PAGE}/${id}`, payload, {
    needAuth: true,
  });
  return res?.data?.page;
};

export const deletePageApi = async (id: string): Promise<void> => {
  await post(`${ENDPOINT.DELETE_PAGE}/${id}`, undefined, { needAuth: true });
};
