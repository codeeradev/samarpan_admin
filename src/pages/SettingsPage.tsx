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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { getRoleFromRoleId } from "@/lib/admin-access";
import {
  AlertTriangle,
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

import {
  getSettingsApi,
  updateAdminAccountApi,
  updateSettingsApi,
  type SettingsItem,
} from "@/apiCalls/settings";
import { resolveAssetUrl } from "./website-content/types";

type AccountFormState = {
  name: string;
  email: string;
  phone: string;
};

export default function SettingsPage() {
  const { admin, logout, updateAdmin } = useAuth();

  const [settings, setSettings] = useState<SettingsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [accountForm, setAccountForm] = useState<AccountFormState>({
    name: "",
    email: "",
    phone: "",
  });

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

  useEffect(() => {
    setAccountForm({
      name: admin?.name ?? "",
      email: admin?.email ?? "",
      phone: admin?.mobile ?? "",
    });
  }, [admin]);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await getSettingsApi();
      setSettings(data);

      if (data?.website_logo) {
        setLogoPreview(data.website_logo);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(
    payload?: Partial<SettingsItem>,
    files?: { logo?: File | null },
  ) {
    try {
      setSettingsSaving(true);
      const body = payload ?? settings;
      const updated = await updateSettingsApi(body ?? {}, files);
      setSettings(updated);

      if (updated.website_logo) {
        setLogoPreview(updated.website_logo);
        setLogoFile(null);
      }

      toast.success("Business settings updated successfully.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleAccountSave() {
    if (!accountForm.name.trim()) {
      toast.error("Full name is required.");
      return;
    }

    if (!accountForm.email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountForm.email.trim())) {
      toast.error("Enter a valid email address.");
      return;
    }

    try {
      setAccountSaving(true);

      const updated = await updateAdminAccountApi({
        name: accountForm.name.trim(),
        email: accountForm.email.trim(),
        phone: String(accountForm.phone || "").trim(),
      });

      updateAdmin({
        name: updated.name,
        email: updated.email,
        mobile: updated.phone ? String(updated.phone) : "",
        avatar: updated.image ?? admin?.avatar ?? "",
        permissions: updated.permissions ?? admin?.permissions,
        roleId: updated.roleId ?? admin?.roleId,
        role:
          updated.roleId !== undefined
            ? getRoleFromRoleId(updated.roleId)
            : (admin?.role ?? "receptionist"),
      });

      toast.success("Account details updated successfully.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAccountSaving(false);
    }
  }

  async function handlePasswordUpdate() {
    if (passwordForm.newPass.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setPasswordSaving(true);
      await updateAdminAccountApi({ password: passwordForm.newPass });
      setPasswordForm({ newPass: "", confirm: "" });
      toast.success("Password updated successfully.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPasswordSaving(false);
    }
  }

  function updateField<K extends keyof SettingsItem>(
    key: K,
    value: SettingsItem[K],
  ) {
    setSettings((prev) => ({
      ...(prev ?? {}),
      [key]: value,
    }));
  }

  function updateSocial(key: string, value: string) {
    setSettings((prev) => ({
      ...(prev ?? {}),
      social_links: {
        ...prev?.social_links,
        [key]: value,
      },
    }));
  }

  const safeSettings = settings ?? ({} as SettingsItem);
  const initials = (accountForm.name || admin?.name || "Admin")
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage account credentials, business details, and legal or informational website settings."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={16} />
              Admin Account
            </CardTitle>
            <CardDescription>
              These details are saved on your login user record.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div>
              <Label>Full Name</Label>
              <Input
                value={accountForm.name}
                onChange={(event) =>
                  setAccountForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label>Login Email</Label>
              <Input
                type="email"
                value={accountForm.email}
                onChange={(event) =>
                  setAccountForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={accountForm.phone}
                onChange={(event) =>
                  setAccountForm((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
              />
            </div>

            <Button disabled={accountSaving} onClick={handleAccountSave}>
              {accountSaving ? "Saving..." : "Save Account"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={16} />
              Password
            </CardTitle>
            <CardDescription>
              Update the password used for admin sign-in.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.newPass ? "text" : "password"}
                  value={passwordForm.newPass}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPass: event.target.value,
                    }))
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      newPass: !prev.newPass,
                    }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={
                    showPasswords.newPass ? "Hide password" : "Show password"
                  }
                >
                  {showPasswords.newPass ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label>Confirm Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirm}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirm: event.target.value,
                    }))
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={
                    showPasswords.confirm ? "Hide password" : "Show password"
                  }
                >
                  {showPasswords.confirm ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <Button disabled={passwordSaving} onClick={handlePasswordUpdate}>
              <Shield size={14} />{" "}
              {passwordSaving ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Info</CardTitle>
            <CardDescription>
              Public-facing contact details for the website.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Label>Inquiry Email</Label>
            <Input
              placeholder="Inquiry Email"
              value={safeSettings.inquiry_email ?? ""}
              onChange={(event) =>
                updateField("inquiry_email", event.target.value)
              }
              disabled={loading}
            />

            <Label>Inquiry Mobile</Label>
            <Input
              placeholder="Inquiry Mobile"
              value={safeSettings.inquiry_mobile_number ?? ""}
              onChange={(event) =>
                updateField("inquiry_mobile_number", event.target.value)
              }
              disabled={loading}
            />

            <Label>Whatsapp Inquiry Number</Label>
            <Input
              placeholder="Whatsapp Inquiry Number"
              value={safeSettings.whatsapp_number ?? ""}
              onChange={(event) =>
                updateField("whatsapp_number", event.target.value)
              }
              disabled={loading}
            />

            <Label>Set Working Hours</Label>
            <Input
              placeholder="Working Hours"
              value={safeSettings.working_hours ?? ""}
              onChange={(event) =>
                updateField("working_hours", event.target.value)
              }
              disabled={loading}
            />

            <Label>Set Address</Label>
            <Textarea
              placeholder="Address"
              value={safeSettings.address ?? ""}
              onChange={(event) => updateField("address", event.target.value)}
              disabled={loading}
            />

            <Button
              disabled={settingsSaving || loading}
              onClick={() => saveSettings()}
            >
              <Save size={14} />{" "}
              {settingsSaving ? "Saving..." : "Save Business Info"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Website Logo</CardTitle>
            <CardDescription>
              Upload logo used across the website.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div>
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
                  <div className="py-6 text-muted-foreground">
                    <p className="text-sm font-medium">
                      Click or drag image to upload
                    </p>
                    <p className="text-xs">PNG, JPG (recommended 200x80)</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={
                        logoPreview.startsWith("blob")
                          ? logoPreview
                          : resolveAssetUrl(logoPreview)
                      }
                      className="h-16 object-contain"
                    />

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
                )}
              </div>

              <Button
                className="mt-4"
                onClick={() => saveSettings({}, { logo: logoFile })}
              >
                Save Logo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>
              Website footer, contact, and social CTA links.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {["facebook", "instagram", "youtube", "whatsapp", "call"].map(
              (item) => (
                <div key={item}>
                  <Label className="capitalize">{item}</Label>
                  <Input
                    key={item}
                    placeholder={item}
                    value={safeSettings.social_links?.[item] ?? ""}
                    onChange={(event) => updateSocial(item, event.target.value)}
                    disabled={loading}
                  />
                </div>
              ),
            )}

            <Button
              disabled={settingsSaving || loading}
              onClick={() => saveSettings()}
            >
              <Save size={14} />{" "}
              {settingsSaving ? "Saving..." : "Save Social Links"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google Reviews</CardTitle>
            <CardDescription>
              Configure Google Place details used to fetch public reviews.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Label>Google Place ID</Label>
            <Input
              placeholder="Google Place ID"
              value={safeSettings.google_reviews?.place_id ?? ""}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...(prev ?? {}),
                  google_reviews: {
                    ...prev?.google_reviews,
                    place_id: event.target.value,
                  },
                }))
              }
              disabled={loading}
            />

            <Label>Google API Key</Label>
            <Input
              placeholder="Google API Key"
              value={safeSettings.google_reviews?.api_key ?? ""}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...(prev ?? {}),
                  google_reviews: {
                    ...prev?.google_reviews,
                    api_key: event.target.value,
                  },
                }))
              }
              disabled={loading}
            />

            <Button
              disabled={settingsSaving || loading}
              onClick={() => saveSettings()}
            >
              <Save size={14} />{" "}
              {settingsSaving ? "Saving..." : "Save Google Settings"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex gap-2">
              <AlertTriangle size={16} />
              Danger Zone
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive"
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
