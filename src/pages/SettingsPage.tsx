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
import { useAuth } from "@/hooks/useAuth";
import { mockAdmin } from "@/services/mockData";
import type { Admin } from "@/types";
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
import { useState } from "react";
import { toast } from "sonner";

// ─── Password Strength ────────────────────────────────────────────────────────

function getPasswordStrength(password: string): {
  level: "weak" | "medium" | "strong";
  label: string;
  color: string;
  width: string;
} {
  if (!password) return { level: "weak", label: "", color: "", width: "0%" };
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@#$%^&*!]/.test(password);
  const score = [
    password.length >= 8,
    hasUpper && hasLower,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  if (score <= 1)
    return { level: "weak", label: "Weak", color: "bg-red-400", width: "33%" };
  if (score <= 2)
    return {
      level: "medium",
      label: "Medium",
      color: "bg-amber-400",
      width: "66%",
    };
  return {
    level: "strong",
    label: "Strong",
    color: "bg-emerald-500",
    width: "100%",
  };
}

// ─── Password Field ───────────────────────────────────────────────────────────

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  ocid: string;
  error?: string;
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  ocid,
  error,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={ocid}>{label}</Label>
      <div className="relative">
        <Input
          id={ocid}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl pr-10"
          data-ocid={ocid}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors min-h-[24px] min-w-[24px] flex items-center justify-center"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p
          className="text-xs text-red-500 flex items-start gap-1 break-words"
          data-ocid={`${ocid}_error`}
        >
          <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { admin, logout } = useAuth();
  const source: Admin = admin ?? mockAdmin;

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: source.name,
    email: source.email,
    phone: "+91 98765 43200",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState({
    newPass: "",
    confirm: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const initials = source.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const strength = getPasswordStrength(passwordForm.newPass);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  async function handleSaveProfile() {
    if (!profileForm.name.trim()) {
      toast.error("Full name is required.");
      return;
    }
    setProfileSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setProfileSaving(false);
    toast.success("Profile updated successfully.");
  }

  async function handleChangePassword() {
    const errors = { newPass: "", confirm: "" };
    let hasError = false;

    if (passwordForm.newPass.length < 8) {
      errors.newPass = "New password must be at least 8 characters.";
      hasError = true;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      errors.confirm = "Passwords do not match.";
      hasError = true;
    }
    setPasswordErrors(errors);
    if (hasError) return;

    setPasswordSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setPasswordSaving(false);

    // Mock: always treat current password as incorrect
    toast.error("Current password is incorrect.");
    setPasswordForm({ current: "", newPass: "", confirm: "" });
  }

  function handleLogout() {
    logout();
    toast.success("Logged out successfully.");
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div data-ocid="settings.page">
      <PageHeader
        title="Settings"
        description="Manage your admin profile and account security."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ── Section 1: Admin Profile ── */}
        <Card
          className="border border-border rounded-2xl shadow-sm"
          data-ocid="settings.profile_card"
        >
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <User size={16} className="text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base font-semibold text-foreground">
                  Admin Profile
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Update your personal information
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-5">
            {/* Avatar Row — stacks on mobile */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-secondary transition-colors"
                  aria-label="Upload avatar"
                  data-ocid="settings.upload_button"
                >
                  <Camera size={14} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={() => toast.info("Avatar upload coming soon.")}
                  />
                </label>
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <p className="font-semibold text-foreground truncate">
                  {source.name}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {source.role.replace("-", " ")}
                </p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 border border-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </div>

            <Separator />

            {/* Form — single column always (stacks naturally) */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="settings.name_input">Full Name</Label>
                <Input
                  id="settings.name_input"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  className="rounded-xl"
                  placeholder="Enter full name"
                  data-ocid="settings.name_input"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="settings.email_input">
                  Email Address{" "}
                  <span className="text-muted-foreground font-normal text-xs">
                    (read-only)
                  </span>
                </Label>
                <Input
                  id="settings.email_input"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="rounded-xl"
                  placeholder="admin@hospital.com"
                  data-ocid="settings.email_input"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="settings.phone_input">Phone Number</Label>
                <Input
                  id="settings.phone_input"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  className="rounded-xl"
                  placeholder="+91 98765 43200"
                  data-ocid="settings.phone_input"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="settings.role_input">Role</Label>
                <Input
                  id="settings.role_input"
                  value="Super Administrator"
                  readOnly
                  className="rounded-xl bg-muted/50 cursor-not-allowed text-muted-foreground"
                  data-ocid="settings.role_input"
                />
              </div>

              <Button
                className="rounded-xl bg-primary hover:bg-secondary text-white gap-2 w-full sm:w-auto"
                onClick={handleSaveProfile}
                disabled={profileSaving}
                data-ocid="settings.save_profile_button"
              >
                {profileSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving…
                  </span>
                ) : (
                  <>
                    <Save size={14} /> Save Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2 & 3: Password + Danger Zone ── */}
        <div className="space-y-6">
          <Card
            className="border border-border rounded-2xl shadow-sm"
            data-ocid="settings.password_card"
          >
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Lock size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold text-foreground">
                    Change Password
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Keep your account secure with a strong password
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
              {/* All password fields are full-width, stacked */}
              <PasswordField
                label="Current Password"
                value={passwordForm.current}
                onChange={(v) =>
                  setPasswordForm({ ...passwordForm, current: v })
                }
                show={showPasswords.current}
                onToggle={() =>
                  setShowPasswords({
                    ...showPasswords,
                    current: !showPasswords.current,
                  })
                }
                ocid="settings.current_password_input"
              />

              <PasswordField
                label="New Password"
                value={passwordForm.newPass}
                onChange={(v) => {
                  setPasswordForm({ ...passwordForm, newPass: v });
                  if (passwordErrors.newPass)
                    setPasswordErrors({ ...passwordErrors, newPass: "" });
                }}
                show={showPasswords.newPass}
                onToggle={() =>
                  setShowPasswords({
                    ...showPasswords,
                    newPass: !showPasswords.newPass,
                  })
                }
                ocid="settings.new_password_input"
                error={passwordErrors.newPass}
              />

              {/* Password strength bar — full width, no overflow */}
              {passwordForm.newPass && (
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground shrink-0">
                      Password strength
                    </span>
                    <span
                      className={`text-xs font-medium shrink-0 ${
                        strength.level === "weak"
                          ? "text-red-500"
                          : strength.level === "medium"
                            ? "text-amber-500"
                            : "text-emerald-600"
                      }`}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                </div>
              )}

              <PasswordField
                label="Confirm New Password"
                value={passwordForm.confirm}
                onChange={(v) => {
                  setPasswordForm({ ...passwordForm, confirm: v });
                  if (passwordErrors.confirm)
                    setPasswordErrors({ ...passwordErrors, confirm: "" });
                }}
                show={showPasswords.confirm}
                onToggle={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
                ocid="settings.confirm_password_input"
                error={passwordErrors.confirm}
              />

              <Button
                className="rounded-xl bg-primary hover:bg-secondary text-white gap-2 w-full sm:w-auto"
                onClick={handleChangePassword}
                disabled={passwordSaving}
                data-ocid="settings.change_password_button"
              >
                {passwordSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Updating…
                  </span>
                ) : (
                  <>
                    <Shield size={14} /> Change Password
                  </>
                )}
              </Button>

              <Separator />

              {/* Requirements */}
              <div className="rounded-xl bg-muted/40 border border-border p-3 sm:p-4">
                <p className="text-xs font-semibold text-foreground mb-2">
                  Password Requirements
                </p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {[
                    "At least 8 characters long",
                    "Include uppercase and lowercase letters",
                    "Include at least one number",
                    "Include a special character (@, #, $, etc.)",
                  ].map((req) => (
                    <li key={req} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0 mt-1" />
                      <span className="leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* ── Section 3: Danger Zone ── */}
          <Card
            className="border border-red-200 rounded-2xl shadow-sm bg-red-50/30"
            data-ocid="settings.danger_zone_card"
          >
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-500 shrink-0" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-xs text-red-400">
                Actions here cannot be undone. Proceed with caution.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              {/* Stack on mobile: text above, button below */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Sign out of admin panel
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You will be redirected to the login page.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 gap-2 w-full sm:w-auto shrink-0"
                  onClick={handleLogout}
                  data-ocid="settings.logout_button"
                >
                  <LogOut size={14} /> Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
