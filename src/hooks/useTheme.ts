import { useEffect } from "react";
import { useAuth } from "./useAuth";
import {
  getThemeApi,
  type ThemeColors,
  type WebsiteThemeColors,
} from "@/apiCalls/theme";
import {
  applyThemeColors,
  cachePanelTheme,
  getDefaultThemeColors,
  loadCachedTheme,
} from "@/lib/theme";

function isPanelThemeColors(
  colors: ThemeColors | WebsiteThemeColors,
): colors is ThemeColors {
  return "light" in colors && "dark" in colors;
}

/**
 * Hook to load and apply panel theme
 * Should be called after authentication check
 * Listens to localStorage changes and applies theme on mount and tab focus
 */
export function useTheme() {
  const { admin } = useAuth();

  useEffect(() => {
    // Initial theme load from cache/API
    const loadAndApplyTheme = async () => {
      try {
        // Try to fetch fresh theme from API
        const themeData = await getThemeApi("panel");

        if (themeData?.colors && isPanelThemeColors(themeData.colors)) {
          applyThemeColors(themeData.colors);
          cachePanelTheme(themeData.colors);
          return;
        }
      } catch (error) {
        // If API fails, try cached theme
      }

      // Fallback to cached theme
      const cachedTheme = loadCachedTheme();
      if (cachedTheme) {
        applyThemeColors(cachedTheme);
        return;
      }

      // Last resort - use default
      applyThemeColors(getDefaultThemeColors("panel"));
    };

    if (admin) {
      loadAndApplyTheme();
    }
  }, [admin]);

  // Listen for storage changes (theme saved in another tab or the theme page)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "panel-theme" && e.newValue) {
        try {
          const cachedTheme = loadCachedTheme();
          if (cachedTheme) {
            applyThemeColors(cachedTheme);
          }
        } catch (error) {
          console.warn("Failed to apply theme from storage:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Re-apply theme when tab regains focus (ensures sidebar colors update)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const cachedTheme = loadCachedTheme();
        if (cachedTheme) {
          applyThemeColors(cachedTheme);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
}
