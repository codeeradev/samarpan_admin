import { ENDPOINT } from "@/apis/endpoint";
import { get, post } from "@/apis/apiClient";
import { createApiRequestError } from "@/lib/api-errors";

// ─── Types ────────────────────────────────────────────────────────────────

export type ThemeType = "panel" | "website";

/* =========================
   PANEL THEME TYPES
========================= */

export interface ThemeBaseColors {
  background: string;
  foreground: string;
  border: string;
  input: string;
  ring: string;
}

export interface ThemeInteractiveColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
}

export interface ThemeComponentColors {
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
}

export interface ThemeSidebarColors {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  ring: string;
}

export interface ThemeChartColors {
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
}

export interface ThemeModeColors {
  base: ThemeBaseColors;
  interactive: ThemeInteractiveColors;
  components: ThemeComponentColors;
  sidebar: ThemeSidebarColors;
  charts: ThemeChartColors;
}

export interface ThemeColors {
  light: ThemeModeColors;
  dark: ThemeModeColors;
}

/* =========================
   WEBSITE THEME TYPES (FLAT)
========================= */

export interface WebsiteThemeColors {
  primary: string;
  primary_deep: string;
  primary_light: string;
  primary_soft: string;
}

/* =========================
   THEME ITEM (UNION)
========================= */

export interface ThemeItem {
  _id: string;
  name: ThemeType;
  logo?: string;
  favicon?: string;
  colors: ThemeColors | WebsiteThemeColors;
}

/* =========================
   API Calls
========================= */

// ✅ Get Theme
export const getThemeApi = async (
  name: ThemeType,
): Promise<ThemeItem | null> => {
  try {
    const res = await get(`${ENDPOINT.GET_THEMES}?name=${name}`, {
      needAuth: true,
    });

    return res?.data?.themes?.[0] ?? null;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to fetch theme");
  }
};

// ✅ Upsert Theme (supports BOTH panel + website)
export const upsertThemeApi = async (
  name: ThemeType,
  colors: ThemeColors | WebsiteThemeColors,
  logoFile?: File | null,
  faviconFile?: File | null
): Promise<ThemeItem> => {
  try {
    const formData = new FormData();

    formData.append("colors", JSON.stringify(colors));

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    if (faviconFile) {
      formData.append("favicon", faviconFile);
    }

    const res = await post(`${ENDPOINT.UPSERT_THEME}?name=${name}`, formData, {
      needAuth: true,
    });

    return res?.data?.theme;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to save theme");
  }
};
