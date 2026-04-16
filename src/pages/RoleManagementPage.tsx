import type { Column } from "@/components/admin/DataTable";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchManagedUsers, managedUsersStore } from "@/services/mockData";
import type { ManagedUser, UserRole } from "@/types";
import { ROLE_LABELS, formatDate } from "@/types";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ─── Role badge styling ────────────────────────────────────────────────────────

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  "super-admin":
    "bg-amber-50 text-amber-700 border border-amber-200 font-semibold",
  doctor: "bg-yellow-50 text-yellow-700 border border-yellow-200 font-semibold",
  receptionist:
    "bg-orange-50 text-orange-700 border border-orange-200 font-semibold",
  nurse: "bg-stone-100 text-stone-600 border border-stone-200 font-semibold",
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${ROLE_BADGE_STYLES[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

// ─── Edit Role Modal ───────────────────────────────────────────────────────────

interface EditRoleModalProps {
  user: ManagedUser | null;
  onClose: () => void;
  onSave: (userId: string, newRole: UserRole) => void;
}

function EditRoleModal({ user, onClose, onSave }: EditRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");

  useEffect(() => {
    if (user) setSelectedRole(user.role);
  }, [user]);

  function handleSave() {
    if (!user || !selectedRole) return;
    onSave(user.id, selectedRole as UserRole);
  }

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        data-ocid="edit-role.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#1E293B] font-display">
            Edit Role
          </DialogTitle>
        </DialogHeader>

        {user && (
          <div className="space-y-5 py-2">
            {/* User info summary */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1E293B] truncate">
                  {user.name}
                </p>
                <p className="text-xs text-[#64748B] truncate">{user.email}</p>
                <div className="mt-1.5">
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <Label
                htmlFor="role-select"
                className="text-sm font-medium text-[#1E293B]"
              >
                Assign New Role
              </Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as UserRole)}
              >
                <SelectTrigger
                  id="role-select"
                  className="w-full h-10 rounded-xl border-slate-200 text-sm"
                  data-ocid="edit-role.select"
                >
                  <SelectValue placeholder="Select a role…" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                    <SelectItem key={role} value={role} className="text-sm">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={role} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl text-sm border-slate-200"
            data-ocid="edit-role.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!selectedRole}
            className="w-full sm:w-auto rounded-xl text-sm bg-primary hover:bg-secondary text-primary-foreground"
            data-ocid="edit-role.confirm_button"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Role Management Page ─────────────────────────────────────────────────────

const SKELETON_CARD_IDS = ["rmsk1", "rmsk2", "rmsk3", "rmsk4"];

export default function RoleManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchManagedUsers().then((data) => {
      if (!cancelled) {
        setUsers(data);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSaveRole(userId: string, newRole: UserRole) {
    // Update in memory store (session-persistent)
    const storeIdx = managedUsersStore.findIndex((u) => u.id === userId);
    if (storeIdx !== -1) {
      managedUsersStore[storeIdx] = {
        ...managedUsersStore[storeIdx],
        role: newRole,
      };
    }
    // Update local state
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
    );
    setEditingUser(null);
    toast.success(`Role updated to "${ROLE_LABELS[newRole]}" successfully.`);
  }

  // ── Desktop table columns ────────────────────────────────────────────────
  const columns: Column<ManagedUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">
              {row.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-[#1E293B] truncate">
            {row.name}
          </span>
        </div>
      ),
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
      header: "Current Role",
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      key: "joinedDate",
      header: "Joined Date",
      render: (row) => (
        <span className="text-[#64748B]">{formatDate(row.joinedDate)}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setEditingUser(row)}
          className="rounded-lg text-xs border-[#D89F00] text-[#A67C00] hover:bg-amber-50 hover:text-[#A67C00]"
          data-ocid={`role-management.edit_button.${row.id}`}
        >
          Edit Role
        </Button>
      ),
    },
  ];

  // ── Mobile card renderer ─────────────────────────────────────────────────
  function mobileCardRender(item: ManagedUser, idx: number) {
    return (
      <Card
        className="shadow-card border border-slate-100 rounded-xl overflow-hidden"
        data-ocid={`role-management.item.${idx + 1}`}
      >
        <CardContent className="p-4">
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
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditingUser(item)}
              className="flex-shrink-0 rounded-lg text-xs border-[#D89F00] text-[#A67C00] hover:bg-amber-50"
              data-ocid={`role-management.edit_button.${item.id}`}
            >
              Edit
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <RoleBadge role={item.role} />
            <span className="text-xs text-[#94A3B8]">
              Joined {formatDate(item.joinedDate)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div data-ocid="role-management.page">
      <PageHeader
        title="Role Management"
        description="View and manage access roles for all system users. Super Admin only."
      />

      {/* Stats summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
          const count = users.filter((u) => u.role === role).length;
          return (
            <Card
              key={role}
              className="shadow-card border border-slate-100 rounded-xl"
            >
              <CardContent className="p-3 sm:p-4 flex flex-col gap-1">
                <p className="text-xs text-[#64748B] font-medium uppercase tracking-wide">
                  {ROLE_LABELS[role]}
                </p>
                {isLoading ? (
                  <Skeleton className="h-6 w-8 rounded-md" />
                ) : (
                  <p className="text-xl font-bold text-[#1E293B] font-display">
                    {count}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile loading skeletons */}
      {isLoading && (
        <div className="md:hidden space-y-2 mb-2">
          {SKELETON_CARD_IDS.map((sk) => (
            <Card
              key={sk}
              className="shadow-card border border-slate-100 rounded-xl"
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-2/3 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table */}
      <DataTable<ManagedUser>
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchable
        searchKeys={["name", "email"]}
        emptyText="No users found."
        rowKey={(row) => row.id}
        mobileCardRender={mobileCardRender}
        data-ocid="role-management.table"
      />

      {/* Edit Role Modal */}
      <EditRoleModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveRole}
      />
    </div>
  );
}
