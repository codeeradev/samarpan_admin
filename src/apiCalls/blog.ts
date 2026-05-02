import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

/* ================= TYPES ================= */

export interface BlogPayload {
  title: string;
  serviceId?: string;
  shortDescription?: string;
  content?: string;
  seo?: Record<string, any>;
  status?: "draft" | "published";
  image?: File | string;
}

export interface BlogItem {
  _id: string;
  title: string;
  serviceId?: string;
  image?: string;
  shortDescription?: string;
  content?: string;
  seo?: any;
  status?: "draft" | "published";
  createdAt?: string;
  updatedAt?: string;
}

/* ================= HELPERS ================= */

function appendValue(fd: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (typeof value === "string" && value.trim() === "") return;
  fd.append(key, String(value));
}

function toFormData(payload: Partial<BlogPayload>): FormData {
  const fd = new FormData();

  appendValue(fd, "title", payload.title?.trim());
  appendValue(fd, "serviceId", payload.serviceId);
  appendValue(fd, "shortDescription", payload.shortDescription?.trim());
  appendValue(fd, "content", payload.content?.trim());
  appendValue(fd, "status", payload.status);

  if (payload.seo) {
    fd.append("seo", JSON.stringify(payload.seo));
  }

  if (payload.image instanceof File) {
    fd.append("image", payload.image);
  }

  return fd;
}

/* ================= API ================= */

// GET ALL
export const getAllBlogsApi = async (): Promise<BlogItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_BLOGS, {
      needAuth: true,
    });
    return res?.data?.blogs ?? [];
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to fetch blogs",
    );
  }
};

// ADD
export const addBlogApi = async (
  payload: BlogPayload,
): Promise<BlogItem> => {
  try {
    const res = await post(
      ENDPOINT.ADD_BLOG,
      toFormData(payload),
      { needAuth: true },
    );

    return res?.data?.blog;
  } catch (error: any) {
    throw error;
  }
};

// UPDATE
export const updateBlogApi = async (
  id: string,
  payload: Partial<BlogPayload>,
): Promise<BlogItem> => {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_BLOG}/${id}`,
      toFormData(payload),
      { needAuth: true },
    );

    return res?.data?.blog;
  } catch (error: any) {
    throw error
  }
};

// DELETE
export const deleteBlogApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_BLOG}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to delete blog",
    );
  }
};