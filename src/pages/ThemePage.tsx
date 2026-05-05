"use client";

import {
  getThemeApi,
  upsertThemeApi,
  type ThemeColors,
  type ThemeType,
  type ThemeModeColors,
} from "@/apiCalls/theme";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  applyThemeColors,
  cachePanelTheme,
  getDefaultThemeColors,
  isHexColor,
  normalizeThemeColors,
} from "@/lib/theme";
import { RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { resolveAssetUrl } from "./website-content/types";

type ThemeMode = "light" | "dark";
type ThemeSectionKey = keyof ThemeColors["light"];

/* =========================
   WEBSITE THEME TYPE
========================= */
type WebsiteColors = {
  primary: string;
  primary_deep: string;
  primary_light: string;
  primary_soft: string;
};

const defaultWebsiteColors: WebsiteColors = {
  primary: "#ab2548",
  primary_deep: "#ab2548",
  primary_light: "#ab2548",
  primary_soft: "#ab2548",
};

/* =========================
   PANEL SECTIONS (UNCHANGED)
========================= */
const THEME_SECTIONS = [
  {
    key: "base",
    title: "Base",
    description: "Main surface, text, inputs, outlines and focus states.",
    fields: [
      { key: "background", label: "Page Background Color" },
      { key: "foreground", label: "Main Text Color" },
      { key: "border", label: "Border / Divider Color" },
      { key: "input", label: "Input Field Background" },
      { key: "ring", label: "Focus Highlight (when clicking input)" },
    ],
  },
  {
    key: "interactive",
    title: "Interactive",
    description: "Buttons, badges, accents and destructive actions.",
    fields: [
      { key: "primary", label: "Main Button Color" },
      { key: "primaryForeground", label: "Main Button Text" },
      { key: "secondary", label: "Secondary Button Color" },
      { key: "secondaryForeground", label: "Secondary Button Text" },
      { key: "accent", label: "Highlight / Special Color" },
      { key: "accentForeground", label: "Highlight Text" },
    ],
  },
  {
    key: "sidebar",
    title: "Sidebar",
    description: "Navigation-specific colors for the admin shell.",
    fields: [
      { key: "background", label: "Sidebar Background" },
      { key: "foreground", label: "Sidebar Text" },
      { key: "primary", label: "Active Menu Item" },
      { key: "primaryForeground", label: "Active Menu Text" },
      { key: "accent", label: "Hover Color" },
      { key: "accentForeground", label: "Hover Text" },
      { key: "border", label: "Sidebar Border" },
      { key: "ring", label: "Focus Highlight" },
    ],
  },
] as const;

export default function ThemePage() {
  const [activeTab, setActiveTab] = useState<ThemeType>("panel");
  const [activeMode, setActiveMode] = useState<ThemeMode>("light");

  // PANEL STATE
  const [colors, setColors] = useState<ThemeColors>(() =>
    getDefaultThemeColors("panel"),
  );

  // WEBSITE STATE
  const [websiteColors, setWebsiteColors] =
    useState<WebsiteColors>(defaultWebsiteColors);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadTheme(activeTab);
  }, [activeTab]);

  const previewColors = useMemo(
    () => normalizeThemeColors(colors)[activeMode],
    [activeMode, colors],
  );

  function getLogoSrc(path?: string | null) {
    if (!path) return "";

    // blob or full URL → direct use
    if (path.startsWith("blob:") || path.startsWith("http")) {
      return path;
    }

    // backend relative path
    return resolveAssetUrl(path);
  }
  /* =========================
     LOAD THEME
  ========================= */
  async function loadTheme(type: ThemeType) {
    try {
      setLoading(true);
      const data = await getThemeApi(type);

      if (type === "website") {
        setWebsiteColors({
          ...defaultWebsiteColors,
          ...(data?.colors || {}),
        });

        if (data?.logo) {
          setLogoPreview(data.logo);
        }

        if (data?.favicon) {
          setFaviconPreview(data.favicon);
        }

        return;
      }

      const panelColors =
        (data?.colors as ThemeColors) ?? getDefaultThemeColors(type);
      const nextColors = normalizeThemeColors(panelColors);

      setColors(nextColors);
      applyThemeColors(nextColors);
    } catch (error: any) {
      toast.error(error.message ?? "Failed to load theme.");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     PANEL UPDATE (UNCHANGED)
  ========================= */
  function updateColor(
    sectionKey: ThemeSectionKey,
    fieldKey: string,
    value: string,
  ) {
    setColors((current) => {
      const next = {
        ...current,
        [activeMode]: {
          ...current[activeMode],
          [sectionKey]: {
            ...current[activeMode][sectionKey],
            [fieldKey]: value,
          },
        },
      };

      if (activeTab === "panel") {
        applyThemeColors(normalizeThemeColors(next));
      }

      return next;
    });
  }

  /* =========================
     WEBSITE UPDATE
  ========================= */
  function updateWebsiteColor(key: keyof WebsiteColors, value: string) {
    setWebsiteColors((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  /* =========================
     RESET
  ========================= */
  function handleReset() {
    if (activeTab === "website") {
      setWebsiteColors(defaultWebsiteColors);
      setLogoFile(null);
      setLogoPreview(null);
      setFaviconFile(null);
      setFaviconPreview(null);
      return;
    }

    const defaultColors = getDefaultThemeColors(activeTab);
    setColors(defaultColors);
    applyThemeColors(defaultColors);
  }

  /* =========================
     SAVE
  ========================= */
  async function handleSave() {
    try {
      setSaving(true);

      if (activeTab === "website") {
        // VALIDATION
        for (const key in websiteColors) {
          if (!isHexColor(websiteColors[key as keyof WebsiteColors])) {
            toast.error(`Invalid color in ${key}`);
            return;
          }
        }

        await upsertThemeApi(
          "website",
          websiteColors as any,
          logoFile,
          faviconFile,
        );

        toast.success("Website theme saved");
        return;
      }

      const normalized = normalizeThemeColors(colors);
      await upsertThemeApi("panel", normalized);

      applyThemeColors(normalized);
      cachePanelTheme(normalized);

      // Trigger storage event so other listeners know theme changed
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "panel-theme",
          newValue: JSON.stringify(normalized),
          oldValue: null,
          storageArea: localStorage,
        }),
      );

      toast.success("Panel theme saved");
    } catch (error: any) {
      toast.error(error.message ?? "Failed to save theme.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Themes"
        description="Manage themes"
        action={
          <div className="flex gap-2">
            <Button onClick={handleReset} variant="outline">
              <RotateCcw size={14} /> Reset
            </Button>
            <Button onClick={handleSave}>
              <Save size={14} /> {saving ? "Saving..." : "Save Theme"}
            </Button>
          </div>
        }
      />

      {/* TABS */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as ThemeType)}
      >
        <TabsList>
          <TabsTrigger value="panel">Admin Panel</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* =========================
          PANEL VIEW (UNCHANGED)
      ========================= */}
      {activeTab === "panel" && (
        <div className="flex gap-4">
          {/* PREVIEW */}
          <Card className="xl:w-[320px] border-border shadow-card">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Live Preview</CardTitle>
                <Tabs
                  value={activeMode}
                  onValueChange={(value) => setActiveMode(value as ThemeMode)}
                >
                  <TabsList className="rounded-xl bg-muted p-1">
                    <TabsTrigger value="light" className="px-3">
                      Light
                    </TabsTrigger>
                    <TabsTrigger value="dark" className="px-3">
                      Dark
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <p className="text-sm text-muted-foreground">
                Changes preview instantly for panel colors while you edit.
              </p>
            </CardHeader>

            <CardContent>
              <div
                className="rounded-3xl border p-5 shadow-sm"
                style={{
                  backgroundColor: previewColors.base.background,
                  color: previewColors.base.foreground,
                  borderColor: previewColors.base.border,
                }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Samarpan Admin</p>
                      <p
                        style={{
                          color: previewColors.components.mutedForeground,
                        }}
                      >
                        Theme preview
                      </p>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: previewColors.interactive.primary,
                        color: previewColors.interactive.primaryForeground,
                      }}
                    >
                      Primary
                    </span>
                  </div>

                  <div
                    className="rounded-2xl border p-4"
                    style={{
                      backgroundColor: previewColors.components.card,
                      color: previewColors.components.cardForeground,
                      borderColor: previewColors.base.border,
                    }}
                  >
                    <p className="text-sm font-semibold">Card Surface</p>
                    <p
                      className="mt-1 text-sm"
                      style={{
                        color: previewColors.components.mutedForeground,
                      }}
                    >
                      Buttons, cards, tables and sidebar all use these tokens.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className="rounded-xl px-3 py-2 text-sm font-medium"
                        style={{
                          backgroundColor: previewColors.interactive.secondary,
                          color: previewColors.interactive.secondaryForeground,
                        }}
                      >
                        Secondary
                      </span>

                      <span
                        className="rounded-xl px-3 py-2 text-sm font-medium"
                        style={{
                          backgroundColor: previewColors.interactive.accent,
                          color: previewColors.interactive.accentForeground,
                        }}
                      >
                        Accent
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {(["1", "2", "3", "4", "5"] as const).map((key) => (
                      <div
                        key={key}
                        className="h-10 rounded-xl"
                        style={{ backgroundColor: previewColors.charts[key] }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTIONS */}
          <div className="flex-1 space-y-4">
            {THEME_SECTIONS.map((section) => (
              <Card key={section.key}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  {section.fields.map((field) => {
                    const value = (colors[activeMode] as any)[section.key][
                      field.key
                    ] as string;

                    return (
                      <div key={field.key}>
                        <Label>{field.label}</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={value}
                            onChange={(e) =>
                              updateColor(
                                section.key,
                                field.key,
                                e.target.value,
                              )
                            }
                            className="h-11 w-16 rounded-xl p-1"
                          />
                          <Input
                            value={value}
                            onChange={(e) =>
                              updateColor(
                                section.key,
                                field.key,
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* =========================
          WEBSITE VIEW (NEW)
      ========================= */}
      {activeTab === "website" && (
        <Card>
          <CardHeader>
            <CardTitle>Website Theme</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="mb-2 block">Website Logo</Label>

              <div className="border-2 border-dashed rounded-2xl p-4 text-center relative hover:border-primary transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setLogoFile(file);
                    setLogoPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />

                {!logoPreview ? (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <p className="text-sm font-medium">
                      Click or drag image to upload
                    </p>
                    <p className="text-xs">PNG, JPG (recommended 200x80)</p>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center gap-3">
                    <img
                      src={getLogoSrc(logoPreview)}
                      alt="Logo preview"
                      className="h-16 object-contain"
                    />

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <Label className="mb-2 block">Favicon</Label>
              <p className="text-xs text-muted-foreground mb-2">
                This icon appears in browser tabs
              </p>
              <div className="border-2 border-dashed rounded-2xl p-4 text-center relative hover:border-primary transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFaviconFile(file);
                    setFaviconPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />

                {!faviconPreview ? (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <p className="text-sm font-medium">Upload favicon</p>
                    <p className="text-xs">Recommended 32x32 or 64x64</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={getLogoSrc(faviconPreview)}
                      alt="Favicon preview"
                      className="h-10 w-10 object-contain"
                    />

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFaviconFile(null);
                        setFaviconPreview(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {Object.entries(websiteColors).map(([key, value]) => (
              <div key={key}>
                <Label className="capitalize">{key.replace("_", " ")}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={value}
                    onChange={(e) =>
                      updateWebsiteColor(
                        key as keyof WebsiteColors,
                        e.target.value,
                      )
                    }
                    className="h-11 w-16 mt-2 rounded-xl p-1"
                  />
                  <Input
                    value={value}
                    onChange={(e) =>
                      updateWebsiteColor(
                        key as keyof WebsiteColors,
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
