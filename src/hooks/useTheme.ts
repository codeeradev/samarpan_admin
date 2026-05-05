import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { getThemeApi } from "@/apiCalls/theme";
import {
  applyThemeColors,
  cachePanelTheme,
  getDefaultPanelTheme,
} from "@/lib/theme";

/**
 * Hook to load and apply panel theme
 * Should be called after authentication check
 */
export function useTheme() {
  const { admin } = useAuth();

  useEffect(() => {
    if (!admin) return;

    const loadAndApplyTheme = async () => {
      try {
        // Fetch theme from API
        const themeData = await getThemeApi("panel");

        if (themeData?.colors) {
          // Apply fetched theme
          applyThemeColors(themeData.colors);
          // Cache in localStorage
          cachePanelTheme(themeData.colors);
        } else {
          // Fallback to default if API returns nothing
          const defaultTheme = getDefaultPanelTheme();
          applyThemeColors(defaultTheme.colors);
        }
      } catch (error) {
        console.warn("Failed to load theme from API, using default:", error);
        // Fallback to default on error
        const defaultTheme = getDefaultPanelTheme();
        applyThemeColors(defaultTheme.colors);
      }
    };

    loadAndApplyTheme();
  }, [admin]);
}
