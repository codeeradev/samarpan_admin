import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { Badge } from "@/components/ui/badge";
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
import { mockPatients } from "@/services/mockData";
import type { Patient, PatientGender } from "@/types";
import { formatDate } from "@/types";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatientFormState {
  name: string;
  phone: string;
  age: string;
  gender: PatientGender | "";
  address: string;
  bloodGroup: string;
  medicalHistory: string;
}

const EMPTY_FORM: PatientFormState = {
  name: "",
  phone: "",
  age: "",
  gender: "",
  address: "",
  bloodGroup: "",
  medicalHistory: "",
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SKELETON_ROWS = ["sk1", "sk2", "sk3", "sk4", "sk5"];

// ─── Gender Badge ─────────────────────────────────────────────────────────────

function GenderBadge({ gender }: { gender: PatientGender }) {
  const styles: Record<PatientGender, string> = {
    male: "bg-primary/10 text-primary border-primary/20",
    female: "bg-pink-50 text-pink-700 border-pink-200",
    other: "bg-amber-50 text-[#A67C00] border-amber-200",
  };
  return (
    <Badge
      variant="outline"
      className={`text-xs capitalize rounded-lg ${styles[gender]}`}
    >
      {gender}
    </Badge>
  );
}

// ─── Patient Form Modal ───────────────────────────────────────────────────────

interface PatientFormModalProps {
  open: boolean;
  mode: "add" | "edit";
  form: PatientFormState;
  onFormChange: (updates: Partial<PatientFormState>) => void;
  onSave: () => void;
  onClose: () => void;
}

function PatientFormModal({
  open,
  mode,
  form,
  onFormChange,
  onSave,
  onClose,
}: PatientFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="rounded-2xl w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid={
          mode === "add" ? "patients.add_dialog" : "patients.edit_dialog"
        }
      >
        <DialogHeader>
          <DialogTitle className="text-[#1E293B] text-lg font-semibold">
            {mode === "add" ? "Add New Patient" : "Edit Patient"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {/* Full Name */}
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label
              htmlFor="pt-name"
              className="text-sm font-medium text-[#374151]"
            >
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pt-name"
              placeholder="e.g. Arjun Verma"
              value={form.name}
              onChange={(e) => onFormChange({ name: e.target.value })}
              className="rounded-xl border-[#E2E8F0] focus-visible:ring-primary/30"
              data-ocid="patients.form.name_input"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label
              htmlFor="pt-phone"
              className="text-sm font-medium text-[#374151]"
            >
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pt-phone"
              placeholder="+91 9XXXXXXXXX"
              value={form.phone}
              onChange={(e) => onFormChange({ phone: e.target.value })}
              className="rounded-xl border-[#E2E8F0] focus-visible:ring-primary/30"
              data-ocid="patients.form.phone_input"
            />
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <Label
              htmlFor="pt-age"
              className="text-sm font-medium text-[#374151]"
            >
              Age <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pt-age"
              type="number"
              placeholder="e.g. 35"
              min={1}
              max={150}
              value={form.age}
              onChange={(e) => onFormChange({ age: e.target.value })}
              className="rounded-xl border-[#E2E8F0] focus-visible:ring-primary/30"
              data-ocid="patients.form.age_input"
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#374151]">
              Gender <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.gender}
              onValueChange={(v) =>
                onFormChange({ gender: v as PatientGender })
              }
            >
              <SelectTrigger
                className="rounded-xl border-[#E2E8F0] focus:ring-primary/30"
                data-ocid="patients.form.gender_select"
              >
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Blood Group */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#374151]">
              Blood Group <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.bloodGroup}
              onValueChange={(v) => onFormChange({ bloodGroup: v })}
            >
              <SelectTrigger
                className="rounded-xl border-[#E2E8F0] focus:ring-primary/30"
                data-ocid="patients.form.blood_group_select"
              >
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label
              htmlFor="pt-address"
              className="text-sm font-medium text-[#374151]"
            >
              Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="pt-address"
              placeholder="Full address"
              rows={2}
              value={form.address}
              onChange={(e) => onFormChange({ address: e.target.value })}
              className="rounded-xl border-[#E2E8F0] focus-visible:ring-primary/30 resize-none"
              data-ocid="patients.form.address_textarea"
            />
          </div>

          {/* Medical History */}
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label
              htmlFor="pt-history"
              className="text-sm font-medium text-[#374151]"
            >
              Medical History{" "}
              <span className="text-[#94A3B8] font-normal">(optional)</span>
            </Label>
            <Textarea
              id="pt-history"
              placeholder="e.g. Hypertension, Type 2 Diabetes..."
              rows={2}
              value={form.medicalHistory}
              onChange={(e) => onFormChange({ medicalHistory: e.target.value })}
              className="rounded-xl border-[#E2E8F0] focus-visible:ring-primary/30 resize-none"
              data-ocid="patients.form.medical_history_textarea"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border-[#E2E8F0] text-[#64748B] hover:bg-amber-50"
            data-ocid="patients.form.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            className="w-full sm:w-auto rounded-xl bg-primary hover:bg-secondary text-white"
            data-ocid="patients.form.submit_button"
          >
            {mode === "add" ? "Save Patient" : "Update Patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<PatientGender | "all">(
    "all",
  );

  // Modal / dialog state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [deletePatient, setDeletePatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<PatientFormState>(EMPTY_FORM);

  // Initial load with 500ms simulated delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setPatients([...mockPatients]);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return patients.filter((p) => {
      const matchesSearch =
        !q || p.name.toLowerCase().includes(q) || p.phone.includes(q);
      const matchesGender = genderFilter === "all" || p.gender === genderFilter;
      return matchesSearch && matchesGender;
    });
  }, [patients, searchTerm, genderFilter]);

  // Form helpers
  const updateForm = (updates: Partial<PatientFormState>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setShowAddModal(true);
  };

  const openEdit = (p: Patient) => {
    setForm({
      name: p.name,
      phone: p.phone,
      age: String(p.age),
      gender: p.gender,
      address: p.address,
      bloodGroup: p.bloodGroup,
      medicalHistory: p.medicalHistory ?? "",
    });
    setEditPatient(p);
  };

  const handleSaveAdd = () => {
    if (
      !form.name ||
      !form.phone ||
      !form.age ||
      !form.gender ||
      !form.address ||
      !form.bloodGroup
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const newPatient: Patient = {
      id: `p${Date.now()}`,
      name: form.name,
      phone: form.phone,
      age: Number(form.age),
      gender: form.gender as PatientGender,
      address: form.address,
      email: "",
      bloodGroup: form.bloodGroup,
      medicalHistory: form.medicalHistory || undefined,
      registeredAt: new Date().toISOString().split("T")[0],
    };
    setPatients((prev) => [newPatient, ...prev]);
    setShowAddModal(false);
    setForm(EMPTY_FORM);
    toast.success("Patient added successfully.");
  };

  const handleSaveEdit = () => {
    if (!editPatient) return;
    if (
      !form.name ||
      !form.phone ||
      !form.age ||
      !form.gender ||
      !form.address ||
      !form.bloodGroup
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setPatients((prev) =>
      prev.map((p) =>
        p.id === editPatient.id
          ? {
              ...p,
              name: form.name,
              phone: form.phone,
              age: Number(form.age),
              gender: form.gender as PatientGender,
              address: form.address,
              bloodGroup: form.bloodGroup,
              medicalHistory: form.medicalHistory || undefined,
            }
          : p,
      ),
    );
    setEditPatient(null);
    setForm(EMPTY_FORM);
    toast.success("Patient updated successfully.");
  };

  const handleConfirmDelete = () => {
    if (!deletePatient) return;
    setPatients((prev) => prev.filter((p) => p.id !== deletePatient.id));
    setDeletePatient(null);
    toast.success("Patient deleted successfully.");
  };

  return (
    <div data-ocid="patients.page">
      {/* Page Header */}
      <PageHeader
        title="Patient Management"
        description="View, add, and manage all registered patients."
        action={
          <Button
            type="button"
            onClick={openAdd}
            className="w-full sm:w-auto rounded-xl bg-primary hover:bg-secondary text-white gap-2"
            data-ocid="patients.add_button"
          >
            <Plus size={16} />
            Add Patient
          </Button>
        }
      />

      {/* Filter Bar */}
      <div
        className="flex flex-wrap sm:flex-nowrap gap-3 mb-5"
        data-ocid="patients.filter_bar"
      >
        <div className="relative w-full sm:flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <Input
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl border-[#E2E8F0] bg-white focus-visible:ring-primary/30 text-sm"
            data-ocid="patients.search_input"
          />
        </div>
        <Select
          value={genderFilter}
          onValueChange={(v) => setGenderFilter(v as PatientGender | "all")}
        >
          <SelectTrigger
            className="w-full sm:w-44 rounded-xl border-[#E2E8F0] bg-white focus:ring-primary/30 text-sm"
            data-ocid="patients.gender_filter_select"
          >
            <SelectValue placeholder="All Genders" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table — desktop */}
      <div
        className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden"
        data-ocid="patients.table"
      >
        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC] hover:bg-[#F8FAFC]">
                <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide pl-5">
                  Name
                </TableHead>
                <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                  Phone
                </TableHead>
                <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                  Age
                </TableHead>
                <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                  Gender
                </TableHead>
                <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide max-w-[160px]">
                  Address
                </TableHead>
                <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
                  Registered
                </TableHead>
                <TableHead className="text-xs font-semibold text-[#64748B] uppercase tracking-wide text-right pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                SKELETON_ROWS.map((key) => (
                  <TableRow key={key}>
                    <TableCell className="pl-5">
                      <Skeleton className="h-4 w-32 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20 rounded-lg" />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Skeleton className="h-7 w-16 rounded-lg ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-[#94A3B8] text-sm"
                    data-ocid="patients.empty_state"
                  >
                    No patients found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient, idx) => (
                  <TableRow
                    key={patient.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                    data-ocid={`patients.item.${idx + 1}`}
                  >
                    <TableCell className="pl-5">
                      <p className="font-semibold text-[#1E293B] text-sm">
                        {patient.name}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-[#475569]">
                      {patient.phone}
                    </TableCell>
                    <TableCell className="text-sm text-[#475569]">
                      {patient.age} yrs
                    </TableCell>
                    <TableCell>
                      <GenderBadge gender={patient.gender} />
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <p
                        className="text-sm text-[#475569] truncate"
                        title={patient.address}
                      >
                        {patient.address}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-[#475569]">
                      {formatDate(patient.registeredAt)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          className="h-8 w-8 rounded-lg text-[#64748B] hover:text-primary hover:bg-primary/10"
                          onClick={() => openEdit(patient)}
                          data-ocid={`patients.edit_button.${idx + 1}`}
                          aria-label={`Edit ${patient.name}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          className="h-8 w-8 rounded-lg text-[#64748B] hover:text-red-500 hover:bg-red-50"
                          onClick={() => setDeletePatient(patient)}
                          data-ocid={`patients.delete_button.${idx + 1}`}
                          aria-label={`Delete ${patient.name}`}
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
        <div className="block md:hidden" data-ocid="patients.list">
          {isLoading ? (
            SKELETON_ROWS.map((key) => (
              <div
                key={key}
                className="p-4 border-b border-[#E2E8F0] last:border-0"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36 rounded-lg" />
                  <Skeleton className="h-3.5 w-28 rounded-lg" />
                  <div className="flex gap-2 mt-1">
                    <Skeleton className="h-5 w-12 rounded-lg" />
                    <Skeleton className="h-5 w-16 rounded-lg" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredPatients.length === 0 ? (
            <div
              className="text-center py-12 text-[#94A3B8] text-sm"
              data-ocid="patients.empty_state"
            >
              No patients found matching your filters.
            </div>
          ) : (
            filteredPatients.map((patient, idx) => (
              <div
                key={patient.id}
                className="p-4 border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                data-ocid={`patients.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1E293B] text-sm truncate">
                      {patient.name}
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {patient.phone}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs text-[#64748B]">
                        {patient.age} yrs
                      </span>
                      <GenderBadge gender={patient.gender} />
                      <Badge
                        variant="outline"
                        className="text-xs rounded-lg bg-red-50 text-red-600 border-red-200"
                      >
                        {patient.bloodGroup}
                      </Badge>
                    </div>
                    <p
                      className="text-xs text-[#94A3B8] mt-1 truncate"
                      title={patient.address}
                    >
                      {patient.address}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Reg: {formatDate(patient.registeredAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      type="button"
                      className="h-8 w-8 rounded-lg text-[#64748B] hover:text-primary hover:bg-primary/10"
                      onClick={() => openEdit(patient)}
                      data-ocid={`patients.edit_button.${idx + 1}`}
                      aria-label={`Edit ${patient.name}`}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      type="button"
                      className="h-8 w-8 rounded-lg text-[#64748B] hover:text-red-500 hover:bg-red-50"
                      onClick={() => setDeletePatient(patient)}
                      data-ocid={`patients.delete_button.${idx + 1}`}
                      aria-label={`Delete ${patient.name}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Patient count footer */}
      {!isLoading && filteredPatients.length > 0 && (
        <p className="text-xs text-[#94A3B8] mt-3 px-1">
          Showing {filteredPatients.length} of {patients.length} patients
        </p>
      )}

      {/* Add Patient Modal */}
      <PatientFormModal
        open={showAddModal}
        mode="add"
        form={form}
        onFormChange={updateForm}
        onSave={handleSaveAdd}
        onClose={() => {
          setShowAddModal(false);
          setForm(EMPTY_FORM);
        }}
      />

      {/* Edit Patient Modal */}
      <PatientFormModal
        open={!!editPatient}
        mode="edit"
        form={form}
        onFormChange={updateForm}
        onSave={handleSaveEdit}
        onClose={() => {
          setEditPatient(null);
          setForm(EMPTY_FORM);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletePatient}
        title="Delete Patient"
        message={`Are you sure you want to delete ${deletePatient?.name ?? "this patient"}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletePatient(null)}
      />
    </div>
  );
}
