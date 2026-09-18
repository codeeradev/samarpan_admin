import {
  type AppointmentLink,
  type AppointmentLinkPayload,
  addAppointmentLinkApi,
  deleteAppointmentLinkApi,
  getAppointmentLinksApi,
  updateAppointmentLinkApi,
} from "@/apiCalls/appointmentLinks";
import { type DoctorItem, getAllDoctorsApi } from "@/apiCalls/doctors";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppointmentLinkForm {
  title: string;
  subtitle: string;
  link: string;
  doctorId: string;
  isActive: boolean;
}

interface FormErrors {
  title?: string;
  link?: string;
  doctorId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SKELETON_ROWS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"];

const emptyForm: AppointmentLinkForm = {
  title: "",
  subtitle: "",
  link: "",
  doctorId: "",
  isActive: true,
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function validateForm(form: AppointmentLinkForm): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!form.link.trim()) {
    errors.link = "Link URL is required.";
  } else if (!/^https?:\/\/.+/.test(form.link.trim())) {
    errors.link = "Please enter a valid URL starting with http:// or https://";
  }

  if (!form.doctorId) {
    errors.doctorId = "Please select a doctor.";
  }

  return errors;
}

function buildPayload(form: AppointmentLinkForm): AppointmentLinkPayload {
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || undefined,
    link: form.link.trim(),
    doctorId: form.doctorId,
    isActive: form.isActive,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppointmentLinksPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<AppointmentLink | null>(null);
  const [viewingLink, setViewingLink] = useState<AppointmentLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<AppointmentLink | null>(
    null,
  );
  const [form, setForm] = useState<AppointmentLinkForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // ─── Queries ─────────────────────────────────────────────────────────────────

  const { data: doctors = [] } = useQuery<DoctorItem[]>({
    queryKey: ["doctors"],
    queryFn: getAllDoctorsApi,
  });

  const activeDoctors = useMemo(
    () => doctors.filter((doc) => doc.isActive !== false),
    [doctors],
  );

  const {
    data: appointmentLinks = [],
    isLoading,
    isError,
    error,
  } = useQuery<AppointmentLink[], Error>({
    queryKey: ["appointment-links"],
    queryFn: () => getAppointmentLinksApi(),
  });

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: addAppointmentLinkApi,
    onSuccess: () => {
      toast.success("Appointment link created successfully.");
      queryClient.invalidateQueries({ queryKey: ["appointment-links"] });
      closeDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AppointmentLinkPayload }) =>
      updateAppointmentLinkApi(id, payload),
    onSuccess: () => {
      toast.success("Appointment link updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["appointment-links"] });
      closeDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAppointmentLinkApi,
    onSuccess: () => {
      toast.success("Appointment link deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["appointment-links"] });
      setDeleteOpen(false);
      setDeletingLink(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // ─── Filtered Data ───────────────────────────────────────────────────────────

  const filteredLinks = useMemo(() => {
    let filtered = appointmentLinks;

    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (link) =>
          link.title.toLowerCase().includes(query) ||
          link.subtitle?.toLowerCase().includes(query) ||
          link.doctorName?.toLowerCase().includes(query) ||
          link.link.toLowerCase().includes(query),
      );
    }

    if (selectedDoctorFilter && selectedDoctorFilter !== "all") {
      filtered = filtered.filter(
        (link) => link.doctorId === selectedDoctorFilter,
      );
    }

    return filtered;
  }, [appointmentLinks, search, selectedDoctorFilter]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function closeDialog() {
    setDialogOpen(false);
    setEditingLink(null);
    setForm(emptyForm);
    setFormErrors({});
  }

  function closeViewDialog() {
    setViewOpen(false);
    setViewingLink(null);
  }

  function handleAdd() {
    setEditingLink(null);
    setForm(emptyForm);
    setFormErrors({});
    setDialogOpen(true);
  }

  function handleEdit(link: AppointmentLink) {
    setEditingLink(link);
    setForm({
      title: link.title,
      subtitle: link.subtitle || "",
      link: link.link,
      doctorId: link.doctorId,
      isActive: link.isActive,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  function handleView(link: AppointmentLink) {
    setViewingLink(link);
    setViewOpen(true);
  }

  function handleDeleteClick(link: AppointmentLink) {
    setDeletingLink(link);
    setDeleteOpen(true);
  }

  function handleDeleteConfirm() {
    if (deletingLink) {
      deleteMutation.mutate(deletingLink._id);
    }
  }

  function handleSubmit() {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = buildPayload(form);

    if (editingLink) {
      updateMutation.mutate({ id: editingLink._id, payload });
    } else {
      addMutation.mutate(payload);
    }
  }

  function getDoctorName(doctorId: string): string {
    const doctor = doctors.find((d) => d._id === doctorId);
    return doctor?.name || "Unknown Doctor";
  }

  // ─── Loading & Error States ──────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Appointment Links"
          description="Manage external appointment booking links for doctors"
        />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-800">
            Error loading appointment links: {error?.message}
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointment Links"
        description="Manage external appointment booking links for doctors"
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title, doctor, or link..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={selectedDoctorFilter || "all"}
            onValueChange={(value) => setSelectedDoctorFilter(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Doctors</SelectItem>
              {activeDoctors.map((doctor) => (
                <SelectItem key={doctor._id} value={doctor._id}>
                  {doctor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Subtitle</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              SKELETON_ROWS.map((key) => (
                <TableRow key={key}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16" />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredLinks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {search.trim() || selectedDoctorFilter
                    ? "No appointment links match your filters."
                    : "No appointment links yet. Click 'Add Link' to create one."}
                </TableCell>
              </TableRow>
            ) : (
              filteredLinks.map((link) => (
                <TableRow key={link._id}>
                  <TableCell className="font-medium">{link.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {link.subtitle || "—"}
                  </TableCell>
                  <TableCell>{link.doctorName || getDoctorName(link.doctorId)}</TableCell>
                  <TableCell>
                    <a
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="max-w-[200px] truncate">{link.link}</span>
                    </a>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={link.isActive ? "active" : "inactive"} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(link)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(link)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(link)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingLink ? "Edit Appointment Link" : "Add Appointment Link"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Patient Consultation"
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value });
                  if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                }}
              />
              {formErrors.title && (
                <p className="text-sm text-destructive">{formErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle (Optional)</Label>
              <Input
                id="subtitle"
                placeholder="e.g., In-Clinic Visit"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">
                Link URL <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="link"
                placeholder="https://example.com/booking/..."
                value={form.link}
                onChange={(e) => {
                  setForm({ ...form, link: e.target.value });
                  if (formErrors.link) setFormErrors({ ...formErrors, link: undefined });
                }}
                rows={3}
              />
              {formErrors.link && (
                <p className="text-sm text-destructive">{formErrors.link}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorId">
                Doctor <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.doctorId}
                onValueChange={(value) => {
                  setForm({ ...form, doctorId: value });
                  if (formErrors.doctorId) setFormErrors({ ...formErrors, doctorId: undefined });
                }}
              >
                <SelectTrigger id="doctorId">
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {activeDoctors.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No active doctors available
                    </div>
                  ) : (
                    activeDoctors.map((doctor) => (
                      <SelectItem key={doctor._id} value={doctor._id}>
                        {doctor.name}
                        {doctor.specialization && (
                          <span className="text-muted-foreground">
                            {" "}
                            - {doctor.specialization}
                          </span>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {formErrors.doctorId && (
                <p className="text-sm text-destructive">{formErrors.doctorId}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {editingLink ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>View Appointment Link</DialogTitle>
          </DialogHeader>

          {viewingLink && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="mt-1 font-medium">{viewingLink.title}</p>
              </div>

              {viewingLink.subtitle && (
                <div>
                  <Label className="text-muted-foreground">Subtitle</Label>
                  <p className="mt-1">{viewingLink.subtitle}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Doctor</Label>
                <p className="mt-1">
                  {viewingLink.doctorName || getDoctorName(viewingLink.doctorId)}
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground">Link URL</Label>
                <a
                  href={viewingLink.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="break-all">{viewingLink.link}</span>
                </a>
              </div>

              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <StatusBadge status={viewingLink.isActive ? "active" : "inactive"} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={closeViewDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Appointment Link"
        description={
          deletingLink
            ? `Are you sure you want to delete "${deletingLink.title}"? This action cannot be undone.`
            : ""
        }
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        isDestructive
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
