export function hexToHsl(hex: string) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);

  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h *= 60;
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyPanelTheme(colors: any) {
  if (!colors) return;

  const root = document.documentElement;

  if (colors.primary)
    root.style.setProperty("--primary", hexToHsl(colors.primary));

  if (colors.secondary)
    root.style.setProperty("--secondary", hexToHsl(colors.secondary));

  if (colors.background)
    root.style.setProperty("--background", hexToHsl(colors.background));

  if (colors.foreground)
    root.style.setProperty("--foreground", hexToHsl(colors.foreground));

  if (colors.border)
    root.style.setProperty("--border", hexToHsl(colors.border));
}