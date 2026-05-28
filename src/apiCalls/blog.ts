import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

/* ================= TYPES ================= */

export interface BlogPayload {
  title: string;
  serviceId?: string;
  blogCategoryId?: string;
  shortDescription?: string;
  content?: string;
  seo?: Record<string, any>;
  status?: "draft" | "published";
  sortOrder?: number;
  image?: File | string;
}

export interface BlogItem {
  _id: string;
  title: string;
  serviceId?: string;
  blogCategoryId?: string | BlogCategoryItem;
  image?: string;
  shortDescription?: string;
  content?: string;
  seo?: any;
  status?: "draft" | "published";
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BlogCategoryPayload {
  title: string;
  image?: File | string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface BlogCategoryItem {
  _id: string;
  title: string;
  image?: string | null;
  sortOrder?: number;
  isActive?: boolean;
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
  appendValue(fd, "blogCategoryId", payload.blogCategoryId);
  appendValue(fd, "shortDescription", payload.shortDescription?.trim());
  appendValue(fd, "content", payload.content?.trim());
  appendValue(fd, "status", payload.status);
  appendValue(fd, "sortOrder", payload.sortOrder);

  if (payload.seo) {
    fd.append("seo", JSON.stringify(payload.seo));
  }

  if (payload.image instanceof File) {
    fd.append("image", payload.image);
  }

  return fd;
}

function categoryToFormData(payload: Partial<BlogCategoryPayload>): FormData {
  const fd = new FormData();

  appendValue(fd, "title", payload.title?.trim());
  appendValue(fd, "sortOrder", payload.sortOrder);

  if (payload.isActive !== undefined) {
    fd.append("isActive", String(payload.isActive));
  }

  if (payload.image instanceof File) {
    fd.append("image", payload.image);
  }

  return fd;
}

function categoryToRequestData(payload: Partial<BlogCategoryPayload>) {
  if (payload.image instanceof File) {
    return categoryToFormData(payload);
  }

  return {
    title: payload.title?.trim(),
    sortOrder: payload.sortOrder,
    isActive: payload.isActive,
  };
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
    throw createApiRequestError(error, "Failed to fetch blogs");
  }
};

export const getAllBlogCategoriesApi = async (): Promise<
  BlogCategoryItem[]
> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_BLOG_CATEGORIES, {
      needAuth: true,
    });
    return res?.data?.categories ?? [];
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to fetch blog categories");
  }
};

export const addBlogCategoryApi = async (
  payload: BlogCategoryPayload,
): Promise<BlogCategoryItem> => {
  try {
    const res = await post(
      ENDPOINT.ADD_BLOG_CATEGORY,
      categoryToRequestData(payload),
      {
        needAuth: true,
      },
    );

    return res?.data?.category;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to add blog category");
  }
};

export const updateBlogCategoryApi = async (
  id: string,
  payload: Partial<BlogCategoryPayload>,
): Promise<BlogCategoryItem> => {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_BLOG_CATEGORY}/${id}`,
      categoryToRequestData(payload),
      {
        needAuth: true,
      },
    );

    return res?.data?.category;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to update blog category");
  }
};

export const deleteBlogCategoryApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_BLOG_CATEGORY}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to delete blog category");
  }
};

// ADD
export const addBlogApi = async (payload: BlogPayload): Promise<BlogItem> => {
  try {
    const res = await post(ENDPOINT.ADD_BLOG, toFormData(payload), {
      needAuth: true,
    });

    return res?.data?.blog;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to add blog");
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
    throw createApiRequestError(error, "Failed to update blog");
  }
};

// DELETE
export const deleteBlogApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_BLOG}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to delete blog");
  }
};
