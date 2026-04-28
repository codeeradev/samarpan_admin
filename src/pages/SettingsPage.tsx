"use client";

import { PageHeader } from "@/components/admin/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
  AlertTriangle,
  Camera,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Save,
  Shield,
  User,
} from "lucide-react";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

import {
  getSettingsApi,
  updateSettingsApi,
  type SettingsItem,
} from "@/apiCalls/settings";

export default function SettingsPage() {
  const { logout } = useAuth();

  const [settings, setSettings] = useState<SettingsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    newPass: "",
    confirm: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    newPass: false,
    confirm: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await getSettingsApi();
      setSettings(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(payload?: Partial<SettingsItem>) {
    try {
      setSaving(true);

      const body = payload ?? settings;

      const updated = await updateSettingsApi(body!);

      setSettings(updated);

      toast.success("Settings updated successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordUpdate() {
    if (passwordForm.newPass.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    await saveSettings({ password: passwordForm.newPass });

    setPasswordForm({
      newPass: "",
      confirm: "",
    });
  }

  function updateField(key: keyof SettingsItem, value: any) {
    setSettings((prev) => ({
      ...prev!,
      [key]: value,
    }));
  }

  function updateSocial(key: string, value: string) {
    setSettings((prev) => ({
      ...prev!,
      social_links: {
        ...prev?.social_links,
        [key]: value,
      },
    }));
  }

  // 👇 Only change: allow UI render even if settings not loaded
  const safeSettings = settings ?? ({} as SettingsItem);

  const initials = safeSettings.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage admin settings and CMS content."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* PROFILE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={16} />
              Admin Profile
            </CardTitle>
            <CardDescription>Update admin information</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div>
              <Label>Full Name</Label>
              <Input
                value={safeSettings.name ?? ""}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={safeSettings.email ?? ""}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={safeSettings.mobile_number ?? ""}
                onChange={(e) =>
                  updateField("mobile_number", e.target.value)
                }
              />
            </div>

            <Button disabled={saving} onClick={() => saveSettings()}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        {/* PASSWORD */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={16} />
              Password
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input
                type={showPasswords.newPass ? "text" : "password"}
                value={passwordForm.newPass}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPass: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Confirm Password</Label>
              <Input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordForm.confirm}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirm: e.target.value,
                  })
                }
              />
            </div>

            <Button disabled={saving} onClick={handlePasswordUpdate}>
              <Shield size={14} /> Update Password
            </Button>
          </CardContent>
        </Card>

        {/* BUSINESS INFO */}
        <Card>
          <CardHeader>
            <CardTitle>Business Info</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              placeholder="Inquiry Email"
              value={safeSettings.inquiry_email ?? ""}
              onChange={(e) =>
                updateField("inquiry_email", e.target.value)
              }
            />

            <Input
              placeholder="Inquiry Mobile"
              value={safeSettings.inquiry_mobile_number ?? ""}
              onChange={(e) =>
                updateField("inquiry_mobile_number", e.target.value)
              }
            />

            <Input
              placeholder="Working Hours"
              value={safeSettings.working_hours ?? ""}
              onChange={(e) =>
                updateField("working_hours", e.target.value)
              }
            />

            <Textarea
              placeholder="Address"
              value={safeSettings.address ?? ""}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </CardContent>
        </Card>

        {/* SOCIAL */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {["facebook", "instagram", "youtube", "whatsapp", "call"].map(
              (s) => (
                <Input
                  key={s}
                  placeholder={s}
                  value={safeSettings.social_links?.[s] ?? ""}
                  onChange={(e) => updateSocial(s, e.target.value)}
                />
              ),
            )}
          </CardContent>
        </Card>

        {/* CMS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>CMS Content</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Textarea
              placeholder="About Us"
              value={safeSettings.about_us ?? ""}
              onChange={(e) => updateField("about_us", e.target.value)}
            />

            <Textarea
              placeholder="Privacy Policy"
              value={safeSettings.privacy_policy ?? ""}
              onChange={(e) =>
                updateField("privacy_policy", e.target.value)
              }
            />

            <Textarea
              placeholder="Terms & Conditions"
              value={safeSettings.term_and_condition ?? ""}
              onChange={(e) =>
                updateField("term_and_condition", e.target.value)
              }
            />

            <Textarea
              placeholder="Contact Us"
              value={safeSettings.contact_us ?? ""}
              onChange={(e) =>
                updateField("contact_us", e.target.value)
              }
            />

            <Button disabled={saving} onClick={() => saveSettings()}>
              <Save size={14} /> Save CMS Content
            </Button>
          </CardContent>
        </Card>

        {/* DANGER */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600 flex gap-2">
              <AlertTriangle size={16} />
              Danger Zone
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Button
              variant="outline"
              className="border-red-300 text-red-600"
              onClick={logout}
            >
              <LogOut size={14} /> Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}