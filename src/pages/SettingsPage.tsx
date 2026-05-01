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
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(payload?: Partial<SettingsItem>) {
    try {
      setSettingsSaving(true);
      const body = payload ?? settings;
      const updated = await updateSettingsApi(body ?? {});
      setSettings(updated);
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
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
            <Input
              placeholder="Inquiry Email"
              value={safeSettings.inquiry_email ?? ""}
              onChange={(event) =>
                updateField("inquiry_email", event.target.value)
              }
              disabled={loading}
            />

            <Input
              placeholder="Inquiry Mobile"
              value={safeSettings.inquiry_mobile_number ?? ""}
              onChange={(event) =>
                updateField("inquiry_mobile_number", event.target.value)
              }
              disabled={loading}
            />

            <Input
              placeholder="Whatsapp Inquiry Number"
              value={safeSettings.whatsapp_number ?? ""}
              onChange={(event) =>
                updateField("whatsapp_number", event.target.value)
              }
              disabled={loading}
            />

            <Input
              placeholder="Working Hours"
              value={safeSettings.working_hours ?? ""}
              onChange={(event) =>
                updateField("working_hours", event.target.value)
              }
              disabled={loading}
            />

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
            <CardTitle>Social Links</CardTitle>
            <CardDescription>
              Website footer, contact, and social CTA links.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {["facebook", "instagram", "youtube", "whatsapp", "call"].map(
              (item) => (
                <Input
                  key={item}
                  placeholder={item}
                  value={safeSettings.social_links?.[item] ?? ""}
                  onChange={(event) => updateSocial(item, event.target.value)}
                  disabled={loading}
                />
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
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>CMS Content</CardTitle>
            <CardDescription>
              Legal pages and informational copy that still belongs to the
              settings document.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Textarea
              placeholder="About Us"
              value={safeSettings.about_us ?? ""}
              onChange={(event) => updateField("about_us", event.target.value)}
              disabled={loading}
            />

            <Textarea
              placeholder="Privacy Policy"
              value={safeSettings.privacy_policy ?? ""}
              onChange={(event) =>
                updateField("privacy_policy", event.target.value)
              }
              disabled={loading}
            />

            <Textarea
              placeholder="Terms & Conditions"
              value={safeSettings.term_and_condition ?? ""}
              onChange={(event) =>
                updateField("term_and_condition", event.target.value)
              }
              disabled={loading}
            />

            <Textarea
              placeholder="Contact Us"
              value={safeSettings.contact_us ?? ""}
              onChange={(event) =>
                updateField("contact_us", event.target.value)
              }
              disabled={loading}
            />

            <Button
              disabled={settingsSaving || loading}
              onClick={() => saveSettings()}
            >
              <Save size={14} />{" "}
              {settingsSaving ? "Saving..." : "Save CMS Content"}
            </Button>
          </CardContent>
        </Card>

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
