"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { applyPanelTheme } from "@/lib/theme"; // add this

import { getThemeApi, upsertThemeApi, type ThemeType } from "@/apiCalls/theme";

// ─── TYPES ─────────────────────────────────────────────

type WebsiteThemeColors = {
  primary: string;
  primary_deep?: string;
  primary_light?: string;
  primary_soft?: string;
};

type PanelThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  border: string;
};

// ─── DEFAULTS ─────────────────────────────────────────

const DEFAULT_WEBSITE_THEME: WebsiteThemeColors = {
  primary: "#D89F00",
  primary_deep: "#A67C00",
  primary_light: "#F5D77A",
  primary_soft: "#FFF8E1",
};

const DEFAULT_PANEL_THEME: PanelThemeColors = {
  primary: "#D89F00",
  secondary: "#A67C00",
  background: "#F8FAFC",
  foreground: "#1E293B",
  border: "#E2E8F0",
};

// ─── COMPONENT ───────────────────────────────────────

export default function ThemePage() {
  const [activeTab, setActiveTab] = useState<ThemeType>("website");
  const [colors, setColors] = useState<any>(DEFAULT_WEBSITE_THEME);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTheme(activeTab);
  }, [activeTab]);

  // ─── LOAD THEME ────────────────────────────────────
  async function loadTheme(type: ThemeType) {
    try {
      setLoading(true);
      const data = await getThemeApi(type);

      if (data?.colors) {
        setColors(
          type === "website"
            ? { ...DEFAULT_WEBSITE_THEME, ...data.colors }
            : { ...DEFAULT_PANEL_THEME, ...data.colors },
        );
      } else {
        setColors(
          type === "website" ? DEFAULT_WEBSITE_THEME : DEFAULT_PANEL_THEME,
        );
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ─── SAVE ──────────────────────────────────────────
  async function handleSave() {
    if (!colors.primary) {
      toast.error("Primary color is required");
      return;
    }

    try {
      setSaving(true);
      await upsertThemeApi(activeTab, colors);
      toast.success("Theme saved successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ─── UPDATE ────────────────────────────────────────
  function updateColor(key: string, value: string) {
    const updated = {
      ...colors,
      [key]: value,
    };

    setColors(updated);

    // 🔥 LIVE PREVIEW (only for panel)
    if (activeTab === "panel") {
      applyPanelTheme(updated);
    }
  }
  // ─── FIELDS ────────────────────────────────────────
  const websiteFields = [
    "primary",
    "primary_deep",
    "primary_light",
    "primary_soft",
  ];

  const panelFields = [
    "primary",
    "secondary",
    "background",
    "foreground",
    "border",
  ];

  const fields = activeTab === "website" ? websiteFields : panelFields;

  // ─── UI ────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Themes"
        description="Manage website and admin panel themes."
        action={
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="gap-2"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Theme"}
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as ThemeType)}
        className="mb-6"
      >
        <TabsList className="bg-slate-100 p-2 rounded-2xl">
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="panel">Panel</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "website" ? "Website Theme" : "Admin Panel Theme"}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field} className="space-y-1">
              <Label className="capitalize">{field}</Label>

              <div className="flex gap-2">
                {/* Color Picker */}
                <Input
                  type="color"
                  value={colors[field] || "#000000"}
                  onChange={(e) => updateColor(field, e.target.value)}
                  className="w-14 h-10 p-1"
                  disabled={loading}
                />

                {/* HEX Input */}
                <Input
                  value={colors[field] || ""}
                  onChange={(e) => updateColor(field, e.target.value)}
                  placeholder="#000000"
                  disabled={loading}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
