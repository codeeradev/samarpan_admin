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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getAppointmentsApi, updateAppointmentApi } from "@/apiCalls/appointments";
import { getAllDoctorsApi, type DoctorItem } from "@/apiCalls/doctors";
import type { Appointment, AppointmentStatus } from "@/types";
import { formatDate } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Search, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DataTable from 'react-data-table-component';

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

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface AppointmentCardProps {
  appt: Appointment;
  idx: number;
  onApprove: () => void;
  onReject: () => void;
  onComplete: () => void;
  onReschedule: () => void;
  isUpdating: boolean; // 👈 ADD THIS
}

function AppointmentCard({
  appt,
  idx,
  onApprove,
  onReject,
  onComplete,
  onReschedule,
  isUpdating,
}: AppointmentCardProps) {
  const isInactive = appt.status === "completed" || appt.status === "cancelled";
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm ${isInactive ? "opacity-60" : ""}`}
      data-ocid={`appointments.item.${idx + 1}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-[#1E293B] text-sm leading-tight truncate">
            {appt.fullName}
          </p>
          <p className="text-xs text-[#94A3B8] mt-0.5">{appt.serviceName}</p>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <span className="text-[#94A3B8] block">Doctor</span>
          <span className="font-medium text-[#334155] truncate block">
            {appt.doctorName}
          </span>
        </div>
        <div>
          <span className="text-[#94A3B8] block">Date &amp; Time</span>
          <span className="font-medium text-[#334155] block">
            {formatDate(appt.appointmentDate)}
          </span>
        </div>
      </div>

      {appt.reason && (
        <p className="text-xs text-[#64748B] mb-3 line-clamp-2">
          {appt.reason}
        </p>
      )}

      {!isInactive && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E2E8F0]">
          {appt.status === "pending" && (
            <>
              <Button
                type="button"
                size="sm"
                className="h-8 px-3 text-xs bg-green-500 hover:bg-green-600 text-white rounded-xl gap-1 flex-1 sm:flex-none"
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
                className="h-8 px-3 text-xs text-rose-500 border-rose-200 hover:bg-rose-50 rounded-xl gap-1 flex-1 sm:flex-none"
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
        </div>
      )}
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
      name: 'Patient',
      selector: (row: Appointment) => row.fullName,
      sortable: true,
      cell: (row: Appointment) => (
        <div>
          <p className="font-semibold text-[#1E293B] text-sm">{row.fullName}</p>
          <p className="text-xs text-[#94A3B8]">{row.email}</p>
        </div>
      ),
    },
    {
      name: 'Doctor',
      selector: (row: Appointment) => row.doctorName,
      sortable: true,
    },
    {
      name: 'Date & Time',
      selector: (row: Appointment) => new Date(row.appointmentDate).getTime(),
      sortable: true,
      cell: (row: Appointment) => {
        const date = new Date(row.appointmentDate);
        const isValidDate = !isNaN(date.getTime());
        return (
          <p className="text-sm text-[#334155] font-medium">
            {isValidDate ? formatDate(date) : 'TBD'}
          </p>
        );
      },
    },
    {
      name: 'Reason',
      selector: (row: Appointment) => row.reason || "",
      cell: (row: Appointment) => (
        <p className="text-sm text-[#64748B] max-w-[180px] truncate">{row.reason}</p>
      ),
    },
    {
      name: 'Status',
      selector: (row: Appointment) => row.status,
      sortable: true,
      cell: (row: Appointment) => <StatusBadge status={row.status} />,
    },
    {
      name: 'Actions',
      cell: (row: Appointment) => {
        const isInactive = row.status === "completed" || row.status === "cancelled";
        return (
          <div className="flex items-center gap-1.5">
            {row.status === "pending" && (
              <>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 px-2.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg gap-1"
                  onClick={() => triggerAction(row._id, "approve", row.fullName)}
                  disabled={updateMutation.isPending}
                >
                  <CheckCircle2 size={11} />
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs text-rose-500 border-rose-200 hover:bg-rose-50 rounded-lg gap-1"
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
                  onClick={() => triggerAction(row._id, "complete", row.fullName)}
                  disabled={updateMutation.isPending}
                >
                  <CheckCircle2 size={11} />
                  Complete
                </Button>
              </>
            )}
            {isInactive && <span className="text-[#CBD5E1] text-sm select-none pr-1">—</span>}
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
    const appointmentDate = new Date(appt.appointmentDate);
    const dateStr = appointmentDate.toISOString().split('T')[0];
    const timeStr = appointmentDate.toTimeString().split(':').slice(0, 2).join(':');
    
    setRescheduleForm({
      date: dateStr || "",
      time: timeStr || "",
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
        appointmentDate: rescheduleForm.date,
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
        description={`Approving an appointment adds the patient record. Completing an appointment reflects discharge status automatically.`}
      />

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient or doctor…"
            className="pl-9 h-9 rounded-xl border-[#E2E8F0] bg-white text-sm focus-visible:ring-primary/30"
            data-ocid="appointments.search_input"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | AppointmentStatus)}
        >
          <SelectTrigger
            className="w-full sm:w-44 h-9 rounded-xl border-[#E2E8F0] bg-white text-sm"
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
              className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm space-y-3"
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
            className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center shadow-sm"
            data-ocid="appointments.empty_state"
          >
            <p className="text-[#94A3B8] text-sm">
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
              onReject={() =>
                triggerAction(appt._id, "reject", appt.fullName)
              }
              onComplete={() =>
                triggerAction(appt._id, "complete", appt.fullName)
              }
              onReschedule={() => openReschedule(appt)}
            />
          ))
        )}
      </div>

      {/* Desktop table (hidden on small screens) */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          progressPending={isLoading}
          progressComponent={<Skeleton className="h-4 w-full" />}
          noDataComponent={<p className="text-[#94A3B8] text-sm py-16 text-center">No appointments found matching your filters.</p>}
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

      {/* Reschedule modal */}
      <Dialog
        open={!!rescheduleTarget}
        onOpenChange={(open) => !open && setRescheduleTarget(null)}
      >
        <DialogContent
          className="max-w-[95vw] sm:max-w-md rounded-2xl border border-[#E2E8F0] shadow-xl max-h-[90vh] overflow-y-auto"
          data-ocid="appointments.reschedule.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-[#1E293B] text-lg font-semibold">
              Reschedule Appointment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Patient (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#64748B]">
                Patient
              </Label>
              <Input
                value={rescheduleTarget?.fullName ?? ""}
                readOnly
                className="h-9 rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] text-sm cursor-default"
                data-ocid="appointments.reschedule.patient_input"
              />
            </div>

            {/* Date + Time — stacked on mobile, side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="reschedule-date"
                  className="text-sm font-medium text-[#64748B]"
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
                  className="h-9 w-full rounded-xl border-[#E2E8F0] text-sm"
                  data-ocid="appointments.reschedule.date_input"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="reschedule-time"
                  className="text-sm font-medium text-[#64748B]"
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
                  className="h-9 w-full rounded-xl border-[#E2E8F0] text-sm"
                  data-ocid="appointments.reschedule.time_input"
                />
              </div>
            </div>

            {/* Doctor */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-[#64748B]">
                Doctor
              </Label>
              <Select
                value={rescheduleForm.doctorId}
                onValueChange={(v) =>
                  setRescheduleForm((f) => ({ ...f, doctorId: v }))
                }
              >
                <SelectTrigger
                  className="h-9 rounded-xl border-[#E2E8F0] text-sm"
                  data-ocid="appointments.reschedule.doctor_select"
                >
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-52">
                  {doctors.map((d) => (
                    <SelectItem key={d._id} value={d._id} className="text-sm">
                      {d.name}
                      <span className="text-[#94A3B8] ml-1 text-xs">
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
                className="text-sm font-medium text-[#64748B]"
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
                className="rounded-xl border-[#E2E8F0] text-sm resize-none focus-visible:ring-primary/30 min-h-[80px]"
                data-ocid="appointments.reschedule.reason_textarea"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-[#E2E8F0] text-[#64748B] hover:bg-amber-50 w-full sm:w-auto"
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
