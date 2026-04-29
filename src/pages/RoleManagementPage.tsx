import {
  addAdminStaffApi,
  deleteAdminStaffApi,
  getAdminStaffApi,
  updateAdminStaffApi,
  type AddAdminStaffPayload,
  type AdminStaffItem,
  type UpdateAdminStaffPayload,
} from "@/apiCalls/staff";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ALL_PERMISSION_KEYS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  USER_ROLE_TO_ROLE_ID,
  countEnabledPermissions,
  createPermissionTemplate,
  getRoleFromRoleId,
  normalizePermissions,
  setPermissionWithDependencies,
  type PermissionKey,
} from "@/lib/admin-access";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS, formatDate, type UserRole } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldPlus, Trash2, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const EDITABLE_ROLES: UserRole[] = [
  "super-admin",
  "doctor",
  "nurse",
  "receptionist",
];

const ADDABLE_ROLES: UserRole[] = ["nurse", "receptionist"];

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  "super-admin":
    "bg-amber-50 text-amber-700 border border-amber-200 font-semibold",
  doctor: "bg-yellow-50 text-yellow-700 border border-yellow-200 font-semibold",
  receptionist:
    "bg-orange-50 text-orange-700 border border-orange-200 font-semibold",
  nurse: "bg-stone-100 text-stone-600 border border-stone-200 font-semibold",
};

type AddStaffFormState = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  permissions: Record<string, boolean>;
};

type AddStaffFormErrors = Partial<
  Record<"name" | "email" | "password" | "phone" | "role", string>
>;

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${ROLE_BADGE_STYLES[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function createBlankPermissions() {
  return ALL_PERMISSION_KEYS.reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});
}

function buildPermissionsState(source?: Record<string, boolean> | null) {
  return {
    ...createBlankPermissions(),
    ...normalizePermissions(source),
  };
}

function buildPermissionsForRole(role: UserRole) {
  return {
    ...createBlankPermissions(),
    ...createPermissionTemplate(role),
  };
}

function getStaffRole(staff: AdminStaffItem): UserRole {
  return getRoleFromRoleId(staff.roleId);
}

function getStaffPhone(staff: AdminStaffItem) {
  return staff.phone ? String(staff.phone) : "Not set";
}

function validateAddStaffForm(
  form: AddStaffFormState,
): AddStaffFormErrors {
  const errors: AddStaffFormErrors = {};

  if (!form.name.trim()) {
    errors.name = "Full name is required.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.password.trim()) {
    errors.password = "Password is required.";
  } else if (form.password.trim().length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!ADDABLE_ROLES.includes(form.role)) {
    errors.role = "Choose a supported staff role.";
  }

  return errors;
}

function PermissionEditor({
  permissions,
  selectedRole,
  onRoleDefaults,
  onGrantAll,
  onClearAll,
  onToggle,
}: {
  permissions: Record<string, boolean>;
  selectedRole: UserRole;
  onRoleDefaults: () => void;
  onGrantAll: () => void;
  onClearAll: () => void;
  onToggle: (permission: PermissionKey, checked: boolean) => void;
}) {
  const enabledCount = countEnabledPermissions(permissions);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">
              Permission access
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              {enabledCount} enabled for {ROLE_LABELS[selectedRole]}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={onRoleDefaults}
            >
              <WandSparkles size={14} /> Role defaults
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={onGrantAll}
            >
              Grant all
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={onClearAll}
            >
              Clear all
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {PERMISSION_GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-slate-100 bg-white p-4"
          >
            <div className="mb-3">
              <p className="text-sm font-semibold text-[#1E293B]">
                {group.title}
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                {group.description}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {group.permissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-[#FCFDFE] px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1E293B]">
                      {PERMISSION_LABELS[permission]}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-1 break-all">
                      {permission}
                    </p>
                  </div>
                  <Switch
                    checked={permissions[permission] === true}
                    onCheckedChange={(checked) =>
                      onToggle(permission, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddStaffDialog({
  open,
  isSaving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: AddAdminStaffPayload) => void;
}) {
  const [form, setForm] = useState<AddStaffFormState>({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "nurse",
    permissions: buildPermissionsForRole("nurse"),
  });
  const [errors, setErrors] = useState<AddStaffFormErrors>({});

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "nurse",
      permissions: buildPermissionsForRole("nurse"),
    });
    setErrors({});
  }, [open]);

  function updateField<K extends keyof AddStaffFormState>(
    key: K,
    value: AddStaffFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof AddStaffFormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function updateRole(role: UserRole) {
    updateField("role", role);
    setForm((prev) => ({
      ...prev,
      role,
      permissions: buildPermissionsForRole(role),
    }));
  }

  function handleSubmit() {
    const nextErrors = validateAddStaffForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      phone: form.phone.trim(),
      roleId: USER_ROLE_TO_ROLE_ID[form.role],
      permissions: form.permissions,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[99vw] max-w-none max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#1E293B]">
            Add Staff Member
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4">
            <p className="text-sm font-semibold text-[#1E293B]">
              Quick staff onboarding
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Doctors are still created from the Doctors page. Use this flow for
              nurses and reception staff, then fine-tune page access before
              saving.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Full Name</Label>
              <Input
                id="staff-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="e.g. Riya Verma"
                className="rounded-xl"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-email">Email Address</Label>
              <Input
                id="staff-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="staff@samarpan.com"
                className="rounded-xl"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-password">Temporary Password</Label>
              <Input
                id="staff-password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                placeholder="At least 8 characters"
                className="rounded-xl"
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone Number</Label>
              <Input
                id="staff-phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+91 98765 43210"
                className="rounded-xl"
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-role">Staff Role</Label>
            <Select value={form.role} onValueChange={(value) => updateRole(value as UserRole)}>
              <SelectTrigger id="staff-role" className="rounded-xl">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ADDABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-xs text-red-500">{errors.role}</p>
            )}
          </div>

          <PermissionEditor
            permissions={form.permissions}
            selectedRole={form.role}
            onRoleDefaults={() =>
              setForm((prev) => ({
                ...prev,
                permissions: buildPermissionsForRole(prev.role),
              }))
            }
            onGrantAll={() => setForm((prev) => ({
              ...prev,
              permissions: ALL_PERMISSION_KEYS.reduce<Record<string, boolean>>(
                (acc, key) => {
                  acc[key] = true;
                  return acc;
                },
                {},
              ),
            }))}
            onClearAll={() => setForm((prev) => ({
              ...prev,
              permissions: createBlankPermissions(),
            }))}
            onToggle={(permission, checked) =>
              setForm((prev) => ({
                ...prev,
                permissions: setPermissionWithDependencies(
                  prev.permissions,
                  permission,
                  checked,
                ),
              }))
            }
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border-slate-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full sm:w-auto rounded-xl bg-primary hover:bg-secondary text-white"
          >
            {isSaving ? "Adding..." : "Add Staff Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditStaffDialog({
  staff,
  isSaving,
  onClose,
  onSubmit,
}: {
  staff: AdminStaffItem | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (id: string, payload: UpdateAdminStaffPayload) => void;
}) {
  const [role, setRole] = useState<UserRole>("receptionist");
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    createBlankPermissions(),
  );

  useEffect(() => {
    if (!staff) {
      return;
    }

    setRole(getStaffRole(staff));
    setPermissions(buildPermissionsState(staff.permissions));
  }, [staff]);

  function handleRoleChange(nextRole: UserRole) {
    setRole(nextRole);
    setPermissions(buildPermissionsForRole(nextRole));
  }

  function handleSave() {
    if (!staff) {
      return;
    }

    onSubmit(staff._id, {
      roleId: USER_ROLE_TO_ROLE_ID[role],
      permissions,
    });
  }

  return (
    <Dialog open={!!staff} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[99vw] max-w-none max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#1E293B]">
            Manage Staff Access
          </DialogTitle>
        </DialogHeader>

        {staff && (
          <div className="space-y-5 py-1">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1E293B] truncate">
                    {staff.name}
                  </p>
                  <p className="text-xs text-[#64748B] truncate mt-1">
                    {staff.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RoleBadge role={getStaffRole(staff)} />
                    <Badge
                      variant="outline"
                      className="rounded-lg border-slate-200 text-xs text-[#64748B]"
                    >
                      {countEnabledPermissions(permissions)} permissions
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#64748B] space-y-1">
                <p>Phone: {getStaffPhone(staff)}</p>
                <p>Joined: {formatDate(staff.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-staff-role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => handleRoleChange(value as UserRole)}
              >
                <SelectTrigger id="edit-staff-role" className="rounded-xl">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {EDITABLE_ROLES.map((itemRole) => (
                    <SelectItem key={itemRole} value={itemRole}>
                      {ROLE_LABELS[itemRole]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <PermissionEditor
              permissions={permissions}
              selectedRole={role}
              onRoleDefaults={() =>
                setPermissions(buildPermissionsForRole(role))
              }
              onGrantAll={() =>
                setPermissions(
                  ALL_PERMISSION_KEYS.reduce<Record<string, boolean>>(
                    (acc, key) => {
                      acc[key] = true;
                      return acc;
                    },
                    {},
                  ),
                )
              }
              onClearAll={() => setPermissions(createBlankPermissions())}
              onToggle={(permission, checked) =>
                setPermissions((prev) =>
                  setPermissionWithDependencies(prev, permission, checked),
                )
              }
            />
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border-slate-200"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !staff}
            className="w-full sm:w-auto rounded-xl bg-primary hover:bg-secondary text-white"
          >
            {isSaving ? "Saving..." : "Save Access Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RoleManagementPage() {
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  const [editingStaff, setEditingStaff] = useState<AdminStaffItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminStaffItem | null>(null);

  const {
    data: staff = [],
    isLoading,
    isError,
    error,
  } = useQuery<AdminStaffItem[], Error>({
    queryKey: ["admin-staff"],
    queryFn: getAdminStaffApi,
  });

  const addMutation = useMutation({
    mutationFn: addAdminStaffApi,
    onSuccess: () => {
      toast.success("Staff member added successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      setIsAddDialogOpen(false);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminStaffPayload;
    }) => updateAdminStaffApi(id, payload),
    onSuccess: () => {
      toast.success("Staff access updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      setEditingStaff(null);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminStaffApi,
    onSuccess: () => {
      toast.success("Staff member removed successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      setDeleteTarget(null);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const staffCounts = useMemo(
    () =>
      EDITABLE_ROLES.map((role) => ({
        role,
        count: staff.filter((item) => getStaffRole(item) === role).length,
      })),
    [staff],
  );

  const columns: Column<AdminStaffItem>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => {
        const isCurrentAccount = admin?.id === row._id;

        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-primary">
                {row.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[#1E293B] truncate">{row.name}</p>
              {isCurrentAccount && (
                <p className="text-xs text-[#A67C00] mt-0.5">Current account</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Email",
      render: (row) => (
        <span className="text-[#64748B] truncate">{row.email}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => <RoleBadge role={getStaffRole(row)} />,
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (row) => (
        <Badge
          variant="outline"
          className="rounded-lg border-slate-200 text-xs font-medium text-[#475569]"
        >
          {countEnabledPermissions(normalizePermissions(row.permissions))} enabled
        </Badge>
      ),
    },
    {
      key: "joinedDate",
      header: "Joined Date",
      render: (row) => (
        <span className="text-[#64748B]">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => {
        const isCurrentAccount = admin?.id === row._id;

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isCurrentAccount}
              onClick={() => setEditingStaff(row)}
              className="rounded-lg text-xs border-[#D89F00] text-[#A67C00] hover:bg-amber-50 hover:text-[#A67C00]"
            >
              Edit Access
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={isCurrentAccount}
              onClick={() => setDeleteTarget(row)}
              className="h-8 w-8 rounded-lg text-[#64748B] hover:bg-red-50 hover:text-red-500"
              aria-label="Delete staff member"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        );
      },
      className: "text-right",
    },
  ];

  function mobileCardRender(item: AdminStaffItem, index: number) {
    const isCurrentAccount = admin?.id === item._id;

    return (
      <Card
        className="shadow-card border border-slate-100 rounded-xl overflow-hidden"
        data-ocid={`role-management.item.${index + 1}`}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">
                  {item.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1E293B] truncate">
                  {item.name}
                </p>
                <p className="text-xs text-[#64748B] truncate">{item.email}</p>
              </div>
            </div>
            <RoleBadge role={getStaffRole(item)} />
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-[#64748B]">
            <span>
              {countEnabledPermissions(normalizePermissions(item.permissions))} permissions
            </span>
            <span>Joined {formatDate(item.createdAt)}</span>
          </div>

          {isCurrentAccount ? (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-[#A67C00]">
              Current account access is locked here for safety.
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditingStaff(item)}
                className="flex-1 rounded-lg text-xs border-[#D89F00] text-[#A67C00] hover:bg-amber-50"
              >
                Edit Access
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setDeleteTarget(item)}
                className="h-9 w-9 rounded-lg text-[#64748B] hover:bg-red-50 hover:text-red-500"
                aria-label="Delete staff member"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div data-ocid="role-management.page">
      <PageHeader
        title="Role Management"
        description="Manage staff roles, page access, and onboarding for nurses and reception staff."
        action={
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-primary hover:bg-secondary text-white rounded-xl gap-2 shadow-sm w-full sm:w-auto"
          >
            <ShieldPlus size={15} /> Add Staff
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {staffCounts.map(({ role, count }) => (
          <Card
            key={role}
            className="shadow-card border border-slate-100 rounded-xl"
          >
            <CardContent className="p-3 sm:p-4 flex flex-col gap-1">
              <p className="text-xs text-[#64748B] font-medium uppercase tracking-wide">
                {ROLE_LABELS[role]}
              </p>
              <p className="text-xl font-bold text-[#1E293B] font-display">
                {isLoading ? "..." : count}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isError && (
        <Card className="mb-4 border border-red-100 bg-red-50">
          <CardContent className="p-4 text-sm text-red-600">
            {error?.message ?? "Unable to load staff right now."}
          </CardContent>
        </Card>
      )}

      <DataTable<AdminStaffItem>
        columns={columns}
        data={staff}
        isLoading={isLoading}
        searchable
        searchKeys={["name", "email"]}
        emptyText="No staff members found."
        rowKey={(row) => row._id}
        mobileCardRender={mobileCardRender}
        data-ocid="role-management.table"
      />

      <AddStaffDialog
        open={isAddDialogOpen}
        isSaving={addMutation.isPending}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={(payload) => addMutation.mutate(payload)}
      />

      <EditStaffDialog
        staff={editingStaff}
        isSaving={updateMutation.isPending}
        onClose={() => setEditingStaff(null)}
        onSubmit={(id, payload) => updateMutation.mutate({ id, payload })}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Staff Member"
        message={`Delete "${deleteTarget?.name ?? "this staff member"}"? This action cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget._id)
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
