import {
  type CareerItem,
  type CareerPayload,
  type CareerStatus,
  addCareerApi,
  deleteCareerApi,
  getAllCareersApi,
  updateCareerApi,
} from "@/apiCalls/careers";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  mapApiErrorsToFields,
} from "@/lib/api-errors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import DataTable, { type TableColumn } from "react-data-table-component";
import { toast } from "sonner";

type CareerFormState = {
  title: string;
  slug: string;
  department: string;
  employmentType: string;
  experience: string;
  summary: string;
  description: string;
  requirementsText: string;
  responsibilitiesText: string;
  applyEmail: string;
  applyLink: string;
  status: CareerStatus;
  sortOrder: string;
};

type CareerFormErrors = Partial<
  Record<
    "title" | "slug" | "sortOrder" | "applyEmail" | "applyLink",
    string
  >
>;

const emptyCareerForm: CareerFormState = {
  title: "",
  slug: "",
  department: "",
  employmentType: "",
  experience: "",
  summary: "",
  description: "",
  requirementsText: "",
  responsibilitiesText: "",
  applyEmail: "",
  applyLink: "",
  status: "open",
  sortOrder: "0",
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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function validateCareerForm(
  form: CareerFormState,
  careers: CareerItem[],
  currentId?: string,
): CareerFormErrors {
  const errors: CareerFormErrors = {};
  const nextSlug = form.slug.trim() ? slugify(form.slug) : slugify(form.title);
  const duplicateSlug = careers.find(
    (career) => career.slug === nextSlug && career._id !== currentId,
  );

  if (!form.title.trim()) {
    errors.title = "Career title is required.";
  }

  if (!nextSlug) {
    errors.slug = "Career slug is required.";
  } else if (duplicateSlug) {
    errors.slug = "Another career already uses this slug.";
  }

  if (form.sortOrder.trim()) {
    const sortOrder = Number.parseInt(form.sortOrder, 10);
    if (Number.isNaN(sortOrder) || sortOrder < 0) {
      errors.sortOrder = "Sort order must be 0 or more.";
    }
  }

  if (
    form.applyEmail.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.applyEmail.trim())
  ) {
    errors.applyEmail = "Enter a valid email address.";
  }

  if (form.applyLink.trim() && !isValidUrl(form.applyLink.trim())) {
    errors.applyLink = "Enter a valid URL including http:// or https://.";
  }

  return errors;
}

function CareerStatusBadge({ status }: { status: CareerStatus }) {
  const className =
    status === "open"
      ? "bg-emerald-50 text-emerald-700"
      : status === "closed"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <Badge className={className}>
      {status === "open"
        ? "Open"
        : status === "closed"
          ? "Closed"
          : "Draft"}
    </Badge>
  );
}

export default function CareerManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CareerItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CareerItem | null>(null);
  const [formData, setFormData] = useState<CareerFormState>(emptyCareerForm);
  const [formErrors, setFormErrors] = useState<CareerFormErrors>({});

  const { data = [], isLoading } = useQuery({
    queryKey: ["careers"],
    queryFn: getAllCareersApi,
  });

  const addMutation = useMutation({
    mutationFn: addCareerApi,
    onSuccess: () => {
      toast.success("Career added successfully.");
      queryClient.invalidateQueries({ queryKey: ["careers"] });
      setModalOpen(false);
      setFormData(emptyCareerForm);
      setFormErrors({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CareerPayload }) =>
      updateCareerApi(id, payload),
    onSuccess: () => {
      toast.success("Career updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["careers"] });
      setModalOpen(false);
      setEditTarget(null);
      setFormData(emptyCareerForm);
      setFormErrors({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCareerApi,
    onSuccess: () => {
      toast.success("Career deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["careers"] });
      setDeleteTarget(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to delete career.")),
  });

  const filteredCareers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return data;
    }

    return data.filter((career) =>
      [
        career.title,
        career.slug,
        career.department,
        career.employmentType,
        career.experience,
        career.summary,
        career.description,
        career.applyEmail,
        career.applyLink,
        career.status,
        ...career.requirements,
        ...career.responsibilities,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [data, search]);

  function openAdd() {
    setEditTarget(null);
    setFormData(emptyCareerForm);
    setFormErrors({});
    setModalOpen(true);
  }

  function openEdit(career: CareerItem) {
    setEditTarget(career);
    setFormData({
      title: career.title,
      slug: career.slug,
      department: career.department,
      employmentType: career.employmentType,
      experience: career.experience,
      summary: career.summary,
      description: career.description,
      requirementsText: career.requirements.join("\n"),
      responsibilitiesText: career.responsibilities.join("\n"),
      applyEmail: career.applyEmail,
      applyLink: career.applyLink,
      status: career.status,
      sortOrder: String(career.sortOrder ?? 0),
    });
    setFormErrors({});
    setModalOpen(true);
  }

  function setField<K extends keyof CareerFormState>(
    key: K,
    value: CareerFormState[K],
  ) {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [key as keyof CareerFormErrors]: undefined,
    }));
  }

  async function handleSave() {
    const errors = validateCareerForm(formData, data, editTarget?._id);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(
        Object.values(errors)[0] ?? "Please correct the highlighted fields.",
      );
      return;
    }

    const sortOrder = Number.parseInt(formData.sortOrder, 10);

    const payload: CareerPayload = {
      title: formData.title.trim(),
      slug: formData.slug.trim()
        ? slugify(formData.slug)
        : slugify(formData.title),
      department: formData.department.trim(),
      employmentType: formData.employmentType.trim(),
      experience: formData.experience.trim(),
      summary: formData.summary.trim(),
      description: formData.description.trim(),
      requirements: splitLines(formData.requirementsText),
      responsibilities: splitLines(formData.responsibilitiesText),
      applyEmail: formData.applyEmail.trim(),
      applyLink: formData.applyLink.trim(),
      status: formData.status,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    try {
      if (editTarget?._id) {
        await updateMutation.mutateAsync({ id: editTarget._id, payload });
        return;
      }

      await addMutation.mutateAsync(payload);
    } catch (error) {
      const backendErrors = mapApiErrorsToFields<keyof CareerFormErrors>(
        error,
        {
          title: /title/i,
          slug: /slug/i,
          sortOrder: /sort order/i,
          applyEmail: /email/i,
          applyLink: /link|url/i,
        },
      );

      if (Object.keys(backendErrors).length > 0) {
        setFormErrors((prev) => ({ ...prev, ...backendErrors }));
      }

      toast.error(getApiErrorMessage(error, "Failed to save career."));
    }
  }

  function handleDelete() {
    if (!deleteTarget?._id) {
      return;
    }

    deleteMutation.mutate(deleteTarget._id);
  }

  const columns: TableColumn<CareerItem>[] = [
    {
      name: "Role",
      grow: 1.4,
      cell: (career) => (
        <div className="min-w-0 py-3">
          <p className="truncate text-sm font-semibold text-slate-900">
            {career.title}
          </p>
          <p className="truncate text-xs text-slate-500">/{career.slug}</p>
        </div>
      ),
    },
    {
      name: "Details",
      grow: 1.2,
      cell: (career) => (
        <div className="min-w-0 py-3">
          <p className="truncate text-xs text-slate-500">
            {[career.employmentType, career.experience]
              .filter(Boolean)
              .join(" • ") || "No employment details"}
          </p>
        </div>
      ),
    },
    {
      name: "Status",
      width: "120px",
      cell: (career) => <CareerStatusBadge status={career.status} />,
    },
    {
      name: "Applications",
      grow: 1.1,
      cell: (career) => (
        <div className="min-w-0 py-3">
          <p className="truncate text-sm text-slate-800">
            {career.applyEmail || "No email"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {career.applyLink || "No apply link"}
          </p>
        </div>
      ),
    },
    {
      name: "Updated",
      width: "140px",
      cell: (career) => (
        <span className="text-sm text-slate-600">
          {formatDate(career.updatedAt ?? career.createdAt)}
        </span>
      ),
    },
    {
      name: "Actions",
      right: true,
      width: "140px",
      cell: (career) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl text-slate-500 hover:bg-amber-50 hover:text-amber-700"
            onClick={() => openEdit(career)}
          >
            <Pencil size={15} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl text-slate-500"
            onClick={() => setDeleteTarget(career)}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-ocid="careers.page">
      <PageHeader
        title="Career Management"
        description="Manage hiring roles, job details, and application information for the website."
        action={
          <Button
            type="button"
            onClick={openAdd}
            className="w-full gap-2 rounded-xl shadow-sm sm:w-auto bg-[#D89F00]"
          >
            <Plus size={16} />
            Add career
          </Button>
        }
      />

      <Card className="rounded-3xl border-slate-100 shadow-sm">
        <CardHeader className="gap-4 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-lg text-slate-900">
                Career Openings
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Keep published, closed, and draft roles organized in one place.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative w-full lg:w-80">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search title, type..."
                  className="rounded-xl border-slate-200 !pl-9"
                />
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-600">
                {filteredCareers.length} role
                {filteredCareers.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <DataTable
              columns={columns}
              data={filteredCareers}
              customStyles={tableStyles}
              progressPending={isLoading}
              pagination
              responsive
              highlightOnHover
              persistTableHead
              noDataComponent={
                <div className="py-16 text-center">
                  <p className="text-base font-semibold text-slate-900">
                    No career roles found
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Add your first opening to start managing careers here.
                  </p>
                </div>
              }
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={modalOpen}
        onOpenChange={(nextOpen) => {
          setModalOpen(nextOpen);
          if (!nextOpen) {
            setFormErrors({});
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-slate-200 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">
              {editTarget ? "Edit Career" : "Add Career"}
            </DialogTitle>
            <DialogDescription>
              Manage the role title, hiring details, and application info shown
              on the careers section.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="career-title">
                  Role Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="career-title"
                  value={formData.title}
                  onChange={(event) => setField("title", event.target.value)}
                  placeholder="Senior Staff Nurse"
                  className={`rounded-xl ${formErrors.title ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {formErrors.title ? (
                  <p className="text-xs text-red-500">{formErrors.title}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="career-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setField("status", value as CareerStatus)
                  }
                >
                  <SelectTrigger id="career-status" className="rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="career-slug">Slug</Label>
                <Input
                  id="career-slug"
                  value={formData.slug}
                  onChange={(event) => setField("slug", event.target.value)}
                  placeholder="senior-staff-nurse"
                  className={`rounded-xl ${formErrors.slug ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {formErrors.slug ? (
                  <p className="text-xs text-red-500">{formErrors.slug}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    This will be saved as `/
                    {formData.slug.trim()
                      ? slugify(formData.slug)
                      : slugify(formData.title) || "career-role"}
                    `.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="career-sort-order">Sort Order</Label>
                <Input
                  id="career-sort-order"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(event) => setField("sortOrder", event.target.value)}
                  placeholder="0"
                  className={`rounded-xl ${formErrors.sortOrder ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {formErrors.sortOrder ? (
                  <p className="text-xs text-red-500">
                    {formErrors.sortOrder}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="career-department">Department</Label>
                <Input
                  id="career-department"
                  value={formData.department}
                  onChange={(event) => setField("department", event.target.value)}
                  placeholder="Nursing"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="career-type">Employment Type</Label>
                <Input
                  id="career-type"
                  value={formData.employmentType}
                  onChange={(event) =>
                    setField("employmentType", event.target.value)
                  }
                  placeholder="Full-time"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="career-experience">Experience</Label>
                <Input
                  id="career-experience"
                  value={formData.experience}
                  onChange={(event) =>
                    setField("experience", event.target.value)
                  }
                  placeholder="2-4 years"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="career-summary">Summary</Label>
                <Textarea
                  id="career-summary"
                  value={formData.summary}
                  onChange={(event) => setField("summary", event.target.value)}
                  placeholder="Short summary shown in the careers listing."
                  className="rounded-2xl min-h-[110px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="career-description">Description</Label>
                <Textarea
                  id="career-description"
                  value={formData.description}
                  onChange={(event) =>
                    setField("description", event.target.value)
                  }
                  placeholder="Describe the role, team, and what the candidate will work on."
                  className="rounded-2xl min-h-[140px]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="career-requirements">Requirements</Label>
                <Textarea
                  id="career-requirements"
                  value={formData.requirementsText}
                  onChange={(event) =>
                    setField("requirementsText", event.target.value)
                  }
                  placeholder={"Add one requirement per line"}
                  className="rounded-2xl min-h-[160px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="career-responsibilities">
                  Responsibilities
                </Label>
                <Textarea
                  id="career-responsibilities"
                  value={formData.responsibilitiesText}
                  onChange={(event) =>
                    setField("responsibilitiesText", event.target.value)
                  }
                  placeholder={"Add one responsibility per line"}
                  className="rounded-2xl min-h-[160px]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="career-apply-email">Apply Email</Label>
                <Input
                  id="career-apply-email"
                  value={formData.applyEmail}
                  onChange={(event) =>
                    setField("applyEmail", event.target.value)
                  }
                  placeholder="careers@samarpanhospital.com"
                  className={`rounded-xl ${formErrors.applyEmail ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {formErrors.applyEmail ? (
                  <p className="text-xs text-red-500">
                    {formErrors.applyEmail}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="career-apply-link">Apply Link</Label>
                <Input
                  id="career-apply-link"
                  value={formData.applyLink}
                  onChange={(event) =>
                    setField("applyLink", event.target.value)
                  }
                  placeholder="https://forms.gle/..."
                  className={`rounded-xl ${formErrors.applyLink ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                />
                {formErrors.applyLink ? (
                  <p className="text-xs text-red-500">
                    {formErrors.applyLink}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-[#D89F00]"
              onClick={handleSave}
              disabled={addMutation.isPending || updateMutation.isPending}
            >
              {editTarget ? "Update Career" : "Create Career"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-xl rounded-3xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Delete career</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTarget?.title}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
