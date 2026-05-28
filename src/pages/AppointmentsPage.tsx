import {
  getAppointmentsApi,
  updateAppointmentApi,
} from "@/apiCalls/appointments";
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
import { Textarea } from "@/components/ui/textarea";
import type { Appointment, AppointmentStatus } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Stethoscope,
  StickyNote,
  UserRound,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RescheduleForm {
  date: string;
  time: string;
  doctorId: string;
  reason: string;
}

type ActionType = "approve" | "reject" | "complete";

interface PendingAction {
  id: string;
  type: ActionType;
  patientName: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SKELETON_ROWS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"];

const STATUS_OPTIONS: { value: "all" | AppointmentStatus; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const INDIA_TIME_ZONE = "Asia/Kolkata";

function parseDate(value?: Date | string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function formatIndiaDate(value?: Date | string | null) {
  const date = parseDate(value);
  if (!date) return null;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: INDIA_TIME_ZONE,
  }).format(date);
}

function formatIndiaTime(value?: Date | string | null) {
  const date = parseDate(value);
  if (!date) return null;

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: INDIA_TIME_ZONE,
  }).format(date);
}

function formatIndiaDateInputValue(value?: Date | string | null) {
  const date = parseDate(value);
  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: INDIA_TIME_ZONE,
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  return year && month && day ? `${year}-${month}-${day}` : "";
}

function formatIndiaTimeInputValue(value?: Date | string | null) {
  const date = parseDate(value);
  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: INDIA_TIME_ZONE,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";

  return hour && minute ? `${hour}:${minute}` : "";
}

function toAppointmentDatePayload(date: string, time: string) {
  if (!date) return "";

  return new Date(`${date}T${time || "00:00"}:00+05:30`).toISOString();
}

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

function trimmedValue(value?: string | null) {
  return value?.trim() ?? "";
}

function isRescheduledAppointment(appt: Appointment) {
  return (
    appt.status === "rescheduled" ||
    Boolean(appt.rescheduledAt) ||
    hasText(appt.rescheduleReason)
  );
}

function getAppointmentDisplayTime(appt: Appointment) {
  return isRescheduledAppointment(appt)
    ? formatIndiaTime(appt.appointmentDate)
    : formatIndiaTime(appt.createdAt ?? appt.appointmentDate);
}

interface DetailItemProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  wide?: boolean;
}

function DetailItem({ icon: Icon, label, value, wide }: DetailItemProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-background/70 p-3 shadow-sm ${wide ? "sm:col-span-2" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="mt-1 break-words text-sm font-semibold text-foreground">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface AppointmentCardProps {
  appt: Appointment;
  idx: number;
  onApprove: () => void;
  onReject: () => void;
  onComplete: () => void;
  onReschedule: () => void;
  onView: () => void;
  isUpdating: boolean; // 👈 ADD THIS
}

function AppointmentCard({
  appt,
  idx,
  onApprove,
  onReject,
  onComplete,
  onReschedule,
  onView,
  isUpdating,
}: AppointmentCardProps) {
  const isInactive = appt.status === "completed" || appt.status === "cancelled";
  return (
    <div
      className={`bg-card border border-border rounded-2xl p-4 shadow-sm ${isInactive ? "opacity-60" : ""}`}
      data-ocid={`appointments.item.${idx + 1}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm leading-tight truncate">
            {appt.fullName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {appt.serviceName}
          </p>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <span className="text-muted-foreground block">Doctor</span>
          <span className="font-medium text-foreground truncate block">
            {appt.doctorName}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block">Date</span>
          <span className="font-medium text-foreground block">
            {formatIndiaDate(appt.appointmentDate) ?? "TBD"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block">Time</span>
          <span className="font-medium text-foreground block">
            {getAppointmentDisplayTime(appt) ?? "TBD"}
          </span>
        </div>
      </div>

      {appt.reason && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {appt.reason}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs text-foreground border-border hover:bg-accent rounded-xl gap-1 flex-1 sm:flex-none"
          onClick={onView}
          data-ocid={`appointments.view_button.${idx + 1}`}
        >
          <Eye size={12} />
          View
        </Button>

        {!isInactive && (
          <>
            {appt.status === "pending" && (
              <>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-3 text-xs bg-primary hover:bg-secondary text-white rounded-xl gap-1 flex-1 sm:flex-none"
                  onClick={onApprove}
                  disabled={isUpdating}
                  data-ocid={`appointments.approve_button.${idx + 1}`}
                >
                  <CheckCircle2 size={12} />
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs text-destructive border-destructive/20 hover:bg-destructive/10 rounded-xl gap-1 flex-1 sm:flex-none"
                  onClick={onReject}
                  disabled={isUpdating}
                  data-ocid={`appointments.reject_button.${idx + 1}`}
                >
                  <XCircle size={12} />
                  Reject
                </Button>
              </>
            )}
            {appt.status === "confirmed" && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs text-primary border-primary/30 hover:bg-primary/10 rounded-xl gap-1 flex-1 sm:flex-none"
                  onClick={onReschedule}
                  data-ocid={`appointments.reschedule_button.${idx + 1}`}
                >
                  <CalendarClock size={12} />
                  Reschedule
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-3 text-xs bg-secondary hover:bg-primary text-white rounded-xl gap-1 flex-1 sm:flex-none"
                  onClick={onComplete}
                  data-ocid={`appointments.complete_button.${idx + 1}`}
                >
                  <CheckCircle2 size={12} />
                  Complete
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => getAppointmentsApi({}),
  });

  const { data: doctors = [] } = useQuery<DoctorItem[], Error>({
    queryKey: ["doctors"],
    queryFn: getAllDoctorsApi,
  });

  const appointments = data?.appointments || [];

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateAppointmentApi(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Appointment updated successfully");
    },
    onError: () => {
      toast.error("Failed to update appointment");
    },
  });

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>(
    "all",
  );
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return appointments.filter((a) => {
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesSearch =
        !q ||
        a.fullName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.serviceName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [appointments, search, statusFilter]);

  // ── Confirm dialog ─────────────────────────────────────────────────────────
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  function triggerAction(id: string, type: ActionType, patientName: string) {
    setPendingAction({ id, type, patientName });
  }

  function executeAction() {
    if (!pendingAction) return;
    const { id, type } = pendingAction;
    const actionMap = {
      approve: "approve",
      reject: "reject",
      complete: "complete",
    };
    updateMutation.mutate({ id, payload: { action: actionMap[type] } });
    setPendingAction(null);
  }

  // ── Data table columns ─────────────────────────────────────────────────────
  const columns = [
    {
      name: "Patient",
      selector: (row: Appointment) => row.fullName,
      sortable: true,
      cell: (row: Appointment) => (
        <div>
          <p className="font-semibold text-foreground text-sm">
            {row.fullName}
          </p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      name: "Doctor",
      selector: (row: Appointment) => row.doctorName,
      sortable: true,
    },
    {
      name: "Date",
      selector: (row: Appointment) =>
        isRescheduledAppointment(row)
          ? new Date(row.appointmentDate).getTime()
          : new Date(row.createdAt ?? row.appointmentDate).getTime(),
      sortable: true,
      cell: (row: Appointment) => (
        <div>
          <p className="text-sm text-foreground font-medium">
            {formatIndiaDate(row.appointmentDate) ?? "TBD"}
          </p>
          <p className="text-xs text-muted-foreground">
            {getAppointmentDisplayTime(row) ?? "TBD"}
          </p>
        </div>
      ),
    },
    {
      name: "Status",
      selector: (row: Appointment) => row.status,
      sortable: true,
      cell: (row: Appointment) => <StatusBadge status={row.status} />,
    },
    {
      name: "Actions",
      width: "320px",
      cell: (row: Appointment) => {
        const isInactive =
          row.status === "completed" || row.status === "cancelled";
        return (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2.5 text-xs text-foreground border-border hover:bg-accent rounded-lg gap-1"
              onClick={() => setDetailTarget(row)}
            >
              <Eye size={11} />
              View
            </Button>
            {row.status === "pending" && (
              <>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2.5 text-xs bg-primary hover:bg-secondary text-white rounded-lg gap-1"
                  onClick={() =>
                    triggerAction(row._id, "approve", row.fullName)
                  }
                  disabled={updateMutation.isPending}
                >
                  <CheckCircle2 size={11} />
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs text-destructive border-destructive/20 hover:bg-destructive/10 rounded-lg gap-1"
                  onClick={() => triggerAction(row._id, "reject", row.fullName)}
                  disabled={updateMutation.isPending}
                >
                  <XCircle size={11} />
                  Reject
                </Button>
              </>
            )}
            {row.status === "confirmed" && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs text-primary border-primary/30 hover:bg-primary/10 rounded-lg gap-1"
                  onClick={() => openReschedule(row)}
                  disabled={updateMutation.isPending}
                >
                  <CalendarClock size={11} />
                  Reschedule
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2.5 text-xs bg-secondary hover:bg-primary text-white rounded-lg gap-1"
                  onClick={() =>
                    triggerAction(row._id, "complete", row.fullName)
                  }
                  disabled={updateMutation.isPending}
                >
                  <CheckCircle2 size={11} />
                  Complete
                </Button>
              </>
            )}
            {isInactive && (
              <span className="text-border text-sm select-none pr-1">—</span>
            )}
          </div>
        );
      },
    },
  ];

  // ── Reschedule modal ────────────────────────────────────────────────────────
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(
    null,
  );

  const [rescheduleForm, setRescheduleForm] = useState<RescheduleForm>({
    date: "",
    time: "",
    doctorId: "",
    reason: "",
  });

  function openReschedule(appt: Appointment) {
    setRescheduleTarget(appt);

    setRescheduleForm({
      date: formatIndiaDateInputValue(appt.appointmentDate),
      time: formatIndiaTimeInputValue(appt.appointmentDate),
      doctorId: appt.doctorId || "",
      reason: appt.rescheduleReason || appt.reason || "",
    });
  }

  function saveReschedule() {
    if (!rescheduleTarget) return;
    updateMutation.mutate({
      id: rescheduleTarget._id,
      payload: {
        action: "reschedule",
        appointmentDate: toAppointmentDatePayload(
          rescheduleForm.date,
          rescheduleForm.time,
        ),
        rescheduleReason: rescheduleForm.reason,
      },
    });
    setRescheduleTarget(null);
  }

  // ── Confirm dialog messages ────────────────────────────────────────────────
  const confirmConfig = pendingAction
    ? {
        approve: {
          title: "Approve Appointment",
          message: `Approve this appointment for ${pendingAction.patientName}?`,
          confirmLabel: "Approve",
          variant: "default" as const,
        },
        reject: {
          title: "Reject Appointment",
          message: `Reject this appointment for ${pendingAction.patientName}?`,
          confirmLabel: "Reject",
          variant: "destructive" as const,
        },
        complete: {
          title: "Mark as Completed",
          message: "Mark this appointment as completed?",
          confirmLabel: "Mark Complete",
          variant: "default" as const,
        },
      }[pendingAction.type]
    : null;

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div data-ocid="appointments.page">
      <PageHeader
        title="Appointments"
        description="Approving an appointment adds the patient record. Completing an appointment reflects discharge status automatically."
      />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient or doctor…"
            className="pl-9 h-9 rounded-xl border-border bg-card text-sm focus-visible:ring-primary/30"
            data-ocid="appointments.search_input"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | AppointmentStatus)}
        >
          <SelectTrigger
            className="w-full sm:w-44 h-9 rounded-xl border-border bg-card text-sm"
            data-ocid="appointments.status_filter.select"
          >
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-sm"
                data-ocid={`appointments.status_filter.${opt.value}`}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile card list (visible on small screens) */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading ? (
          SKELETON_ROWS.map((key) => (
            <div
              key={key}
              className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-lg" />
                  <Skeleton className="h-3 w-20 rounded-lg" />
                </div>
                <Skeleton className="h-5 w-20 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-3 w-24 rounded-lg" />
                <Skeleton className="h-3 w-24 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-full rounded-xl" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div
            className="bg-card border border-border rounded-2xl p-10 text-center shadow-sm"
            data-ocid="appointments.empty_state"
          >
            <p className="text-muted-foreground text-sm">
              No appointments found matching your filters.
            </p>
          </div>
        ) : (
          filtered.map((appt, idx) => (
            <AppointmentCard
              key={appt._id}
              appt={appt}
              idx={idx}
              isUpdating={updateMutation.isPending}
              onApprove={() =>
                triggerAction(appt._id, "approve", appt.fullName)
              }
              onReject={() => triggerAction(appt._id, "reject", appt.fullName)}
              onComplete={() =>
                triggerAction(appt._id, "complete", appt.fullName)
              }
              onReschedule={() => openReschedule(appt)}
              onView={() => setDetailTarget(appt)}
            />
          ))
        )}
      </div>

      {/* Desktop table (hidden on small screens) */}
      <div className="hidden md:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          progressPending={isLoading}
          progressComponent={<Skeleton className="h-4 w-full" />}
          noDataComponent={
            <p className="text-muted-foreground text-sm py-16 text-center">
              No appointments found matching your filters.
            </p>
          }
          pagination
          responsive
          highlightOnHover
          striped
        />
      </div>

      {/* Confirm action dialog */}
      {pendingAction && confirmConfig && (
        <ConfirmDialog
          open
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel={confirmConfig.confirmLabel}
          variant={confirmConfig.variant}
          onConfirm={executeAction}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {/* Appointment details dialog */}
      <Dialog
        open={!!detailTarget}
        onOpenChange={(open) => !open && setDetailTarget(null)}
      >
        <DialogContent
          className="max-h-[92vh] overflow-y-auto rounded-2xl border border-border shadow-xl sm:max-w-3xl"
          data-ocid="appointments.details.dialog"
        >
          <DialogHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <DialogTitle className="text-xl font-semibold text-foreground">
                  Appointment Details
                </DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {detailTarget?.fullName ?? "Patient"} ·{" "}
                  {formatIndiaDate(detailTarget?.appointmentDate) ?? "TBD"}
                </p>
              </div>
              {detailTarget && <StatusBadge status={detailTarget.status} />}
            </div>
          </DialogHeader>

          {detailTarget && (
            <div className="space-y-4 py-1">
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-primary">
                      Patient
                    </p>
                    <h3 className="mt-1 truncate text-2xl font-bold text-foreground">
                      {detailTarget.fullName}
                    </h3>
                    {hasText(detailTarget.serviceName) && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {trimmedValue(detailTarget.serviceName)}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-card px-4 py-3 text-sm shadow-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                      Appointment
                    </p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatIndiaDate(detailTarget.appointmentDate) ?? "TBD"}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                      {getAppointmentDisplayTime(detailTarget) ?? "TBD"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem
                  icon={UserRound}
                  label="Full name"
                  value={trimmedValue(detailTarget.fullName)}
                />
                {hasText(detailTarget.phoneNumber) && (
                  <DetailItem
                    icon={Phone}
                    label="Phone number"
                    value={trimmedValue(detailTarget.phoneNumber)}
                  />
                )}
                {hasText(detailTarget.email) && (
                  <DetailItem
                    icon={Mail}
                    label="Email"
                    value={trimmedValue(detailTarget.email)}
                  />
                )}
                {hasText(detailTarget.doctorName) && (
                  <DetailItem
                    icon={Stethoscope}
                    label="Doctor"
                    value={trimmedValue(detailTarget.doctorName)}
                  />
                )}
                {hasText(detailTarget.serviceName) && (
                  <DetailItem
                    icon={FileText}
                    label="Service"
                    value={trimmedValue(detailTarget.serviceName)}
                  />
                )}
                <DetailItem
                  icon={Clock}
                  label={
                    isRescheduledAppointment(detailTarget)
                      ? "Appointment time"
                      : "Appointment time"
                  }
                  value={getAppointmentDisplayTime(detailTarget) ?? "TBD"}
                />
                {formatIndiaDate(detailTarget.preferredDate) && (
                  <DetailItem
                    icon={CalendarClock}
                    label="Preferred date"
                    value={formatIndiaDate(detailTarget.preferredDate)}
                  />
                )}
                {hasText(detailTarget.reason) && (
                  <DetailItem
                    icon={StickyNote}
                    label="Reason"
                    value={trimmedValue(detailTarget.reason)}
                    wide
                  />
                )}
                {hasText(detailTarget.rescheduleReason) && (
                  <DetailItem
                    icon={RefreshCw}
                    label="Reschedule reason"
                    value={trimmedValue(detailTarget.rescheduleReason)}
                    wide
                  />
                )}
                {hasText(detailTarget.rejectionReason) && (
                  <DetailItem
                    icon={XCircle}
                    label="Rejection reason"
                    value={trimmedValue(detailTarget.rejectionReason)}
                    wide
                  />
                )}
                {hasText(detailTarget.notes) && (
                  <DetailItem
                    icon={StickyNote}
                    label="Notes"
                    value={trimmedValue(detailTarget.notes)}
                    wide
                  />
                )}
              </div>
            </div>
          )}

          <DialogFooter className="pt-1">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-border text-muted-foreground hover:bg-accent sm:w-auto"
              onClick={() => setDetailTarget(null)}
              data-ocid="appointments.details.close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule modal */}
      <Dialog
        open={!!rescheduleTarget}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
      >
        <DialogContent
          className="max-w-[95vw] sm:max-w-md rounded-2xl border border-border shadow-xl max-h-[90vh] overflow-y-auto"
          data-ocid="appointments.reschedule.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg font-semibold">
              Reschedule Appointment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Patient (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">
                Patient
              </Label>
              <Input
                value={rescheduleTarget?.fullName ?? ""}
                readOnly
                className="h-9 rounded-xl border-border bg-muted text-muted-foreground text-sm cursor-default"
                data-ocid="appointments.reschedule.patient_input"
              />
            </div>

            {/* Date + Time — stacked on mobile, side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="reschedule-date"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Date
                </Label>
                <Input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) =>
                    setRescheduleForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="h-9 w-full rounded-xl border-border text-sm"
                  data-ocid="appointments.reschedule.date_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="reschedule-time"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Time
                </Label>
                <Input
                  id="reschedule-time"
                  type="time"
                  value={rescheduleForm.time}
                  onChange={(e) =>
                    setRescheduleForm((f) => ({ ...f, time: e.target.value }))
                  }
                  className="h-9 w-full rounded-xl border-border text-sm"
                  data-ocid="appointments.reschedule.time_input"
                />
              </div>
            </div>

            {/* Doctor */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">
                Doctor
              </Label>
              <Select
                value={rescheduleForm.doctorId}
                onValueChange={(v) =>
                  setRescheduleForm((f) => ({ ...f, doctorId: v }))
                }
              >
                <SelectTrigger
                  className="h-9 rounded-xl border-border text-sm"
                  data-ocid="appointments.reschedule.doctor_select"
                >
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-52">
                  {doctors.map((d) => (
                    <SelectItem key={d._id} value={d._id} className="text-sm">
                      {d.name}
                      <span className="text-muted-foreground ml-1 text-xs">
                        · {d.specialization ?? "Doctor"}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label
                htmlFor="reschedule-reason"
                className="text-sm font-medium text-muted-foreground"
              >
                Reason
              </Label>
              <Textarea
                id="reschedule-reason"
                value={rescheduleForm.reason}
                onChange={(e) =>
                  setRescheduleForm((f) => ({ ...f, reason: e.target.value }))
                }
                rows={3}
                placeholder="Reason for visit…"
                className="rounded-xl border-border text-sm resize-none focus-visible:ring-primary/30 min-h-[80px]"
                data-ocid="appointments.reschedule.reason_textarea"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-border text-muted-foreground hover:bg-accent w-full sm:w-auto"
              onClick={() => setRescheduleTarget(null)}
              data-ocid="appointments.reschedule.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-primary hover:bg-secondary text-white w-full sm:w-auto"
              onClick={saveReschedule}
              data-ocid="appointments.reschedule.save_button"
            >
              Save Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
