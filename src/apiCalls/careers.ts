import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

export type CareerStatus = "open" | "closed" | "draft";

export interface CareerItem {
  _id: string;
  title: string;
  slug: string;
  department: string;
  employmentType: string;
  experience: string;
  summary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  applyEmail: string;
  applyLink: string;
  status: CareerStatus;
  sortOrder: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CareerPayload {
  title: string;
  slug: string;
  department: string;
  employmentType: string;
  experience: string;
  summary: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  applyEmail: string;
  applyLink: string;
  status: CareerStatus;
  sortOrder: number;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeCareerItem(career: Record<string, any>): CareerItem {
  return {
    _id: career._id,
    title: career.title || "",
    slug: career.slug || "",
    department: career.department || "",
    employmentType: career.employmentType || "",
    experience: career.experience || "",
    summary: career.summary || "",
    description: career.description || "",
    requirements: normalizeStringArray(career.requirements),
    responsibilities: normalizeStringArray(career.responsibilities),
    applyEmail: career.applyEmail || "",
    applyLink: career.applyLink || "",
    status: career.status || "open",
    sortOrder:
      typeof career.sortOrder === "number"
        ? career.sortOrder
        : Number(career.sortOrder) || 0,
    isActive: career.isActive,
    createdAt: career.createdAt,
    updatedAt: career.updatedAt,
  };
}

function toRequestPayload(payload: CareerPayload) {
  return {
    title: payload.title.trim(),
    slug: payload.slug.trim(),
    department: payload.department.trim(),
    employmentType: payload.employmentType.trim(),
    experience: payload.experience.trim(),
    summary: payload.summary.trim(),
    description: payload.description.trim(),
    requirements: payload.requirements,
    responsibilities: payload.responsibilities,
    applyEmail: payload.applyEmail.trim(),
    applyLink: payload.applyLink.trim(),
    status: payload.status,
    sortOrder: payload.sortOrder,
    isActive: payload.status !== "draft",
  };
}

export const getAllCareersApi = async (): Promise<CareerItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_CAREERS, { needAuth: true });
    return (res?.data?.careers ?? []).map(normalizeCareerItem);
  } catch (error) {
    throw createApiRequestError(error, "Failed to fetch careers");
  }
};

export const addCareerApi = async (
  payload: CareerPayload,
): Promise<CareerItem> => {
  try {
    const res = await post(ENDPOINT.ADD_CAREER, toRequestPayload(payload), {
      needAuth: true,
    });
    return normalizeCareerItem(res?.data?.career ?? {});
  } catch (error) {
    throw createApiRequestError(error, "Failed to create career");
  }
};

export const updateCareerApi = async (
  id: string,
  payload: CareerPayload,
): Promise<CareerItem> => {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_CAREER}/${id}`,
      toRequestPayload(payload),
      {
        needAuth: true,
      },
    );
    return normalizeCareerItem(res?.data?.career ?? {});
  } catch (error) {
    throw createApiRequestError(error, "Failed to update career");
  }
};

export const deleteCareerApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_CAREER}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error) {
    throw createApiRequestError(error, "Failed to delete career");
  }
};
