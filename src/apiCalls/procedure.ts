import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

/* ================= TYPES ================= */

export interface ProcedurePayload {
  title: string;
  slug?: string;
  content?: string;
  shortDescription: string;
  seo?: Record<string, any>;
  sortOrder?: number;
  isActive?: boolean;
  image?: File | string;
}

export interface ProcedureItem {
  _id: string;
  title: string;
  shortDescription: string;
  slug?: string;
  image?: string;
  content?: string;
  seo?: any;
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

function toFormData(payload: Partial<ProcedurePayload>): FormData {
  const fd = new FormData();

  appendValue(fd, "title", payload.title?.trim());
  appendValue(fd, "slug", payload.slug?.trim());
  appendValue(fd, "content", payload.content?.trim());
  appendValue(fd, "shortDescription", payload.shortDescription?.trim());
  if (payload.sortOrder !== undefined) {
    appendValue(fd, "sortOrder", payload.sortOrder);
  }

  if (payload.isActive !== undefined) {
    appendValue(fd, "isActive", payload.isActive);
  }

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
export const getAllProceduresApi = async (): Promise<
  ProcedureItem[]
> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_PROCEDURES, {
      needAuth: true,
    });

    return res?.data ?? [];
  } catch (error: any) {
    throw createApiRequestError(
      error,
      "Failed to fetch procedures",
    );
  }
};

// ADD
export const addProcedureApi = async (
  payload: ProcedurePayload,
): Promise<ProcedureItem> => {
  try {
    const res = await post(
      ENDPOINT.ADD_PROCEDURE,
      toFormData(payload),
      {
        needAuth: true,
      },
    );

    return res?.data?.procedure;
  } catch (error: any) {
    throw createApiRequestError(
      error,
      "Failed to add procedure",
    );
  }
};

// UPDATE
export const updateProcedureApi = async (
  id: string,
  payload: Partial<ProcedurePayload>,
): Promise<ProcedureItem> => {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_PROCEDURE}/${id}`,
      toFormData(payload),
      {
        needAuth: true,
      },
    );

    return res?.data?.procedure;
  } catch (error: any) {
    throw createApiRequestError(
      error,
      "Failed to update procedure",
    );
  }
};

// DELETE
export const deleteProcedureApi = async (
  id: string,
): Promise<void> => {
  try {
    await post(
      `${ENDPOINT.DELETE_PROCEDURE}/${id}`,
      undefined,
      {
        needAuth: true,
      },
    );
  } catch (error: any) {
    throw createApiRequestError(
      error,
      "Failed to delete procedure",
    );
  }
};