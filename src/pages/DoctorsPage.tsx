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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { fetchDoctors } from "@/services/mockData";
import type { Doctor, DoctorAvailability } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  name: string;
  specialization: string;
  experience: number;
  phone: string;
  email: string;
  availability: DoctorAvailability;
  profileImage: string;
  qualification: string;
  department: string;
};

type FormErrors = {
  name?: string;
  specialization?: string;
  experience?: string;
  phone?: string;
  email?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyForm: FormData = {
  name: "",
  specialization: "",
  experience: 0,
  phone: "",
  email: "",
  availability: "available",
  profileImage: "",
  qualification: "",
  department: "",
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

function validateForm(form: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  if (!form.specialization)
    errors.specialization = "Specialization is required.";
  if (!form.phone.trim()) errors.phone = "Phone number is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address.";
  if (form.experience < 0) errors.experience = "Experience must be 0 or more.";
  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DoctorsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: fetchDoctors,
  });

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / dialog state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [imageFileName, setImageFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize doctors from query
  useEffect(() => {
    if (!isLoading && !initialized && data.length > 0) {
      setDoctors(data);
      setInitialized(true);
    }
  }, [isLoading, initialized, data]);

  // ─── Search filter ──────────────────────────────────────────────────────────

  const filtered = doctors.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.department.toLowerCase().includes(q)
    );
  });

  // ─── Add Doctor ─────────────────────────────────────────────────────────────

  function openAdd() {
    setFormData(emptyForm);
    setFormErrors({});
    setImageFileName("");
    setIsAddModalOpen(true);
  }

  function handleAdd() {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    const newDoc: Doctor = {
      ...formData,
      id: `d${Date.now()}`,
      profileImage: imageFileName || "/assets/images/doctor-placeholder.svg",
    };
    setDoctors((prev) => [newDoc, ...prev]);
    toast.success("Doctor added successfully");
    setIsAddModalOpen(false);
  }

  // ─── Edit Doctor ────────────────────────────────────────────────────────────

  function openEdit(doc: Doctor) {
    setSelectedDoctor(doc);
    setFormData({
      name: doc.name,
      specialization: doc.specialization,
      experience: doc.experience,
      phone: doc.phone,
      email: doc.email,
      availability: doc.availability,
      profileImage: doc.profileImage,
      qualification: doc.qualification,
      department: doc.department,
    });
    setFormErrors({});
    setImageFileName(doc.profileImage ?? "");
    setIsEditModalOpen(true);
  }

  function handleUpdate() {
    if (!selectedDoctor) return;
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === selectedDoctor.id
          ? {
              ...d,
              ...formData,
              profileImage: imageFileName || d.profileImage,
            }
          : d,
      ),
    );
    toast.success("Doctor updated successfully");
    setIsEditModalOpen(false);
  }

  // ─── Delete Doctor ──────────────────────────────────────────────────────────

  function openDelete(doc: Doctor) {
    setSelectedDoctor(doc);
    setIsDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (!selectedDoctor) return;
    setDoctors((prev) => prev.filter((d) => d.id !== selectedDoctor.id));
    toast.success("Doctor deleted");
    setIsDeleteDialogOpen(false);
    setSelectedDoctor(null);
  }

  // ─── File input ─────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setImageFileName(file.name);
  }

  // ─── Form field helper ──────────────────────────────────────────────────────

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  // ─── Mobile card render ─────────────────────────────────────────────────────

  function renderMobileCard(doc: Doctor, idx: number) {
    return (
      <div
        key={doc.id}
        className="p-4 border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors"
        data-ocid={`doctors.item.${idx + 1}`}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0 mt-0.5">
            <AvatarFallback className="bg-amber-100 text-[#A67C00] text-xs font-bold">
              {getInitials(doc.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-[#1E293B] text-sm truncate">
                  {doc.name}
                </p>
                <p className="text-xs text-[#64748B] truncate">
                  {doc.qualification}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="h-8 w-8 text-[#64748B] hover:text-[#D89F00] hover:bg-amber-50 rounded-lg"
                  onClick={() => openEdit(doc)}
                  aria-label={`Edit ${doc.name}`}
                  data-ocid={`doctors.edit_button.${idx + 1}`}
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  className="h-8 w-8 text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg"
                  onClick={() => openDelete(doc)}
                  aria-label={`Delete ${doc.name}`}
                  data-ocid={`doctors.delete_button.${idx + 1}`}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs bg-amber-50 text-[#A67C00] px-2 py-0.5 rounded-md font-medium">
                {doc.specialization}
              </span>
              <span className="text-xs text-[#64748B]">
                {doc.experience} yrs exp
              </span>
              <StatusBadge status={doc.availability} />
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">{doc.phone}</p>
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
          placeholder="Search by name, specialization…"
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
                    <p className="font-medium text-sm">No doctors found</p>
                    <p className="text-xs mt-1">
                      {searchQuery
                        ? "Try adjusting your search."
                        : 'Click "+ Add Doctor" to add the first doctor.'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((doc, idx) => (
                  <TableRow
                    key={doc.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                    data-ocid={`doctors.item.${idx + 1}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-amber-100 text-[#A67C00] text-xs font-bold">
                            {getInitials(doc.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1E293B] text-sm truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-[#64748B] truncate">
                            {doc.qualification}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#1E293B] text-sm">
                      {doc.specialization}
                    </TableCell>
                    <TableCell className="text-[#64748B] text-sm">
                      {doc.experience} yrs
                    </TableCell>
                    <TableCell className="text-[#64748B] text-sm">
                      {doc.phone}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={doc.availability} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          className="h-8 w-8 text-[#64748B] hover:text-[#D89F00] hover:bg-amber-50 rounded-lg"
                          onClick={() => openEdit(doc)}
                          aria-label={`Edit ${doc.name}`}
                          data-ocid={`doctors.edit_button.${idx + 1}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          className="h-8 w-8 text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded-lg"
                          onClick={() => openDelete(doc)}
                          aria-label={`Delete ${doc.name}`}
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
              <p className="font-medium text-sm">No doctors found</p>
              <p className="text-xs mt-1">
                {searchQuery
                  ? "Try adjusting your search."
                  : 'Click "+ Add Doctor" to add the first doctor.'}
              </p>
            </div>
          ) : (
            filtered.map((doc, idx) => renderMobileCard(doc, idx))
          )}
        </div>
      </div>

      {/* Add Doctor Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent
          className="rounded-2xl w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="doctors.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-[#1E293B] text-lg font-semibold">
              Add New Doctor
            </DialogTitle>
          </DialogHeader>
          <DoctorForm
            formData={formData}
            formErrors={formErrors}
            imageFileName={imageFileName}
            fileInputRef={fileInputRef}
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
              data-ocid="doctors.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto rounded-xl bg-[#D89F00] hover:bg-[#A67C00] text-white"
              onClick={handleAdd}
              data-ocid="doctors.submit_button"
            >
              Save Doctor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent
          className="rounded-2xl w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="doctors.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-[#1E293B] text-lg font-semibold">
              Edit Doctor
            </DialogTitle>
          </DialogHeader>
          <DoctorForm
            formData={formData}
            formErrors={formErrors}
            imageFileName={imageFileName}
            fileInputRef={fileInputRef}
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
              data-ocid="doctors.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto rounded-xl bg-[#D89F00] hover:bg-[#A67C00] text-white"
              onClick={handleUpdate}
              data-ocid="doctors.save_button"
            >
              Save Changes
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
              data-ocid="doctors.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto rounded-xl bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
              data-ocid="doctors.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Doctor Form Sub-component ────────────────────────────────────────────────

type DoctorFormProps = {
  formData: FormData;
  formErrors: FormErrors;
  imageFileName: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFieldChange: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileClick: () => void;
};

function DoctorForm({
  formData,
  formErrors,
  imageFileName,
  fileInputRef,
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
            {SPECIALIZATIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
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
          Experience (years)
        </Label>
        <Input
          type="number"
          min={0}
          value={formData.experience}
          onChange={(e) => onFieldChange("experience", Number(e.target.value))}
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

      {/* Phone */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Phone <span className="text-red-500">*</span>
        </Label>
        <Input
          value={formData.phone}
          onChange={(e) => onFieldChange("phone", e.target.value)}
          placeholder="+91 98765 43210"
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

      {/* Qualification */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Qualification
        </Label>
        <Input
          value={formData.qualification}
          onChange={(e) => onFieldChange("qualification", e.target.value)}
          placeholder="MD, DM Cardiology"
          className="rounded-xl border-[#E2E8F0]"
          data-ocid="doctors.qualification_input"
        />
      </div>

      {/* Department */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">Department</Label>
        <Input
          value={formData.department}
          onChange={(e) => onFieldChange("department", e.target.value)}
          placeholder="Cardiology"
          className="rounded-xl border-[#E2E8F0]"
          data-ocid="doctors.department_input"
        />
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

      {/* Profile Image Upload */}
      <div className="col-span-1 sm:col-span-2 space-y-1.5">
        <Label className="text-sm font-medium text-[#374151]">
          Profile Image
        </Label>
        <button
          type="button"
          onClick={onFileClick}
          className="w-full border-2 border-dashed border-[#CBD5E1] rounded-xl py-4 px-4 flex flex-col items-center gap-2 hover:border-[#D89F00] hover:bg-amber-50/30 transition-colors cursor-pointer text-center"
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
      </div>
    </div>
  );
}
