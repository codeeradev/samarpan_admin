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
      { key: "background", label: "Background" },
      { key: "foreground", label: "Foreground" },
      { key: "border", label: "Border" },
      { key: "input", label: "Input" },
      { key: "ring", label: "Ring" },
    ],
  },
  {
    key: "interactive",
    title: "Interactive",
    description: "Buttons, badges, accents and destructive actions.",
    fields: [
      { key: "primary", label: "Primary" },
      { key: "primaryForeground", label: "Primary Foreground" },
      { key: "secondary", label: "Secondary" },
      { key: "secondaryForeground", label: "Secondary Foreground" },
      { key: "accent", label: "Accent" },
      { key: "accentForeground", label: "Accent Foreground" },
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

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadTheme(activeTab);
  }, [activeTab]);

  const previewColors = useMemo(
    () => normalizeThemeColors(colors)[activeMode],
    [activeMode, colors],
  );

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
        return;
      }

      const nextColors = normalizeThemeColors(
        data?.colors as ThemeColors | undefined,
        getDefaultThemeColors(type),
      );

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
    sectionKey: "base" | "interactive",
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

        await upsertThemeApi("website", websiteColors as any);

        toast.success("Website theme saved");
        return;
      }

      const normalized = normalizeThemeColors(colors);
      await upsertThemeApi("panel", normalized);

      applyThemeColors(normalized);
      cachePanelTheme(normalized);

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
                    const value = (colors[activeMode] as any)[section.key][field.key] as string;

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
                    className="h-11 w-16 rounded-xl p-1"
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
