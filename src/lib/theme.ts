import type { ThemeColors, ThemeItem, ThemeModeColors, ThemeType } from "@/apiCalls/theme";

const PANEL_THEME_STORAGE_KEY = "panel-theme";
const THEME_STYLE_ID = "panel-theme-vars";

const DEFAULT_THEME_COLORS: ThemeColors = {
  light: {
    base: {
      background: "#f8f8f8",
      foreground: "#1a1a1a",
      border: "#e0e0e0",
      input: "#f0f0f0",
      ring: "#d4a574",
    },
    interactive: {
      primary: "#d4a574",
      primaryForeground: "#ffffff",
      secondary: "#8b6f47",
      secondaryForeground: "#ffffff",
      accent: "#f4e8d0",
      accentForeground: "#2d2416",
      destructive: "#8b3a3a",
      destructiveForeground: "#ffffff",
    },
    components: {
      card: "#ffffff",
      cardForeground: "#1a1a1a",
      popover: "#ffffff",
      popoverForeground: "#1a1a1a",
      muted: "#f5f5f5",
      mutedForeground: "#7a7a7a",
    },
    sidebar: {
      background: "#ffffff",
      foreground: "#475569",
      primary: "#d4a574",
      primaryForeground: "#ffffff",
      accent: "#f4e8d0",
      accentForeground: "#a67c00",
      border: "#e0e0e0",
      ring: "#d4a574",
    },
    charts: {
      1: "#d4a574",
      2: "#8b6f47",
      3: "#f4e8d0",
      4: "#a6956d",
      5: "#9e8860",
    },
  },
  dark: {
    base: {
      background: "#1a1a1a",
      foreground: "#f5f5f5",
      border: "#333333",
      input: "#2a2a2a",
      ring: "#d4a574",
    },
    interactive: {
      primary: "#d4a574",
      primaryForeground: "#1a1a1a",
      secondary: "#a6956d",
      secondaryForeground: "#1a1a1a",
      accent: "#8b6f47",
      accentForeground: "#f5f5f5",
      destructive: "#c45555",
      destructiveForeground: "#1a1a1a",
    },
    components: {
      card: "#252525",
      cardForeground: "#f5f5f5",
      popover: "#2a2a2a",
      popoverForeground: "#f5f5f5",
      muted: "#333333",
      mutedForeground: "#999999",
    },
    sidebar: {
      background: "#1f1f1f",
      foreground: "#e0e0e0",
      primary: "#d4a574",
      primaryForeground: "#1a1a1a",
      accent: "#8b6f47",
      accentForeground: "#f5f5f5",
      border: "#333333",
      ring: "#d4a574",
    },
    charts: {
      1: "#d4a574",
      2: "#a6956d",
      3: "#8b6f47",
      4: "#7a6f5f",
      5: "#6a5f4f",
    },
  },
};

function cloneThemeColors(colors: ThemeColors): ThemeColors {
  return {
    light: {
      base: { ...colors.light.base },
      interactive: { ...colors.light.interactive },
      components: { ...colors.light.components },
      sidebar: { ...colors.light.sidebar },
      charts: { ...colors.light.charts },
    },
    dark: {
      base: { ...colors.dark.base },
      interactive: { ...colors.dark.interactive },
      components: { ...colors.dark.components },
      sidebar: { ...colors.dark.sidebar },
      charts: { ...colors.dark.charts },
    },
  };
}

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  const shortHexMatch = /^#([0-9a-f]{3})$/i.exec(trimmed);

  if (shortHexMatch) {
    const [, shortHex] = shortHexMatch;
    return `#${shortHex
      .split("")
      .map((char) => `${char}${char}`)
      .join("")
      .toLowerCase()}`;
  }

  if (/^#([0-9a-f]{6})$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  return null;
}

function pickHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  return normalizeHexColor(value) ?? fallback;
}

function mergeModeColors(
  base: ThemeModeColors,
  overrides?: Partial<ThemeModeColors> | null,
): ThemeModeColors {
  return {
    base: {
      background: pickHexColor(overrides?.base?.background, base.base.background),
      foreground: pickHexColor(overrides?.base?.foreground, base.base.foreground),
      border: pickHexColor(overrides?.base?.border, base.base.border),
      input: pickHexColor(overrides?.base?.input, base.base.input),
      ring: pickHexColor(overrides?.base?.ring, base.base.ring),
    },
    interactive: {
      primary: pickHexColor(
        overrides?.interactive?.primary,
        base.interactive.primary,
      ),
      primaryForeground: pickHexColor(
        overrides?.interactive?.primaryForeground,
        base.interactive.primaryForeground,
      ),
      secondary: pickHexColor(
        overrides?.interactive?.secondary,
        base.interactive.secondary,
      ),
      secondaryForeground: pickHexColor(
        overrides?.interactive?.secondaryForeground,
        base.interactive.secondaryForeground,
      ),
      accent: pickHexColor(overrides?.interactive?.accent, base.interactive.accent),
      accentForeground: pickHexColor(
        overrides?.interactive?.accentForeground,
        base.interactive.accentForeground,
      ),
      destructive: pickHexColor(
        overrides?.interactive?.destructive,
        base.interactive.destructive,
      ),
      destructiveForeground: pickHexColor(
        overrides?.interactive?.destructiveForeground,
        base.interactive.destructiveForeground,
      ),
    },
    components: {
      card: pickHexColor(overrides?.components?.card, base.components.card),
      cardForeground: pickHexColor(
        overrides?.components?.cardForeground,
        base.components.cardForeground,
      ),
      popover: pickHexColor(overrides?.components?.popover, base.components.popover),
      popoverForeground: pickHexColor(
        overrides?.components?.popoverForeground,
        base.components.popoverForeground,
      ),
      muted: pickHexColor(overrides?.components?.muted, base.components.muted),
      mutedForeground: pickHexColor(
        overrides?.components?.mutedForeground,
        base.components.mutedForeground,
      ),
    },
    sidebar: {
      background: pickHexColor(
        overrides?.sidebar?.background,
        base.sidebar.background,
      ),
      foreground: pickHexColor(
        overrides?.sidebar?.foreground,
        base.sidebar.foreground,
      ),
      primary: pickHexColor(overrides?.sidebar?.primary, base.sidebar.primary),
      primaryForeground: pickHexColor(
        overrides?.sidebar?.primaryForeground,
        base.sidebar.primaryForeground,
      ),
      accent: pickHexColor(overrides?.sidebar?.accent, base.sidebar.accent),
      accentForeground: pickHexColor(
        overrides?.sidebar?.accentForeground,
        base.sidebar.accentForeground,
      ),
      border: pickHexColor(overrides?.sidebar?.border, base.sidebar.border),
      ring: pickHexColor(overrides?.sidebar?.ring, base.sidebar.ring),
    },
    charts: {
      1: pickHexColor(overrides?.charts?.["1"], base.charts["1"]),
      2: pickHexColor(overrides?.charts?.["2"], base.charts["2"]),
      3: pickHexColor(overrides?.charts?.["3"], base.charts["3"]),
      4: pickHexColor(overrides?.charts?.["4"], base.charts["4"]),
      5: pickHexColor(overrides?.charts?.["5"], base.charts["5"]),
    },
  };
}

export function normalizeThemeColors(
  colors?: Partial<ThemeColors> | null,
  fallback: ThemeColors = DEFAULT_THEME_COLORS,
): ThemeColors {
  return {
    light: mergeModeColors(fallback.light, colors?.light),
    dark: mergeModeColors(fallback.dark, colors?.dark),
  };
}

function srgbChannelToLinear(value: number) {
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

export function hexToOklch(hex: string): string {
  const normalized = normalizeHexColor(hex);

  if (!normalized) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const red = srgbChannelToLinear(
    parseInt(normalized.slice(1, 3), 16) / 255,
  );
  const green = srgbChannelToLinear(
    parseInt(normalized.slice(3, 5), 16) / 255,
  );
  const blue = srgbChannelToLinear(
    parseInt(normalized.slice(5, 7), 16) / 255,
  );

  const l = Math.cbrt(
    0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue,
  );
  const m = Math.cbrt(
    0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue,
  );
  const s = Math.cbrt(
    0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue,
  );

  const lightness =
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const chroma = Math.sqrt(a * a + b * b);
  const hue = (Math.atan2(b, a) * 180) / Math.PI;

  return `${lightness.toFixed(3)} ${chroma.toFixed(3)} ${(
    hue < 0 ? hue + 360 : hue
  ).toFixed(1)}`;
}

const CSS_VARIABLE_MAPPINGS = [
  ["--background", ["base", "background"]],
  ["--foreground", ["base", "foreground"]],
  ["--border", ["base", "border"]],
  ["--input", ["base", "input"]],
  ["--ring", ["base", "ring"]],
  ["--primary", ["interactive", "primary"]],
  ["--primary-foreground", ["interactive", "primaryForeground"]],
  ["--secondary", ["interactive", "secondary"]],
  ["--secondary-foreground", ["interactive", "secondaryForeground"]],
  ["--accent", ["interactive", "accent"]],
  ["--accent-foreground", ["interactive", "accentForeground"]],
  ["--destructive", ["interactive", "destructive"]],
  ["--destructive-foreground", ["interactive", "destructiveForeground"]],
  ["--card", ["components", "card"]],
  ["--card-foreground", ["components", "cardForeground"]],
  ["--popover", ["components", "popover"]],
  ["--popover-foreground", ["components", "popoverForeground"]],
  ["--muted", ["components", "muted"]],
  ["--muted-foreground", ["components", "mutedForeground"]],
  ["--sidebar", ["sidebar", "background"]],
  ["--sidebar-foreground", ["sidebar", "foreground"]],
  ["--sidebar-primary", ["sidebar", "primary"]],
  ["--sidebar-primary-foreground", ["sidebar", "primaryForeground"]],
  ["--sidebar-accent", ["sidebar", "accent"]],
  ["--sidebar-accent-foreground", ["sidebar", "accentForeground"]],
  ["--sidebar-border", ["sidebar", "border"]],
  ["--sidebar-ring", ["sidebar", "ring"]],
  ["--chart-1", ["charts", "1"]],
  ["--chart-2", ["charts", "2"]],
  ["--chart-3", ["charts", "3"]],
  ["--chart-4", ["charts", "4"]],
  ["--chart-5", ["charts", "5"]],
] as const;

function buildThemeRule(selector: string, colors: ThemeModeColors) {
  const declarations = CSS_VARIABLE_MAPPINGS.map(([cssVariable, [group, key]]) => {
    const value = colors[group][key as never] as string;
    return `  ${cssVariable}: ${hexToOklch(value)};`;
  }).join("\n");

  return `${selector} {\n${declarations}\n}`;
}

function ensureThemeStyleElement() {
  let styleElement = document.getElementById(THEME_STYLE_ID) as
    | HTMLStyleElement
    | null;

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = THEME_STYLE_ID;
    document.head.appendChild(styleElement);
  }

  return styleElement;
}

export function applyThemeColors(colors?: Partial<ThemeColors> | null) {
  if (typeof document === "undefined") {
    return;
  }

  const normalized = normalizeThemeColors(colors);
  const styleElement = ensureThemeStyleElement();

  styleElement.textContent = [
    buildThemeRule(":root", normalized.light),
    buildThemeRule(":root.dark", normalized.dark),
  ].join("\n\n");
}

export function cachePanelTheme(colors: ThemeColors) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    PANEL_THEME_STORAGE_KEY,
    JSON.stringify(normalizeThemeColors(colors)),
  );
}

export function loadCachedTheme(): ThemeColors | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawTheme = localStorage.getItem(PANEL_THEME_STORAGE_KEY);

  if (!rawTheme) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawTheme) as ThemeColors | ThemeItem;
    const themeColors: Partial<ThemeColors> =
      typeof parsed === "object" &&
      parsed !== null &&
      "colors" in parsed &&
      parsed.colors
        ? parsed.colors
        : (parsed as ThemeColors);

    return normalizeThemeColors(themeColors);
  } catch {
    return null;
  }
}

export function getDefaultThemeColors(_type: ThemeType = "panel"): ThemeColors {
  return cloneThemeColors(DEFAULT_THEME_COLORS);
}

export function getDefaultPanelTheme(): ThemeItem {
  return {
    _id: "default-panel-theme",
    name: "panel",
    colors: getDefaultThemeColors("panel"),
  };
}

export function initializeTheme() {
  const cachedTheme = loadCachedTheme();
  applyThemeColors(cachedTheme ?? getDefaultThemeColors("panel"));
}

export function isHexColor(value: string) {
  return normalizeHexColor(value) !== null;
}

export function themeColor(variableName: string, alpha?: number) {
  return alpha === undefined
    ? `oklch(var(--${variableName}))`
    : `oklch(var(--${variableName}) / ${alpha})`;
}
