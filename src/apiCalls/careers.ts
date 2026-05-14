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
  image?: string;
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
  image?: File | null;
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
    image: career.image || "",
  };
}

function createCareerFormData(payload: CareerPayload) {
  const formData = new FormData();

  formData.append("title", payload.title.trim());
  formData.append("slug", payload.slug.trim());
  formData.append("department", payload.department.trim());
  formData.append(
    "employmentType",
    payload.employmentType.trim(),
  );
  formData.append("experience", payload.experience.trim());
  formData.append("summary", payload.summary.trim());
  formData.append("description", payload.description.trim());

  payload.requirements.forEach((item) => {
    formData.append("requirements", item);
  });

  payload.responsibilities.forEach((item) => {
    formData.append("responsibilities", item);
  });

  formData.append("applyEmail", payload.applyEmail.trim());
  formData.append("applyLink", payload.applyLink.trim());

  formData.append("status", payload.status);

  formData.append(
    "sortOrder",
    String(payload.sortOrder),
  );

  formData.append(
    "isActive",
    String(payload.status !== "draft"),
  );

  if (payload.image) {
    formData.append("image", payload.image);
  }

  return formData;
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
    const res = await post(ENDPOINT.ADD_CAREER, createCareerFormData(payload), {
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
      createCareerFormData(payload),
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
