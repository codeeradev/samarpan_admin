import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

export interface DoctorPayload {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  specialization: string;
  description: string;
  experience: string;
  qualification: string;
  expertise?: string[];
  permissions?: Record<string, boolean>;
  status?: boolean;
  isActive?: boolean;
  image?: File | string;
}

export interface DoctorItem {
  _id: string;
  name: string;
  roleId?: number;
  permissions?: Record<string, boolean>;
  phone?: number | string;
  status?: boolean;
  email: string;
  image?: string;
  specialization?: string;
  description?: string;
  experience?: string;
  qualification?: string;
  expertise?: string[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function appendValue(fd: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (typeof value === "string" && value.trim() === "") return;
  fd.append(key, String(value));
}

function normalizePhone(value?: string) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits || undefined;
}

function toFormData(payload: Partial<DoctorPayload>): FormData {
  const fd = new FormData();

  appendValue(fd, "name", payload.name?.trim());
  appendValue(fd, "email", payload.email?.trim());
  appendValue(fd, "password", payload.password?.trim());
  appendValue(fd, "phone", normalizePhone(payload.phone));
  appendValue(fd, "specialization", payload.specialization?.trim());
  appendValue(fd, "description", payload.description?.trim());
  appendValue(fd, "experience", payload.experience?.trim());
  appendValue(fd, "qualification", payload.qualification?.trim());
  appendValue(fd, "status", payload.status);
  appendValue(fd, "isActive", payload.isActive);

  if (payload.image instanceof File) {
    fd.append("image", payload.image);
  }

  if (payload.expertise) {
    fd.append("expertise", JSON.stringify(payload.expertise));
  }

  if (payload.permissions) {
    fd.append("permissions", JSON.stringify(payload.permissions));
  }

  return fd;
}

export const getAllDoctorsApi = async (): Promise<DoctorItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_DOCTORS, { needAuth: true });
    return res?.data?.doctors ?? [];
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to fetch doctors");
  }
};

export const addDoctorApi = async (
  payload: DoctorPayload,
): Promise<DoctorItem> => {
  try {
    const res = await post(ENDPOINT.ADD_DOCTOR, toFormData(payload), {
      needAuth: true,
    });
    return res?.data?.doctor;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to add doctor");
  }
};

export const updateDoctorApi = async (
  id: string,
  payload: Partial<DoctorPayload>,
): Promise<DoctorItem> => {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_DOCTOR}/${id}`,
      toFormData(payload),
      { needAuth: true },
    );
    return res?.data?.doctor;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to update doctor");
  }
};

export const deleteDoctorApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_DOCTOR}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to delete doctor");
  }
};
