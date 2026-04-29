import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface ContentItem {
  _id: string;
  modelKey: string;
  title?: string;
  content?: Record<string, unknown>;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertContentPayload {
  modelKey: string;
  title?: string;
  content: Record<string, unknown>;
  isActive?: boolean;
  files?: Record<string, File | string | undefined>;
}

function toFormData(payload: UpsertContentPayload) {
  const formData = new FormData();

  formData.append("modelKey", payload.modelKey);

  if (payload.title?.trim()) {
    formData.append("title", payload.title.trim());
  }

  formData.append("content", JSON.stringify(payload.content));

  if (payload.isActive !== undefined) {
    formData.append("isActive", String(payload.isActive));
  }

  Object.entries(payload.files ?? {}).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    }
  });

  return formData;
}

export const getContentByModelKeyApi = async (
  modelKey: string,
): Promise<ContentItem | null> => {
  try {
    const res = await get(`${ENDPOINT.GET_CONTENT}/${modelKey}`, {
      needAuth: true,
    });

    return res?.data?.content ?? null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }

    throw new Error(
      error.response?.data?.message ?? "Failed to fetch content",
    );
  }
};

export const upsertContentApi = async (
  payload: UpsertContentPayload,
): Promise<ContentItem> => {
  try {
    const res = await post(ENDPOINT.UPSERT_CONTENT, toFormData(payload), {
      needAuth: true,
    });

    return res?.data?.content;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to save content",
    );
  }
};
