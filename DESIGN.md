"use client";

import { getThemeApi, upsertThemeApi, type ThemeColors, type ThemeType } from "@/apiCalls/theme";
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

type ThemeField = {
  key: string;
  label: string;
};

type ThemeSection = {
  key: ThemeSectionKey;
  title: string;
  description: string;
  fields: ThemeField[];
};

const THEME_SECTIONS: ThemeSection[] = [
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
      { key: "destructive", label: "Destructive" },
      { key: "destructiveForeground", label: "Destructive Foreground" },
    ],
  },
  {
    key: "components",
    title: "Components",
    description: "Card, popover and muted surfaces.",
    fields: [
      { key: "card", label: "Card" },
      { key: "cardForeground", label: "Card Foreground" },
      { key: "popover", label: "Popover" },
      { key: "popoverForeground", label: "Popover Foreground" },
      { key: "muted", label: "Muted" },
      { key: "mutedForeground", label: "Muted Foreground" },
    ],
  },
  {
    key: "sidebar",
    title: "Sidebar",
    description: "Navigation-specific colors for the admin shell.",
    fields: [
      { key: "background", label: "Sidebar Background" },
      { key: "foreground", label: "Sidebar Foreground" },
      { key: "primary", label: "Sidebar Primary" },
      { key: "primaryForeground", label: "Sidebar Primary Foreground" },
      { key: "accent", label: "Sidebar Accent" },
      { key: "accentForeground", label: "Sidebar Accent Foreground" },
      { key: "border", label: "Sidebar Border" },
      { key: "ring", label: "Sidebar Ring" },
    ],
  },
  {
    key: "charts",
    title: "Charts",
    description: "Reusable chart palette used by the dashboard and stats.",
    fields: [
      { key: "1", label: "Chart 1" },
      { key: "2", label: "Chart 2" },
      { key: "3", label: "Chart 3" },
      { key: "4", label: "Chart 4" },
      { key: "5", label: "Chart 5" },
    ],
  },
];

function getInvalidColorLabel(colors: ThemeColors) {
  for (const mode of ["light", "dark"] as const) {
    for (const section of THEME_SECTIONS) {
      for (const field of section.fields) {
        const value =
          colors[mode][section.key][field.key as keyof ThemeColors["light"][ThemeSectionKey]];

        if (typeof value === "string" && !isHexColor(value)) {
          return `${mode} ${field.label}`;
        }
      }
    }
  }

  return null;
}

export default function ThemePage() {
  const [activeTab, setActiveTab] = useState<ThemeType>("panel");
  const [activeMode, setActiveMode] = useState<ThemeMode>("light");
  const [colors, setColors] = useState<ThemeColors>(() =>
    getDefaultThemeColors("panel"),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadTheme(activeTab);
  }, [activeTab]);

  const previewColors = useMemo(
    () => normalizeThemeColors(colors)[activeMode],
    [activeMode, colors],
  );

  async function loadTheme(type: ThemeType) {
    try {
      setLoading(true);
      const data = await getThemeApi(type);
      const nextColors = normalizeThemeColors(
        data?.colors,
        getDefaultThemeColors(type),
      );

      setColors(nextColors);
    } catch (error: any) {
      toast.error(error.message ?? "Failed to load theme.");
      setColors(getDefaultThemeColors(type));
    } finally {
      setLoading(false);
    }
  }

  function updateColor(
    sectionKey: ThemeSectionKey,
    fieldKey: string,
    value: string,
  ) {
    setColors((current) => {
      const nextColors: ThemeColors = {
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
        applyThemeColors(
          normalizeThemeColors(nextColors, getDefaultThemeColors("panel")),
        );
      }

      return nextColors;
    });
  }

  function handleReset() {
    const defaultColors = getDefaultThemeColors(activeTab);
    setColors(defaultColors);

    if (activeTab === "panel") {
      applyThemeColors(defaultColors);
    }
  }

  async function handleSave() {
    const invalidField = getInvalidColorLabel(colors);

    if (invalidField) {
      toast.error(`Invalid hex color in ${invalidField}.`);
      return;
    }

    try {
      setSaving(true);
      const normalizedColors = normalizeThemeColors(
        colors,
        getDefaultThemeColors(activeTab),
      );

      await upsertThemeApi(activeTab, normalizedColors);

      setColors(normalizedColors);

      if (activeTab === "panel") {
        applyThemeColors(normalizedColors);
        cachePanelTheme(normalizedColors);
      }

      toast.success("Theme saved successfully.");
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
        description="Manage the full light and dark color system for the website and admin panel."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading || saving}
              className="gap-2"
            >
              <RotateCcw size={14} />
              Reset
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || saving}
              className="gap-2"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save Theme"}
            </Button>
          </div>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ThemeType)}
        className="space-y-4"
      >
        <TabsList className="rounded-2xl bg-muted p-1.5">
          <TabsTrigger value="panel">Admin Panel</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4 xl:flex-row">
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
                    <p style={{ color: previewColors.components.mutedForeground }}>
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
                    style={{ color: previewColors.components.mutedForeground }}
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

        <div className="flex-1 space-y-4">
          {THEME_SECTIONS.map((section) => (
            <Card key={section.key} className="border-border shadow-card">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {section.fields.map((field) => {
                  const value =
                    colors[activeMode][section.key][
                      field.key as keyof ThemeColors["light"][ThemeSectionKey]
                    ];

                  return (
                    <div key={`${section.key}-${field.key}`} className="space-y-2">
                      <Label>{field.label}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={
                            typeof value === "string" && isHexColor(value)
                              ? value
                              : "#000000"
                          }
                          onChange={(event) =>
                            updateColor(section.key, field.key, event.target.value)
                          }
                          disabled={loading}
                          className="h-11 w-16 rounded-xl p-1"
                        />
                        <Input
                          value={typeof value === "string" ? value : ""}
                          onChange={(event) =>
                            updateColor(section.key, field.key, event.target.value)
                          }
                          placeholder="#000000"
                          disabled={loading}
                          className="h-11 rounded-xl font-mono text-sm"
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
    </div>
  );
}
