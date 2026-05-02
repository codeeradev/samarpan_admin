import {
  type DoctorItem,
  type DoctorPayload,
  addDoctorApi,
  deleteDoctorApi,
  getAllDoctorsApi,
  updateDoctorApi,
} from "@/apiCalls/doctors";
import { BASE_URL } from "@/apis/endpoint";
import { useSpecializations } from "@/hooks/useSpecializations";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { DoctorAvailability } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import {
  type ChangeEvent,
  type RefObject,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIALIZATIONS = [
  "Cardiology",
  "Orthopedics",
  "Neurology",
  "Pediatrics",
  "General Medicine",
  "Dermatology",
  "ENT",
  "Ophthalmology",
  "Gynecology",
  "Oncology",
  "Radiology",
  "Psychiatry",
];

const SKELETON_ROWS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"];
const API_ASSET_ORIGIN = BASE_URL.replace(/\/admin\/?$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

type DoctorFormMode = "add" | "edit";

type DoctorFormData = {
  name: string;
  specialization: string;
  experience: string;
  phone: string;
  email: string;
  password: string;
  availability: DoctorAvailability;
  image: File | string;
  qualification: string;
  description: string;
  expertise: string;
};

type FormErrors = Partial<Record<keyof DoctorFormData, string>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyForm: DoctorFormData = {
  name: "",
  specialization: "",
  experience: "",
  phone: "",
  email: "",
  password: "",
  availability: "available",
  image: "",
  qualification: "",
  description: "",
  expertise: "",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDoctorAvailability(doctor: DoctorItem): DoctorAvailability {
  if (doctor.isActive === false) return "on-leave";
  if (doctor.status === false) return "busy";
  return "available";
}

function availabilityToFlags(availability: DoctorAvailability) {
  if (availability === "on-leave") {
    return { status: false, isActive: false };
  }

  if (availability === "busy") {
    return { status: false, isActive: true };
  }

  return { status: true, isActive: true };
}

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveAssetUrl(path?: string) {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ASSET_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

function getImageLabel(value: File | string) {
  if (value instanceof File) return value.name;
  if (!value) return "";
  return value.split("/").filter(Boolean).pop() ?? value;
}

function getDoctorPhone(doctor: DoctorItem) {
  return doctor.phone ? String(doctor.phone) : "Not set";
}

function getDoctorExperience(doctor: DoctorItem) {
  const value = doctor.experience?.toString().trim();
  return value ? `${value} yrs` : "Not set";
}

function validateForm(form: DoctorFormData, mode: DoctorFormMode): FormErrors {
  const errors: FormErrors = {};
  const experienceValue = Number(form.experience);

  if (!form.name.trim()) errors.name = "Full name is required.";
  if (!form.specialization.trim())
    errors.specialization = "Specialization is required.";
  if (!form.phone.trim()) errors.phone = "Phone number is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address.";
  if (mode === "add" && !form.password.trim())
    errors.password = "Password is required for new doctors.";
  if (!form.experience.trim()) errors.experience = "Experience is required.";
  else if (Number.isNaN(experienceValue) || experienceValue < 0)
    errors.experience = "Experience must be 0 or more.";
  if (!form.qualification.trim())
    errors.qualification = "Qualification is required.";
  if (!form.description.trim()) errors.description = "Description is required.";
  if (mode === "add" && !(form.image instanceof File))
    errors.image = "Profile image is required.";

  return errors;
}

function buildPayload(
  form: DoctorFormData,
  mode: DoctorFormMode,
): DoctorPayload {
  const payload: DoctorPayload = {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    specialization: form.specialization.trim(),
    description: form.description.trim(),
    experience: form.experience.trim(),
    qualification: form.qualification.trim(),
    expertise: splitCommaList(form.expertise),
    image: form.image,
    ...availabilityToFlags(form.availability),
  };

  if (mode === "add" || form.password.trim()) {
    payload.password = form.password.trim();
  }

  return payload;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DoctorsPage() {
  const queryClient = useQueryClient();

  const { data: specializations = [] } = useSpecializations({ isActive: true });

  const {
    data: doctors = [],
    isLoading,
    isError,
    error,
  } = useQuery<DoctorItem[], Error>({
    queryKey: ["doctors"],
    queryFn: getAllDoctorsApi,
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Modal / dialog state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorItem | null>(null);

  // Form state
  const [formData, setFormData] = useState<DoctorFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [imageFileName, setImageFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addMutation = useMutation({
    mutationFn: addDoctorApi,
    onSuccess: () => {
      toast.success("Doctor added successfully.");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<DoctorPayload>;
    }) => updateDoctorApi(id, payload),
    onSuccess: () => {
      toast.success("Doctor updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setIsEditModalOpen(false);
      setSelectedDoctor(null);
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDoctorApi,
    onSuccess: () => {
      toast.success("Doctor deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setIsDeleteDialogOpen(false);
      setSelectedDoctor(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const isSaving = addMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  // ─── Search filter ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return doctors;

    const q = searchQuery.toLowerCase();
    return doctors.filter((doctor) =>
      [
        doctor.name,
        doctor.email,
        doctor.specialization,
        doctor.qualification,
        doctor.description,
        getDoctorPhone(doctor),
        ...(doctor.expertise ?? []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [doctors, searchQuery]);

  // ─── Modal helpers ──────────────────────────────────────────────────────────

  function resetForm() {
    setFormData(emptyForm);
    setFormErrors({});
    setImageFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function openAdd() {
    setSelectedDoctor(null);
    resetForm();
    setIsAddModalOpen(true);
  }

  function openEdit(doctor: DoctorItem) {
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor.name ?? "",
      specialization: doctor.specialization ?? "",
      experience: doctor.experience?.toString() ?? "",
      phone: doctor.phone ? String(doctor.phone) : "",
      email: doctor.email ?? "",
      password: "",
      availability: getDoctorAvailability(doctor),
      image: doctor.image ?? "",
      qualification: doctor.qualification ?? "",
      description: doctor.description ?? "",
      expertise: (doctor.expertise ?? []).join(", "),
    });
    setFormErrors({});
    setImageFileName(getImageLabel(doctor.image ?? ""));
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsEditModalOpen(true);
  }

  function openDelete(doctor: DoctorItem) {
    setSelectedDoctor(doctor);
    setIsDeleteDialogOpen(true);
  }

  // ─── Form actions ───────────────────────────────────────────────────────────

  function handleAdd() {
    const errors = validateForm(formData, "add");
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    addMutation.mutate(buildPayload(formData, "add"));
  }

  function handleUpdate() {
    if (!selectedDoctor) return;

    const errors = validateForm(formData, "edit");
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    updateMutation.mutate({
      id: selectedDoctor._id,
      payload: buildPayload(formData, "edit"),
    });
  }

  function handleDelete() {
    if (!selectedDoctor) return;
    deleteMutation.mutate(selectedDoctor._id);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setField("image", file);
    setImageFileName(file.name);
  }

  function setField<K extends keyof DoctorFormData>(
    key: K,
    value: DoctorFormData[K],
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  // ─── Mobile card render ─────────────────────────────────────────────────────

  function renderDoctorAvatar(doctor: DoctorItem, sizeClass = "h-9 w-9") {
    const imageSrc = resolveAssetUrl(doctor.image);

    return (
      <Avatar className={`${sizeClass} shrink-0`}>
        {imageSrc && <AvatarImage src={imageSrc} alt={doctor.name} />}
        <AvatarFallback className="bg-amber-100 text-[#A67C00] text-xs font-bold">
          {getInitials(doctor.name)}
        </AvatarFallback>
      </Avatar>
    );
  }

  function renderMobileCard(doctor: DoctorItem, idx: number) {
    return (
      <div
        key={doctor._id}
        className="p-4 border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors"
        data-ocid={`doctors.item.${idx + 1}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {renderDoctorAvatar(doctor, "h-10 w-10")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-[#1E293B] text-sm truncate">
                  {doctor.name}
                </p>
                <p className="text-xs text-[#64748B] truncate">
                  {doctor.qualification || "No qualification set"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="h-8 w-8 text-[#64748B] hover:text-[#D89F00] hover:bg-amber-50 rounded-lg"
                  onClick={() => openEdit(doctor)}
                  aria-label={`Edit ${doctor.name}`}
                  data-ocid={`doctors.edit_button.${idx + 1}`}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="h-8 w-8 text-[#64748B] rounded-lg"
                  onClick={() => openDelete(doctor)}
                  aria-label={`Delete ${doctor.name}`}
                  data-ocid={`doctors.delete_button.${idx + 1}`}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs bg-amber-50 text-[#A67C00] px-2 py-0.5 rounded-md font-medium">
                {doctor.specialization || "No specialization"}
              </span>
              <span className="text-xs text-[#64748B]">
                {getDoctorExperience(doctor)}
              </span>
              <StatusBadge status={getDoctorAvailability(doctor)} />
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              {getDoctorPhone(doctor)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div data-ocid="doctors.page" className="space-y-6">
      <PageHeader
        title="Doctors Management"
        description="View, add, and manage hospital medical staff and their availability."
        action={
          <Button
            onClick={openAdd}
            className="w-full sm:w-auto bg-[#D89F00] hover:bg-[#A67C00] text-white rounded-xl gap-2 shadow-sm"
            data-ocid="doctors.add_button"
          >
            <Plus size={15} /> Add Doctor
          </Button>
        }
      />

      {/* Search bar */}
      <div className="relative w-full sm:max-w-sm">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
        />
        <Input
          placeholder="Search by name, email, specialization…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 rounded-xl bg-white border-[#E2E8F0] text-sm"
          data-ocid="doctors.search_input"
        />
      </div>

      {/* Doctors table — desktop */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table data-ocid="doctors.table">
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                <TableHead className="text-[#64748B] font-semibold text-xs uppercase tracking-wide">
                  Doctor
                </TableHead>
                <TableHead className="text-[#64748B] font-semibold text-xs uppercase tracking-wide">
                  Specialization
                </TableHead>
                <TableHead className="text-[#64748B] font-semibold text-xs uppercase tracking-wide">
                  Experience
                </TableHead>
                <TableHead className="text-[#64748B] font-semibold text-xs uppercase tracking-wide">
                  Phone
                </TableHead>
                <TableHead className="text-[#64748B] font-semibold text-xs uppercase tracking-wide">
                  Availability
                </TableHead>
                <TableHead className="text-[#64748B] font-semibold text-xs uppercase tracking-wide text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                SKELETON_ROWS.map((key) => (
                  <TableRow key={key}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32 rounded" />
                          <Skeleton className="h-3 w-20 rounded" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3.5 w-24 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3.5 w-14 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3.5 w-28 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-7 w-7 rounded-lg" />
                        <Skeleton className="h-7 w-7 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-16 text-[#94A3B8]"
                    data-ocid="doctors.empty_state"
                  >
                    <p className="font-medium text-sm">
                      {isError ? "Unable to load doctors" : "No doctors found"}
                    </p>
                    <p className="text-xs mt-1">
                      {isError
                        ? error?.message
                        : searchQuery
                          ? "Try adjusting your search."
                          : 'Click "+ Add Doctor" to add the first doctor.'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((doctor, idx) => (
                  <TableRow
                    key={doctor._id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                    data-ocid={`doctors.item.${idx + 1}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {renderDoctorAvatar(doctor)}
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1E293B] text-sm truncate">
                            {doctor.name}
                          </p>
                          <p className="text-xs text-[#64748B] truncate">
                            {doctor.qualification || "No qualification set"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#1E293B] text-sm">
                      {doctor.specialization || "Not set"}
                    </TableCell>
                    <TableCell className="text-[#64748B] text-sm">
                      {getDoctorExperience(doctor)}
                    </TableCell>
                    <TableCell className="text-[#64748B] text-sm">
                      {getDoctorPhone(doctor)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={getDoctorAvailability(doctor)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          className="h-8 w-8 text-[#64748B] hover:text-[#D89F00] hover:bg-amber-50 rounded-lg"
                          onClick={() => openEdit(doctor)}
                          aria-label={`Edit ${doctor.name}`}
                          data-ocid={`doctors.edit_button.${idx + 1}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          className="h-8 w-8 text-[#64748B] rounded-lg"
                          onClick={() => openDelete(doctor)}
                          aria-label={`Delete ${doctor.name}`}
                          data-ocid={`doctors.delete_button.${idx + 1}`}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="block md:hidden" data-ocid="doctors.list">
          {isLoading ? (
            SKELETON_ROWS.map((key) => (
              <div
                key={key}
                className="p-4 border-b border-[#E2E8F0] last:border-0"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                    <div className="flex gap-2 mt-1">
                      <Skeleton className="h-5 w-20 rounded-md" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div
              className="text-center py-16 text-[#94A3B8]"
              data-ocid="doctors.empty_state"
            >
              <p className="font-medium text-sm">
                {isError ? "Unable to load doctors" : "No doctors found"}
              </p>
              <p className="text-xs mt-1">
                {isError
                  ? error?.message
                  : searchQuery
                    ? "Try adjusting your search."
                    : 'Click "+ Add Doctor" to add the first doctor.'}
              </p>
            </div>
          ) : (
            filtered.map((doctor, idx) => renderMobileCard(doctor, idx))
          )}
        </div>
      </div>

      {/* Add Doctor Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          className="rounded-2xl w-[95vw] max-w-2xl max-h-[90vh] !max-w-[40vw] overflow-y-auto"
          data-ocid="doctors.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-[#1E293B] text-lg font-semibold">
              Add New Doctor
            </DialogTitle>
          </DialogHeader>
          <DoctorForm
            mode="add"
            formData={formData}
            formErrors={formErrors}
            imageFileName={imageFileName}
            fileInputRef={fileInputRef}
            specializations={specializations}
            onFieldChange={setField}
            onFileChange={handleFileChange}
            onFileClick={() => fileInputRef.current?.click()}
          />
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto rounded-xl border-[#E2E8F0]"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSaving}
              data-ocid="doctors.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto rounded-xl bg-[#D89F00] hover:bg-[#A67C00] text-white"
              onClick={handleAdd}
              disabled={isSaving}
              data-ocid="doctors.submit_button"
            >
              {addMutation.isPending ? "Saving..." : "Save Doctor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="rounded-2xl w-[95vw] max-w-2xl !max-w-[40vw] max-h-[90vh] overflow-y-auto"
          data-ocid="doctors.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-[#1E293B] text-lg font-semibold">
              Edit Doctor
            </DialogTitle>
          </DialogHeader>
          <DoctorForm
            mode="edit"
            formData={formData}
            formErrors={formErrors}
            imageFileName={imageFileName}
            fileInputRef={fileInputRef}
            specializations={specializations}
            onFieldChange={setField}
            onFileChange={handleFileChange}
            onFileClick={() => fileInputRef.current?.click()}
          />
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto rounded-xl border-[#E2E8F0]"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
              data-ocid="doctors.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto rounded-xl bg-[#D89F00] hover:bg-[#A67C00] text-white"
              onClick={handleUpdate}
              disabled={isSaving}
              data-ocid="doctors.save_button"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent
          className="rounded-2xl w-[95vw] max-w-md"
          data-ocid="doctors.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1E293B]">
              Delete Doctor
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#64748B]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#1E293B]">
                {selectedDoctor?.name ?? "this doctor"}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel
              className="w-full sm:w-auto rounded-xl mt-0"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              data-ocid="doctors.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto rounded-xl bg-red-500 hover:bg-red-600 text-white"
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              data-ocid="doctors.confirm_button"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Doctor Form Sub-component ────────────────────────────────────────────────

type DoctorFormProps = {
  mode: DoctorFormMode;
  formData: DoctorFormData;
  formErrors: FormErrors;
  imageFileName: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  specializations: any[];
  onFieldChange: <K extends keyof DoctorFormData>(
    key: K,
    value: DoctorFormData[K],
  ) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFileClick: () => void;
};

function DoctorForm({
  mode,
  formData,
  formErrors,
  imageFileName,
  fileInputRef,
  specializations,
  onFieldChange,
  onFileChange,
  onFileClick,
}: DoctorFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
      {/* Full Name */}
      <div className="col-span-1 sm:col-span-2 space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Full Name <span className="text-red-500">*</span>
        </Label>
        <Input
          value={formData.name}
          onChange={(e) => onFieldChange("name", e.target.value)}
          placeholder="Dr. Full Name"
          className={`rounded-xl ${formErrors.name ? "border-red-400 focus-visible:ring-red-400" : "border-[#E2E8F0]"}`}
          data-ocid="doctors.name_input"
        />
        {formErrors.name && (
          <p
            className="text-xs text-red-500 mt-1"
            data-ocid="doctors.name_input.field_error"
          >
            {formErrors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Email <span className="text-red-500">*</span>
        </Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => onFieldChange("email", e.target.value)}
          placeholder="doctor@samarpan.com"
          className={`rounded-xl ${formErrors.email ? "border-red-400" : "border-[#E2E8F0]"}`}
          data-ocid="doctors.email_input"
        />
        {formErrors.email && (
          <p
            className="text-xs text-red-500 mt-1"
            data-ocid="doctors.email_input.field_error"
          >
            {formErrors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Password {mode === "add" && <span className="text-red-500">*</span>}
        </Label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => onFieldChange("password", e.target.value)}
          placeholder={
            mode === "add" ? "Set login password" : "Leave blank to keep"
          }
          className={`rounded-xl ${formErrors.password ? "border-red-400" : "border-[#E2E8F0]"}`}
          data-ocid="doctors.password_input"
        />
        {formErrors.password && (
          <p
            className="text-xs text-red-500 mt-1"
            data-ocid="doctors.password_input.field_error"
          >
            {formErrors.password}
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Phone <span className="text-red-500">*</span>
        </Label>
        <Input
          value={formData.phone}
          onChange={(e) => onFieldChange("phone", e.target.value)}
          placeholder="9876543210"
          className={`rounded-xl ${formErrors.phone ? "border-red-400" : "border-[#E2E8F0]"}`}
          data-ocid="doctors.phone_input"
        />
        {formErrors.phone && (
          <p
            className="text-xs text-red-500 mt-1"
            data-ocid="doctors.phone_input.field_error"
          >
            {formErrors.phone}
          </p>
        )}
      </div>

      {/* Specialization */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Specialization <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.specialization}
          onValueChange={(v) => onFieldChange("specialization", v)}
        >
          <SelectTrigger
            className={`rounded-xl ${formErrors.specialization ? "border-red-400" : "border-[#E2E8F0]"}`}
            data-ocid="doctors.specialization_select"
          >
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {specializations.map((spec) => (
              <SelectItem key={spec._id} value={spec.name}>
                {spec.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formErrors.specialization && (
          <p
            className="text-xs text-red-500 mt-1"
            data-ocid="doctors.specialization_select.field_error"
          >
            {formErrors.specialization}
          </p>
        )}
      </div>

      {/* Experience */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Experience (years) <span className="text-red-500">*</span>
        </Label>
        <Input
          type="number"
          min={0}
          value={formData.experience}
          onChange={(e) => onFieldChange("experience", e.target.value)}
          placeholder="8"
          className={`rounded-xl ${formErrors.experience ? "border-red-400" : "border-[#E2E8F0]"}`}
          data-ocid="doctors.experience_input"
        />
        {formErrors.experience && (
          <p
            className="text-xs text-red-500 mt-1"
            data-ocid="doctors.experience_input.field_error"
          >
            {formErrors.experience}
          </p>
        )}
      </div>

      {/* Qualification */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Qualification <span className="text-red-500">*</span>
        </Label>
        <Input
          value={formData.qualification}
          onChange={(e) => onFieldChange("qualification", e.target.value)}
          placeholder="MD, DM Cardiology"
          className={`rounded-xl ${formErrors.qualification ? "border-red-400" : "border-[#E2E8F0]"}`}
          data-ocid="doctors.qualification_input"
        />
        {formErrors.qualification && (
          <p
            className="text-xs text-red-500 mt-1"
            data-ocid="doctors.qualification_input.field_error"
          >
            {formErrors.qualification}
          </p>
        )}
      </div>

      {/* Availability */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Availability
        </Label>
        <Select
          value={formData.availability}
          onValueChange={(v) =>
            onFieldChange("availability", v as DoctorAvailability)
          }
        >
          <SelectTrigger
            className="rounded-xl border-[#E2E8F0]"
            data-ocid="doctors.availability_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="col-span-1 sm:col-span-2 space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          value={formData.description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          placeholder="Short professional bio shown on the website"
          className={`rounded-xl min-h-[90px] resize-none ${formErrors.description ? "border-red-400" : "border-[#E2E8F0]"}`}
          data-ocid="doctors.description_textarea"
        />
        {formErrors.description && (
          <p
            className="text-xs text-red-500 mt-1"
            data-ocid="doctors.description_textarea.field_error"
          >
            {formErrors.description}
          </p>
        )}
      </div>

      {/* Expertise */}
      <div className="col-span-1 sm:col-span-2 space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">Expertise</Label>
        <Textarea
          value={formData.expertise}
          onChange={(e) => onFieldChange("expertise", e.target.value)}
          placeholder="Cardiac surgery, Angioplasty, Preventive cardiology"
          className="rounded-xl min-h-[70px] resize-none border-[#E2E8F0]"
          data-ocid="doctors.expertise_textarea"
        />
      </div>

      {/* Profile Image Upload */}
      <div className="col-span-1 sm:col-span-2 space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Profile Image{" "}
          {mode === "add" && <span className="text-red-500">*</span>}
        </Label>
        <button
          type="button"
          onClick={onFileClick}
          className={`w-full border-2 border-dashed rounded-xl py-4 px-4 flex flex-col items-center gap-2 hover:border-[#D89F00] hover:bg-amber-50/30 transition-colors cursor-pointer text-center ${
            formErrors.image ? "border-red-300" : "border-[#CBD5E1]"
          }`}
          data-ocid="doctors.upload_button"
        >
          <Upload size={20} className="text-[#94A3B8]" />
          {imageFileName ? (
            <span className="text-sm text-[#D89F00] font-medium truncate max-w-full px-2">
              {imageFileName}
            </span>
          ) : (
            <>
              <span className="text-sm text-[#64748B] font-medium">
                Click to upload photo
              </span>
              <span className="text-xs text-[#94A3B8]">PNG, JPG up to 2MB</span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        {formErrors.image && (
          <p
            className="text-xs text-red-500 mt-1"
            data-ocid="doctors.upload_button.field_error"
          >
            {formErrors.image}
          </p>
        )}
      </div>
    </div>
  );
}
