import {
  type PatientItem,
  type PatientPayload,
  dischargePatientApi,
  getAllPatientsApi,
  updatePatientApi,
} from "@/apiCalls/patients";
import { getAppointmentsApi, type Appointment } from "@/apiCalls/appointments";
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
import { useAuth } from "@/hooks/useAuth";
import type { PatientGender } from "@/types";
import { formatDate } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
type PatientStatusFilter = "all" | "active" | "discharged";

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

function normalizePhone(
  value?: PatientItem["phone"] | Appointment["phoneNumber"],
) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/\D/g, "");
}

function GenderBadge({ gender }: { gender: PatientGender }) {
  const styles: Record<PatientGender, string> = {
    male: "bg-primary/10 text-primary border-primary/20",
    female: "bg-pink-50 text-pink-700 border-pink-200",
    other: "bg-accent text-secondary border-secondary/20",
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

function getPatientDoctor(patient: PatientItem) {
  return patient.doctor?.trim() || "Not assigned";
}

function isPatientDischarged(patient: PatientItem) {
  return Boolean(patient.dischargedAt);
}

function PatientStatusBadge({ patient }: { patient: PatientItem }) {
  if (isPatientDischarged(patient)) {
    return (
      <Badge
        variant="outline"
        className="rounded-lg border-secondary/20 bg-accent text-secondary"
      >
        Discharged
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="rounded-lg border-primary/20 bg-primary/10 text-primary"
    >
      Active
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
        className="rounded-3xl w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto"
        data-ocid="patients.edit_dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-semibold">
            Edit Patient
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label
              htmlFor="pt-name"
              className="text-sm font-medium text-foreground"
            >
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pt-name"
              placeholder="e.g. Arjun Verma"
              value={form.name}
              onChange={(e) => onFormChange({ name: e.target.value })}
              className="rounded-xl border-border focus-visible:ring-primary/30"
              data-ocid="patients.form.name_input"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="pt-phone"
              className="text-sm font-medium text-foreground"
            >
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pt-phone"
              placeholder="+91 9XXXXXXXXX"
              value={form.phone}
              onChange={(e) => onFormChange({ phone: e.target.value })}
              className="rounded-xl border-border focus-visible:ring-primary/30"
              data-ocid="patients.form.phone_input"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="pt-age"
              className="text-sm font-medium text-foreground"
            >
              Age <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pt-age"
              type="number"
              placeholder="e.g. 35"
              min={1}
              max={150}
              value={form.age}
              onChange={(e) => onFormChange({ age: e.target.value })}
              className="rounded-xl border-border focus-visible:ring-primary/30"
              data-ocid="patients.form.age_input"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Gender <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.gender}
              onValueChange={(value) =>
                onFormChange({ gender: value as PatientGender })
              }
            >
              <SelectTrigger
                className="rounded-xl border-border focus:ring-primary/30"
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
            <Label className="text-sm font-medium text-foreground">
              Blood Group <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.bloodGroup}
              onValueChange={(value) => onFormChange({ bloodGroup: value })}
            >
              <SelectTrigger
                className="rounded-xl border-border focus:ring-primary/30"
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
              className="text-sm font-medium text-foreground"
            >
              Address <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="pt-address"
              placeholder="Full address"
              rows={2}
              value={form.address}
              onChange={(e) => onFormChange({ address: e.target.value })}
              className="rounded-xl border-border focus-visible:ring-primary/30 resize-none"
              data-ocid="patients.form.address_textarea"
            />
          </div>

          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <Label
              htmlFor="pt-history"
              className="text-sm font-medium text-foreground"
            >
              Medical History{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="pt-history"
              placeholder="e.g. Hypertension, Type 2 Diabetes..."
              rows={2}
              value={form.medicalHistory}
              onChange={(e) => onFormChange({ medicalHistory: e.target.value })}
              className="rounded-xl border-border focus-visible:ring-primary/30 resize-none"
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
            className="w-full sm:w-auto rounded-xl border-border text-muted-foreground hover:bg-accent"
            data-ocid="patients.form.cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="w-full sm:w-auto rounded-xl bg-primary hover:bg-secondary text-white bg-primary"
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

function getPatientDischargeLabel(patient: PatientItem) {
  return patient.dischargedAt ? formatDate(patient.dischargedAt) : "";
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
  const { admin } = useAuth();
  const isDoctor = admin?.role === "doctor";
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<PatientGender | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>("all");
  const [editPatient, setEditPatient] = useState<PatientItem | null>(null);
  const [patientToDischarge, setPatientToDischarge] =
    useState<PatientItem | null>(null);
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

  const { data: appointmentData } = useQuery({
    queryKey: ["appointments", "patients-scope", admin?.id],
    queryFn: () => getAppointmentsApi({}),
    enabled: isDoctor && Boolean(admin?.id),
  });

  const roleScopedPatients = useMemo(() => {
    if (!isDoctor) {
      return patients;
    }

    const doctorId = admin?.id;
    if (!doctorId) {
      return [];
    }

    const appointments = appointmentData?.appointments ?? [];
    const allowedEmails = new Set<string>();
    const allowedPhones = new Set<string>();

    for (const appt of appointments) {
      if (appt.doctorId !== doctorId) {
        continue;
      }

      if (appt.status === "pending" || appt.status === "rejected") {
        continue;
      }

      if (appt.email) {
        allowedEmails.add(String(appt.email).toLowerCase().trim());
      }

      const phone = normalizePhone(appt.phoneNumber);
      if (phone) {
        allowedPhones.add(phone);
      }
    }

    if (allowedEmails.size === 0 && allowedPhones.size === 0) {
      return [];
    }

    return patients.filter((patient) => {
      const email = patient.email
        ? String(patient.email).toLowerCase().trim()
        : "";
      const phone = normalizePhone(patient.phone);
      return (
        (email && allowedEmails.has(email)) ||
        (phone && allowedPhones.has(phone))
      );
    });
  }, [admin?.id, appointmentData?.appointments, isDoctor, patients]);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PatientPayload }) =>
      updatePatientApi(id, payload),
    onSuccess: () => {
      toast.success("Patient updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setEditPatient(null);
      setForm(EMPTY_FORM);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const dischargeMutation = useMutation({
    mutationFn: (id: string) => dischargePatientApi(id),
    onSuccess: () => {
      toast.success("Patient discharged successfully.");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setPatientToDischarge(null);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const patientMetrics = useMemo(() => {
    const total = roleScopedPatients.length;
    const discharged = roleScopedPatients.filter(isPatientDischarged).length;

    return {
      total,
      discharged,
      active: total - discharged,
    };
  }, [roleScopedPatients]);

  const filteredPatients = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return roleScopedPatients.filter((patient) => {
      const gender = getPatientGender(patient.gender);
      const isDischarged = isPatientDischarged(patient);
      const matchesSearch =
        !query ||
        getPatientName(patient).toLowerCase().includes(query) ||
        getPatientPhone(patient).toLowerCase().includes(query);
      const matchesGender = genderFilter === "all" || gender === genderFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !isDischarged) ||
        (statusFilter === "discharged" && isDischarged);

      return matchesSearch && matchesGender && matchesStatus;
    });
  }, [roleScopedPatients, searchTerm, genderFilter, statusFilter]);

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
      toast.error(
        Object.values(errors)[0] ?? "Please fill in all required fields.",
      );
      return;
    }

    updateMutation.mutate({
      id: editPatient._id,
      payload: buildPayload(form),
    });
  };

  const handleDischarge = () => {
    if (!patientToDischarge) {
      return;
    }

    dischargeMutation.mutate(patientToDischarge._id);
  };

  return (
    <div data-ocid="patients.page">
      <PageHeader
        title="Patient Management"
        description="Approved appointments add patients automatically. Completed appointments are treated as discharged, and manual discharge keeps the appointment flow in sync."
      />

      <div
        className="grid gap-3 mb-5 md:grid-cols-3"
        data-ocid="patients.summary"
      >
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Total Patients
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {patientMetrics.total}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/10/50 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Active
          </p>
          <p className="mt-2 text-2xl font-semibold text-primary">
            {patientMetrics.active}
          </p>
        </div>
        <div className="rounded-2xl border border-secondary/20 bg-accent/60 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">
            Discharged
          </p>
          <p className="mt-2 text-2xl font-semibold text-secondary">
            {patientMetrics.discharged}
          </p>
        </div>
      </div>

      <div
        className="flex flex-wrap xl:flex-nowrap gap-3 mb-5"
        data-ocid="patients.filter_bar"
      >
        <div className="relative w-full xl:flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl border-border bg-card focus-visible:ring-primary/30 text-sm"
            data-ocid="patients.search_input"
          />
        </div>
        <Select
          value={genderFilter}
          onValueChange={(value) =>
            setGenderFilter(value as PatientGender | "all")
          }
        >
          <SelectTrigger
            className="w-full sm:w-44 rounded-xl border-border bg-card focus:ring-primary/30 text-sm"
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
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as PatientStatusFilter)
          }
        >
          <SelectTrigger
            className="w-full sm:w-44 rounded-xl border-border bg-card focus:ring-primary/30 text-sm"
            data-ocid="patients.status_filter_select"
          >
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="discharged">Discharged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
        data-ocid="patients.table"
      >
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-5">
                  Name
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Phone
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Age
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Gender
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Doctor
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide max-w-[160px]">
                  Address
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Registered
                </TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right pr-5">
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
                      <Skeleton className="h-5 w-24 rounded-lg" />
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
                    colSpan={9}
                    className="text-center py-12 text-muted-foreground text-sm"
                    data-ocid="patients.empty_state"
                  >
                    {isError
                      ? (error?.message ?? "Unable to load patients.")
                      : "No patients found matching your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient, idx) => {
                  const gender = getPatientGender(patient.gender);

                  return (
                    <TableRow
                      key={patient._id}
                      className="hover:bg-muted transition-colors"
                      data-ocid={`patients.item.${idx + 1}`}
                    >
                      <TableCell className="pl-5">
                        <p className="font-semibold text-foreground text-sm">
                          {getPatientName(patient)}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getPatientPhone(patient)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getPatientAgeLabel(patient)}
                      </TableCell>
                      <TableCell>
                        {gender ? (
                          <GenderBadge gender={gender} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not set
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getPatientDoctor(patient)}
                      </TableCell>
                      <TableCell className="max-w-[160px]">
                        <p
                          className="text-sm text-muted-foreground truncate"
                          title={getPatientAddress(patient)}
                        >
                          {getPatientAddress(patient)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <PatientStatusBadge patient={patient} />
                          {isPatientDischarged(patient) ? (
                            <p className="text-xs text-muted-foreground">
                              {getPatientDischargeLabel(patient)}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(getPatientRegisteredAt(patient))}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            type="button"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => openEdit(patient)}
                            data-ocid={`patients.edit_button.${idx + 1}`}
                            aria-label={`Edit ${getPatientName(patient)}`}
                          >
                            <Pencil size={14} />
                          </Button>
                          {!isPatientDischarged(patient) ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setPatientToDischarge(patient)}
                              data-ocid={`patients.discharge_button.${idx + 1}`}
                            >
                              Discharge
                            </Button>
                          ) : null}
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
                className="p-4 border-b border-border last:border-0"
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
              className="text-center py-12 text-muted-foreground text-sm"
              data-ocid="patients.empty_state"
            >
              {isError
                ? (error?.message ?? "Unable to load patients.")
                : "No patients found matching your filters."}
            </div>
          ) : (
            filteredPatients.map((patient, idx) => {
              const gender = getPatientGender(patient.gender);

              return (
                <div
                  key={patient._id}
                  className="p-4 border-b border-border last:border-0 hover:bg-muted transition-colors"
                  data-ocid={`patients.item.${idx + 1}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {getPatientName(patient)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getPatientPhone(patient)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {getPatientAgeLabel(patient)}
                        </span>
                        {gender ? (
                          <GenderBadge gender={gender} />
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs rounded-lg text-muted-foreground border-border"
                          >
                            Gender not set
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Doctor: {getPatientDoctor(patient)}
                        </p>
                        <PatientStatusBadge patient={patient} />
                        <Badge
                          variant="outline"
                          className="text-xs rounded-lg bg-destructive/10 text-destructive border-destructive/20"
                        >
                          {getPatientBloodGroup(patient)}
                        </Badge>
                      </div>
                      <p
                        className="text-xs text-muted-foreground mt-1 truncate"
                        title={getPatientAddress(patient)}
                      >
                        {getPatientAddress(patient)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reg: {formatDate(getPatientRegisteredAt(patient))}
                      </p>
                      {isPatientDischarged(patient) ? (
                        <p className="text-xs text-secondary mt-0.5">
                          Discharged: {getPatientDischargeLabel(patient)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        type="button"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => openEdit(patient)}
                        data-ocid={`patients.edit_button.${idx + 1}`}
                        aria-label={`Edit ${getPatientName(patient)}`}
                      >
                        <Pencil size={14} />
                      </Button>
                    </div>
                  </div>
                  {!isPatientDischarged(patient) ? (
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPatientToDischarge(patient)}
                        data-ocid={`patients.discharge_button.${idx + 1}`}
                      >
                        Discharge Patient
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {!isLoading && filteredPatients.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3 px-1">
          Showing {filteredPatients.length} of {roleScopedPatients.length}{" "}
          patients
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

      <ConfirmDialog
        open={!!patientToDischarge}
        title="Discharge Patient"
        message={
          patientToDischarge
            ? `Mark ${getPatientName(patientToDischarge)} as discharged? This will keep the record in the patient list but mark it as inactive.`
            : ""
        }
        confirmLabel={
          dischargeMutation.isPending ? "Discharging..." : "Discharge"
        }
        onConfirm={handleDischarge}
        onCancel={() => {
          if (!dischargeMutation.isPending) {
            setPatientToDischarge(null);
          }
        }}
      />
    </div>
  );
}
