import { ENDPOINT } from "@/apis/endpoint";
import { get, post } from "@/apis/apiClient";
import { createApiRequestError } from "@/lib/api-errors";

export interface ServicePayload {
  title: string;
  slug: string;
  shortDescription: string;
  image?: File | string;
  icon?: File | string;
  features: string[];
  content?: string;
  faqs?: { question: string; answer: string }[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

export interface ServiceItem extends ServicePayload {
  _id: string;
}

// ─── Helper: convert payload → FormData ────────────────────────────────────────
function toFormData(payload: Partial<ServicePayload>): FormData {
  const fd = new FormData();

  if (payload.title) fd.append("title", payload.title);
  if (payload.slug) fd.append("slug", payload.slug);
  if (payload.shortDescription)
    fd.append("shortDescription", payload.shortDescription);
  if (payload.content) fd.append("content", payload.content);

  // Files — append as Blob; strings (existing URLs) are skipped
  if (payload.image instanceof File) fd.append("image", payload.image);
  if (payload.icon instanceof File) fd.append("icon", payload.icon);

  // Arrays — must be JSON-stringified so multer/body can parse them server-side
  if (payload.features) fd.append("features", JSON.stringify(payload.features));
  if (payload.faqs) fd.append("faqs", JSON.stringify(payload.faqs));
  if (payload.seo) fd.append("seo", JSON.stringify(payload.seo));

  return fd;
}

// ─── API calls ─────────────────────────────────────────────────────────────────
export const getAllServicesApi = async (): Promise<ServiceItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_SERVICES, { needAuth: true });
    return res?.data?.services ?? [];
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to fetch services");
  }
};

export const addServiceApi = async (
  payload: ServicePayload,
): Promise<ServiceItem> => {
  try {
    const res = await post(ENDPOINT.ADD_SERVICE, toFormData(payload), { needAuth: true });
    return res?.data?.service;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to add service");
  }
};

export const updateServiceApi = async (
  id: string,
  payload: Partial<ServicePayload>,
): Promise<ServiceItem> => {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_SERVICE}/${id}`,
      toFormData(payload),
      { needAuth: true }
    );
    return res?.data?.service;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to update service");
  }
};

export const deleteServiceApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_SERVICE}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to delete service");
  }
};
