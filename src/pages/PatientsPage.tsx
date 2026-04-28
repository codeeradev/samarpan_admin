import {
  type PatientItem,
  type PatientPayload,
  getAllPatientsApi,
  updatePatientApi,
} from "@/apiCalls/patients";
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
import type { PatientGender } from "@/types";
import { formatDate } from "@/types";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Pencil, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface PatientFormState {
  name: string;
  phone: string;
  age: string;
  gender: PatientGender | "";
  address: string;
  bloodGroup: string;
  medicalHistory: string;
}

type PatientFormErrors = Partial<Record<keyof PatientFormState, string>>;

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

interface PatientFormModalProps {
  open: boolean;
  form: PatientFormState;
  isSaving: boolean;
  onFormChange: (updates: Partial<PatientFormState>) => void;
  onSave: () => void;
  onClose: () => void;
}

function PatientFormModal({
  open,
  form,
  isSaving,
  onFormChange,
  onSave,
  onClose,
}: PatientFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        className="rounded-2xl w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid="patients.edit_dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-[#1E293B] text-lg font-semibold">
            Edit Patient
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
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

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#374151]">
              Gender <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.gender}
              onValueChange={(value) =>
                onFormChange({ gender: value as PatientGender })
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

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#374151]">
              Blood Group <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.bloodGroup}
              onValueChange={(value) => onFormChange({ bloodGroup: value })}
            >
              <SelectTrigger
                className="rounded-xl border-[#E2E8F0] focus:ring-primary/30"
                data-ocid="patients.form.blood_group_select"
              >
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {BLOOD_GROUPS.map((bloodGroup) => (
                  <SelectItem key={bloodGroup} value={bloodGroup}>
                    {bloodGroup}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            disabled={isSaving}
            className="w-full sm:w-auto rounded-xl border-[#E2E8F0] text-[#64748B] hover:bg-amber-50"
            data-ocid="patients.form.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="w-full sm:w-auto rounded-xl bg-primary hover:bg-secondary text-white"
            data-ocid="patients.form.submit_button"
          >
            {isSaving ? "Updating..." : "Update Patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getPatientGender(value?: PatientItem["gender"]): PatientGender | null {
  if (value === "male" || value === "female" || value === "other") {
    return value;
  }

  return null;
}

function getPatientName(patient: PatientItem) {
  return patient.name?.trim() || "Unnamed patient";
}

function getPatientPhone(patient: PatientItem) {
  return patient.phone ? String(patient.phone) : "Not set";
}

function getPatientAgeLabel(patient: PatientItem) {
  return patient.age && patient.age > 0 ? `${patient.age} yrs` : "Not set";
}

function getPatientAddress(patient: PatientItem) {
  return patient.address?.trim() || "Not provided";
}

function getPatientBloodGroup(patient: PatientItem) {
  return patient.bloodGroup?.trim() || "Not set";
}

function getPatientRegisteredAt(patient: PatientItem) {
  return patient.createdAt || patient.updatedAt || new Date().toISOString();
}

function validateForm(form: PatientFormState): PatientFormErrors {
  const errors: PatientFormErrors = {};
  const age = Number(form.age);

  if (!form.name.trim()) errors.name = "Patient name is required.";
  if (!form.phone.trim()) errors.phone = "Phone number is required.";
  if (!form.age.trim()) errors.age = "Age is required.";
  else if (Number.isNaN(age) || age < 1 || age > 150)
    errors.age = "Age must be between 1 and 150.";
  if (!form.gender) errors.gender = "Gender is required.";
  if (!form.address.trim()) errors.address = "Address is required.";
  if (!form.bloodGroup.trim()) errors.bloodGroup = "Blood group is required.";

  return errors;
}

function buildPayload(form: PatientFormState): PatientPayload {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    age: Number(form.age),
    gender: form.gender as PatientGender,
    address: form.address.trim(),
    bloodGroup: form.bloodGroup.trim(),
    medicalHistory: form.medicalHistory.trim() || undefined,
  };
}

export default function PatientsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<PatientGender | "all">(
    "all",
  );
  const [editPatient, setEditPatient] = useState<PatientItem | null>(null);
  const [form, setForm] = useState<PatientFormState>(EMPTY_FORM);

  const {
    data: patients = [],
    isLoading,
    isError,
    error,
  } = useQuery<PatientItem[], Error>({
    queryKey: ["patients"],
    queryFn: getAllPatientsApi,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: PatientPayload;
    }) => updatePatientApi(id, payload),
    onSuccess: () => {
      toast.success("Patient updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setEditPatient(null);
      setForm(EMPTY_FORM);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const filteredPatients = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return patients.filter((patient) => {
      const gender = getPatientGender(patient.gender);
      const matchesSearch =
        !query ||
        getPatientName(patient).toLowerCase().includes(query) ||
        getPatientPhone(patient).toLowerCase().includes(query);
      const matchesGender = genderFilter === "all" || gender === genderFilter;

      return matchesSearch && matchesGender;
    });
  }, [patients, searchTerm, genderFilter]);

  const updateForm = (updates: Partial<PatientFormState>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const openEdit = (patient: PatientItem) => {
    setForm({
      name: patient.name ?? "",
      phone: patient.phone ? String(patient.phone) : "",
      age: patient.age ? String(patient.age) : "",
      gender: getPatientGender(patient.gender) ?? "",
      address: patient.address ?? "",
      bloodGroup: patient.bloodGroup ?? "",
      medicalHistory: patient.medicalHistory ?? "",
    });
    setEditPatient(patient);
  };

  const handleSaveEdit = () => {
    if (!editPatient) return;

    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0] ?? "Please fill in all required fields.");
      return;
    }

    updateMutation.mutate({
      id: editPatient._id,
      payload: buildPayload(form),
    });
  };

  return (
    <div data-ocid="patients.page">
      <PageHeader
        title="Patient Management"
        description="View and manage all registered patients."
      />

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
          onValueChange={(value) => setGenderFilter(value as PatientGender | "all")}
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

      <div
        className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden"
        data-ocid="patients.table"
      >
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
                      <Skeleton className="h-7 w-8 rounded-lg ml-auto" />
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
                    {isError
                      ? error?.message ?? "Unable to load patients."
                      : "No patients found matching your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient, idx) => {
                  const gender = getPatientGender(patient.gender);

                  return (
                    <TableRow
                      key={patient._id}
                      className="hover:bg-[#F8FAFC] transition-colors"
                      data-ocid={`patients.item.${idx + 1}`}
                    >
                      <TableCell className="pl-5">
                        <p className="font-semibold text-[#1E293B] text-sm">
                          {getPatientName(patient)}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-[#475569]">
                        {getPatientPhone(patient)}
                      </TableCell>
                      <TableCell className="text-sm text-[#475569]">
                        {getPatientAgeLabel(patient)}
                      </TableCell>
                      <TableCell>
                        {gender ? (
                          <GenderBadge gender={gender} />
                        ) : (
                          <span className="text-xs text-[#94A3B8]">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[160px]">
                        <p
                          className="text-sm text-[#475569] truncate"
                          title={getPatientAddress(patient)}
                        >
                          {getPatientAddress(patient)}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-[#475569]">
                        {formatDate(getPatientRegisteredAt(patient))}
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
                            aria-label={`Edit ${getPatientName(patient)}`}
                          >
                            <Pencil size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

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
              {isError
                ? error?.message ?? "Unable to load patients."
                : "No patients found matching your filters."}
            </div>
          ) : (
            filteredPatients.map((patient, idx) => {
              const gender = getPatientGender(patient.gender);

              return (
                <div
                  key={patient._id}
                  className="p-4 border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                  data-ocid={`patients.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1E293B] text-sm truncate">
                        {getPatientName(patient)}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {getPatientPhone(patient)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-[#64748B]">
                          {getPatientAgeLabel(patient)}
                        </span>
                        {gender ? (
                          <GenderBadge gender={gender} />
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs rounded-lg text-[#94A3B8] border-slate-200"
                          >
                            Gender not set
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-xs rounded-lg bg-red-50 text-red-600 border-red-200"
                        >
                          {getPatientBloodGroup(patient)}
                        </Badge>
                      </div>
                      <p
                        className="text-xs text-[#94A3B8] mt-1 truncate"
                        title={getPatientAddress(patient)}
                      >
                        {getPatientAddress(patient)}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Reg: {formatDate(getPatientRegisteredAt(patient))}
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
                        aria-label={`Edit ${getPatientName(patient)}`}
                      >
                        <Pencil size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {!isLoading && filteredPatients.length > 0 && (
        <p className="text-xs text-[#94A3B8] mt-3 px-1">
          Showing {filteredPatients.length} of {patients.length} patients
        </p>
      )}

      <PatientFormModal
        open={!!editPatient}
        form={form}
        isSaving={updateMutation.isPending}
        onFormChange={updateForm}
        onSave={handleSaveEdit}
        onClose={() => {
          setEditPatient(null);
          setForm(EMPTY_FORM);
        }}
      />
    </div>
  );
}
