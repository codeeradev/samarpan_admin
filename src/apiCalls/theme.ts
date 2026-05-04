import { ENDPOINT } from "@/apis/endpoint";
import { get, post } from "@/apis/apiClient";
import { createApiRequestError } from "@/lib/api-errors";

// ─── Types ────────────────────────────────────────────────────────────────

export type ThemeType = "panel" | "website";

export interface ThemeColors {
  primary: string;
  primary_deep?: string;
  primary_light?: string;
  primary_soft?: string;
}

export interface ThemeItem {
  _id: string;
  name: ThemeType;
  colors: ThemeColors;
}

// ─── API Calls ────────────────────────────────────────────────────────────

// ✅ Get Theme (auto-fill)
export const getThemeApi = async (
  name: ThemeType,
): Promise<ThemeItem | null> => {
  try {
    const res = await get(`${ENDPOINT.GET_THEMES}?name=${name}`, {
      needAuth: true,
    });

    // ⚠️ backend returns array → take first
    return res?.data?.themes?.[0] ?? null;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to fetch theme");
  }
};

// ✅ Upsert Theme (create/update)
export const upsertThemeApi = async (
  name: ThemeType,
  colors: ThemeColors,
): Promise<ThemeItem> => {
  try {
    const res = await post(
      `${ENDPOINT.UPSERT_THEME}?name=${name}`,
      { colors },
      { needAuth: true },
    );

    return res?.data?.theme;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to save theme");
  }
};
