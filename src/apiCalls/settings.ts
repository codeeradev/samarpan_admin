import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

export interface SocialLinks {
  facebook?: string;
  youtube?: string;
  whatsapp?: string;
  instagram?: string;
  call?: string;
}

export interface SettingsItem {
  name?: string;
  email?: string;
  inquiry_email?: string;
  mobile_number?: string;
  inquiry_mobile_number?: string;
  address?: string;
  working_hours?: string;
  password?: string;
  website_logo?: string;
  google_reviews?: {
    place_id?: string;
    api_key?: string;
  };

  whatsapp_number?: string;
  social_links?: SocialLinks;
}

export interface AdminAccountPayload {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

export interface AdminAccountItem {
  _id: string;
  name: string;
  email: string;
  phone?: number | string;
  role?: string;
  roleId?: number;
  permissions?: Record<string, boolean>;
  image?: string;
}

export const getSettingsApi = async (): Promise<SettingsItem> => {
  try {
    const res = await get(ENDPOINT.GET_SETTINGS, { needAuth: true });
    return res?.data?.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to fetch settings",
    );
  }
};

export const updateSettingsApi = async (
  payload: Partial<SettingsItem>,
  files?: { logo?: File | null }
): Promise<SettingsItem> => {
  try {
    const formData = new FormData();

    // normal fields
    Object.keys(payload).forEach((key) => {
      const value = payload[key as keyof SettingsItem];

      if (key === "social_links") {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // file
    if (files?.logo) {
      formData.append("image", files.logo);
    }

    const res = await post(ENDPOINT.UPDATE_SETTINGS, formData, {
      needAuth: true,
    });

    return res?.data?.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to update settings"
    );
  }
};

export const updateAdminAccountApi = async (
  payload: AdminAccountPayload,
): Promise<AdminAccountItem> => {
  try {
    const res = await post(ENDPOINT.UPDATE_ADMIN_ACCOUNT, payload, {
      needAuth: true,
    });

    return res?.data?.admin;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to update admin account",
    );
  }
};
