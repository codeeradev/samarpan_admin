import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export type PageStatus = "draft" | "published";

export interface PageSeo {
  metaTitle: string;
  metaDescription: string;
}

export interface PageItem {
  _id: string;
  title: string;
  slug: string;
  content: string;
  status: PageStatus;
  seo: PageSeo;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PagePayload {
  title: string;
  slug: string;
  content: string;
  status: PageStatus;
  metaTitle: string;
  metaDescription: string;
}

function normalizePageItem(page: Record<string, any>): PageItem {
  const seo = page.seo || {};

  return {
    _id: page._id,
    title: page.title || "",
    slug: page.slug || "",
    content: page.content || "",
    status: page.status || (page.isActive === false ? "draft" : "published"),
    seo: {
      metaTitle: seo.metaTitle || page.metaTitle || "",
      metaDescription: seo.metaDescription || page.metaDescription || "",
    },
    isActive: page.isActive,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  };
}

function toRequestPayload(payload: PagePayload) {
  return {
    title: payload.title.trim(),
    slug: payload.slug.trim(),
    content: payload.content,
    status: payload.status,
    isActive: payload.status === "published",
    metaTitle: payload.metaTitle.trim(),
    metaDescription: payload.metaDescription.trim(),
    seo: {
      metaTitle: payload.metaTitle.trim(),
      metaDescription: payload.metaDescription.trim(),
    },
  };
}

export const getAllPagesApi = async (): Promise<PageItem[]> => {
  const res = await get(ENDPOINT.GET_ALL_PAGES, { needAuth: true });
  return (res?.data?.pages ?? []).map(normalizePageItem);
};

export const addPageApi = async (payload: PagePayload): Promise<PageItem> => {
  const res = await post(ENDPOINT.ADD_PAGE, toRequestPayload(payload), {
    needAuth: true,
  });
  return normalizePageItem(res?.data?.page ?? {});
};

export const updatePageApi = async (
  id: string,
  payload: PagePayload,
): Promise<PageItem> => {
  const res = await post(
    `${ENDPOINT.UPDATE_PAGE}/${id}`,
    toRequestPayload(payload),
    {
      needAuth: true,
    },
  );
  return normalizePageItem(res?.data?.page ?? {});
};

export const deletePageApi = async (id: string): Promise<void> => {
  await post(`${ENDPOINT.DELETE_PAGE}/${id}`, undefined, { needAuth: true });
};
