import {
  type HonorItem,
  type HonorPayload,
  addHonorApi,
  deleteHonorApi,
  getAllHonorsApi,
  updateHonorApi,
} from "@/apiCalls/honors";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import DataTable, { type TableColumn } from "react-data-table-component";
import { toast } from "sonner";

type HonorFormState = {
  title: string;
  organization: string;
  year: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyHonorForm: HonorFormState = {
  title: "",
  organization: "",
  year: "",
  description: "",
  sortOrder: "0",
  isActive: true,
};

const tableStyles = {
  table: {
    style: {
      backgroundColor: "transparent",
    },
  },
  headRow: {
    style: {
      minHeight: "54px",
      backgroundColor: "#F8FAFC",
      borderBottomWidth: "1px",
      borderBottomColor: "#E2E8F0",
    },
  },
  headCells: {
    style: {
      color: "#64748B",
      fontSize: "12px",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      letterSpacing: "0.04em",
      paddingLeft: "16px",
      paddingRight: "16px",
    },
  },
  rows: {
    style: {
      minHeight: "72px",
      borderBottomWidth: "1px",
      borderBottomColor: "#F1F5F9",
      backgroundColor: "#FFFFFF",
    },
  },
  cells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
      color: "#1E293B",
      fontSize: "14px",
    },
  },
  pagination: {
    style: {
      borderTopWidth: "1px",
      borderTopColor: "#E2E8F0",
      minHeight: "60px",
      color: "#475569",
      backgroundColor: "#FFFFFF",
    },
  },
};

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function HonorStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      className={
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function HonorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HonorItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HonorItem | null>(null);
  const [formData, setFormData] = useState<HonorFormState>(emptyHonorForm);

  const { data = [], isLoading } = useQuery({
    queryKey: ["honors"],
    queryFn: getAllHonorsApi,
  });

  const addMutation = useMutation({
    mutationFn: addHonorApi,
    onSuccess: () => {
      toast.success("Honor added successfully.");
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      setModalOpen(false);
      setFormData(emptyHonorForm);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to add honor.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: HonorPayload }) =>
      updateHonorApi(id, payload),
    onSuccess: () => {
      toast.success("Honor updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      setModalOpen(false);
      setEditTarget(null);
      setFormData(emptyHonorForm);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to update honor.")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHonorApi,
    onSuccess: () => {
      toast.success("Honor deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["honors"] });
      setDeleteTarget(null);
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Failed to delete honor.")),
  });

  const filteredHonors = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return data;
    }

    return data.filter((honor) =>
      [
        honor.title,
        honor.organization,
        honor.year,
        honor.description,
        String(honor.sortOrder),
        honor.isActive ? "active" : "inactive",
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [data, search]);

  function resetForm() {
    setModalOpen(false);
    setEditTarget(null);
    setFormData(emptyHonorForm);
  }

  function openAdd() {
    setEditTarget(null);
    setFormData(emptyHonorForm);
    setModalOpen(true);
  }

  function openEdit(honor: HonorItem) {
    setEditTarget(honor);
    setFormData({
      title: honor.title,
      organization: honor.organization,
      year: honor.year,
      description: honor.description,
      sortOrder: String(honor.sortOrder ?? 0),
      isActive: honor.isActive,
    });
    setModalOpen(true);
  }

  function setField<K extends keyof HonorFormState>(
    key: K,
    value: HonorFormState[K],
  ) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    if (!formData.title.trim()) {
      toast.error("Honor title is required.");
      return;
    }

    const sortOrder = Number.parseInt(formData.sortOrder, 10);
    const payload: HonorPayload = {
      title: formData.title,
      organization: formData.organization,
      year: formData.year,
      description: formData.description,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      isActive: formData.isActive,
    };

    if (editTarget?._id) {
      await updateMutation.mutateAsync({ id: editTarget._id, payload });
      return;
    }

    await addMutation.mutateAsync(payload);
  }

  function handleDelete() {
    if (!deleteTarget?._id) {
      return;
    }

    deleteMutation.mutate(deleteTarget._id);
  }

  async function toggleStatus(honor: HonorItem) {
    try {
      await updateMutation.mutateAsync({
        id: honor._id,
        payload: {
          title: honor.title,
          organization: honor.organization,
          year: honor.year,
          description: honor.description,
          sortOrder: honor.sortOrder,
          isActive: !honor.isActive,
        },
      });
    } catch {
      // Error toast is handled in the shared mutation callback.
    }
  }

  const columns: TableColumn<HonorItem>[] = [
    {
      name: "Honor",
      grow: 1.3,
      cell: (honor) => (
        <div className="min-w-0 py-3">
          <p className="truncate text-sm font-semibold text-slate-900">
            {honor.title}
          </p>
          <p className="truncate text-xs text-slate-500">
            {honor.organization || "No organization"}
          </p>
        </div>
      ),
    },
    {
      name: "Year",
      width: "110px",
      cell: (honor) => (
        <span className="text-sm text-slate-700">{honor.year || "—"}</span>
      ),
    },
    {
      name: "Description",
      grow: 1.6,
      cell: (honor) => (
        <p className="line-clamp-2 py-3 text-sm text-slate-600">
          {honor.description || "No description added."}
        </p>
      ),
    },
    {
      name: "Status",
      width: "180px",
      cell: (honor) => (
        <div className="flex items-center gap-3">
          <HonorStatusBadge isActive={honor.isActive} />
          <Switch
            checked={honor.isActive}
            onCheckedChange={() => void toggleStatus(honor)}
            aria-label={`Toggle ${honor.title} status`}
          />
        </div>
      ),
    },
    {
      name: "Updated",
      width: "140px",
      cell: (honor) => (
        <span className="text-sm text-slate-600">
          {formatDate(honor.updatedAt ?? honor.createdAt)}
        </span>
      ),
    },
    {
      name: "Actions",
      right: true,
      width: "140px",
      cell: (honor) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl text-slate-500 hover:bg-amber-50 hover:text-amber-700"
            onClick={() => openEdit(honor)}
          >
            <Pencil size={15} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl text-slate-500"
            onClick={() => setDeleteTarget(honor)}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-ocid="honors.page">
      <PageHeader
        title="Honors"
        description="Manage honors shown on the website. Only super admins can access this section."
        action={
          <Button
            type="button"
            onClick={openAdd}
            className="w-full gap-2 rounded-xl bg-[#D89F00] shadow-sm sm:w-auto"
          >
            <Plus size={16} />
            Add honor
          </Button>
        }
      />

      <Card className="rounded-3xl border-slate-100 shadow-sm">
        <CardHeader className="gap-4 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-xl text-slate-900">
                Honors list
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Active honors appear on the website API, while this admin list
                includes inactive records too.
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search honors..."
                className="h-11 rounded-xl border-slate-200 pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredHonors}
            progressPending={isLoading}
            pagination
            highlightOnHover
            responsive
            customStyles={tableStyles}
            noDataComponent={
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <div className="rounded-full bg-amber-50 p-4 text-amber-600">
                  <Award size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    No honors found
                  </p>
                  <p className="text-sm text-slate-500">
                    Add the first honor to populate this section.
                  </p>
                </div>
              </div>
            }
          />
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={(nextOpen) => !nextOpen && resetForm()}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-slate-200 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit honor" : "Add honor"}</DialogTitle>
            <DialogDescription>
              Enter the details that should be available for both the website and
              the admin listing.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <Label htmlFor="honor-title">Title</Label>
              <Input
                id="honor-title"
                value={formData.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="Enter honor title"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="honor-organization">Organization</Label>
                <Input
                  id="honor-organization"
                  value={formData.organization}
                  onChange={(event) =>
                    setField("organization", event.target.value)
                  }
                  placeholder="Issuing organization"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="honor-year">Year</Label>
                <Input
                  id="honor-year"
                  value={formData.year}
                  onChange={(event) => setField("year", event.target.value)}
                  placeholder="2026"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="honor-description">Description</Label>
              <Textarea
                id="honor-description"
                value={formData.description}
                onChange={(event) => setField("description", event.target.value)}
                placeholder="Short description for this honor"
                className="min-h-28"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <div className="grid gap-2">
                <Label htmlFor="honor-sort-order">Sort order</Label>
                <Input
                  id="honor-sort-order"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(event) => setField("sortOrder", event.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Active on website
                  </p>
                  <p className="text-xs text-slate-500">
                    Turn this off to hide the honor from the public API.
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setField("isActive", checked)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-[#D89F00]"
              onClick={() => void handleSave()}
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {editTarget ? "Save changes" : "Add honor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete honor"
        message={`Delete "${deleteTarget?.title ?? "this honor"}"? This action cannot be undone.`}
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
