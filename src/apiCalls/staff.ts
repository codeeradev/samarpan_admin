import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

export interface AdminStaffItem {
  _id: string;
  name: string;
  email: string;
  phone?: number | string;
  roleId?: number;
  permissions?: Record<string, boolean>;
  status?: boolean;
  isActive?: boolean;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddAdminStaffPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleId: number;
  permissions?: Record<string, boolean>;
  status?: boolean;
  isActive?: boolean;
}

export interface UpdateAdminStaffPayload {
  roleId?: number;
  permissions?: Record<string, boolean>;
}

function normalizePhone(value?: string) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits || undefined;
}

export const getAdminStaffApi = async (): Promise<AdminStaffItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ADMIN_STAFF, { needAuth: true });
    return res?.data?.staff ?? [];
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to fetch admin staff");
  }
};

export const addAdminStaffApi = async (
  payload: AddAdminStaffPayload,
): Promise<AdminStaffItem> => {
  try {
    const res = await post(
      ENDPOINT.ADD_STAFF,
      {
        ...payload,
        phone: normalizePhone(payload.phone),
        permissions: payload.permissions ?? {},
      },
      { needAuth: true },
    );

    return res?.data?.staff;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to add staff");
  }
};

export const updateAdminStaffApi = async (
  id: string,
  payload: UpdateAdminStaffPayload,
): Promise<AdminStaffItem> => {
  try {
    const res = await post(`${ENDPOINT.UPDATE_STAFF}/${id}`, payload, {
      needAuth: true,
    });

    return res?.data?.staff;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to update staff");
  }
};

export const deleteAdminStaffApi = async (id: string): Promise<void> => {
  try {
    await post(`${ENDPOINT.DELETE_STAFF}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to delete staff member");
  }
};
