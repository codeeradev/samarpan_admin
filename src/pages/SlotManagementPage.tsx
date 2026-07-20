import {
  type AppointmentSlot,
  type AppointmentSlotPayload,
  type SlotType,
  addAppointmentSlotApi,
  deleteAppointmentSlotApi,
  getAppointmentSlotsApi,
  updateAppointmentSlotApi,
} from "@/apiCalls/appointmentSettings";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const emptyForm: AppointmentSlotPayload = {
  doctorId: "",
  slotType: "daily",
  date: "",
  weekday: undefined,
  startTime: "09:00",
  endTime: "10:00",
  maximumPatients: 10,
  appointmentPrice: 0,
  slotDurationMinutes: 30,
  isActive: true,
};

export default function SlotManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AppointmentSlot | null>(null);
  const [form, setForm] = useState<AppointmentSlotPayload>(emptyForm);

  const { data: doctors = [] } = useQuery<DoctorItem[]>({
    queryKey: ["doctors"],
    queryFn: getAllDoctorsApi,
  });

  const {
    data: slots = [],
    isLoading,
    isError,
    error,
  } = useQuery<AppointmentSlot[], Error>({
    queryKey: ["appointment-slots", selectedDate],
    queryFn: () => getAppointmentSlotsApi({ date: selectedDate || undefined }),
  });

  const addMutation = useMutation({
    mutationFn: addAppointmentSlotApi,
    onSuccess: () => {
      toast.success("Slot created successfully.");
      queryClient.invalidateQueries({ queryKey: ["appointment-slots"] });
      closeDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: { id: string; payload: AppointmentSlotPayload }) =>
      updateAppointmentSlotApi(id, payload),
    onSuccess: () => {
      toast.success("Slot updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["appointment-slots"] });
      closeDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAppointmentSlotApi,
    onSuccess: () => {
      toast.success("Slot deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["appointment-slots"] });
      setDeleteOpen(false);
      setEditingSlot(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredSlots = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return slots;

    return slots.filter((slot) =>
      [
        slot.doctorName,
        slot.slotType,
        slot.startTime,
        slot.endTime,
        slot.appointmentPrice,
        slot.disabledReason,
        slot.dateKey,
        slot.appliesOnDateKey,
        formatSlotType(slot.slotType),
        formatSlotDate(slot),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [search, slots]);

  function openAdd() {
    setEditingSlot(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(slot: AppointmentSlot) {
    setEditingSlot(slot);
    setForm({
      doctorId: String(slot.doctorId),
      slotType: slot.slotType,
      date: slot.dateKey || (slot.date ? slot.date.slice(0, 10) : ""),
      weekday: slot.weekday ?? undefined,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maximumPatients: slot.maximumPatients,
      appointmentPrice: slot.appointmentPrice ?? 0,
      slotDurationMinutes: slot.slotDurationMinutes ?? 30,
      isActive: slot.isActive,
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingSlot(null);
    setForm(emptyForm);
  }

  function saveSlot() {
    if (!form.doctorId) {
      toast.error("Please select a doctor.");
      return;
    }
    if (form.slotType === "daily" && !form.date) {
      toast.error("Please select a date for the day wise slot.");
      return;
    }
    if (!form.startTime || !form.endTime || form.startTime >= form.endTime) {
      toast.error("Please enter a valid time range.");
      return;
    }
    if (form.maximumPatients < 1) {
      toast.error("Maximum patients must be at least 1.");
      return;
    }
    if (form.appointmentPrice < 0) {
      toast.error("Appointment price must be 0 or more.");
      return;
    }
    if (form.slotDurationMinutes < 1) {
      toast.error("Booking time gap must be at least 1 minute.");
      return;
    }
    if (
      form.slotDurationMinutes >
      timeToMinutes(form.endTime) - timeToMinutes(form.startTime)
    ) {
      toast.error(
        "Booking time gap cannot be longer than the slot time range.",
      );
      return;
    }

    if (editingSlot) {
      updateMutation.mutate({ id: editingSlot._id, payload: form });
    } else {
      addMutation.mutate(form);
    }
  }

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="Slot Management"
        description="Create day wise slots for one date or week slots for the full week."
        action={
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Slot
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search slots"
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date / Applies On</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [
                  "slot-sk-1",
                  "slot-sk-2",
                  "slot-sk-3",
                  "slot-sk-4",
                  "slot-sk-5",
                ].map((key) => (
                  <TableRow key={key}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredSlots.length ? (
                filteredSlots.map((slot) => (
                  <TableRow key={slot._id}>
                    <TableCell className="font-medium">
                      {slot.doctorName}
                    </TableCell>
                    <TableCell>{formatSlotType(slot.slotType)}</TableCell>
                    <TableCell>{formatSlotDate(slot)}</TableCell>
                    <TableCell>
                      {slot.startTime} - {slot.endTime}
                    </TableCell>
                    <TableCell>
                      {slot.bookedCount ?? 0}/{slot.maximumPatients}
                    </TableCell>
                    <TableCell>₹{slot.appointmentPrice ?? 0}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          slot.isActive && !slot.isExpired
                            ? "available"
                            : "on-leave"
                        }
                      />
                      {slot.disabledReason && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {slot.disabledReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(slot)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingSlot(slot);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No slots found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <SlotDialog
        open={dialogOpen}
        form={form}
        doctors={doctors}
        isEditing={Boolean(editingSlot)}
        isSaving={isSaving}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
        onChange={setForm}
        onSave={saveSlot}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Slot"
        message="This slot will no longer be available for future bookings."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (editingSlot) deleteMutation.mutate(editingSlot._id);
        }}
      />
    </div>
  );
}

function SlotDialog({
  open,
  form,
  doctors,
  isEditing,
  isSaving,
  onOpenChange,
  onChange,
  onSave,
}: {
  open: boolean;
  form: AppointmentSlotPayload;
  doctors: DoctorItem[];
  isEditing: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (form: AppointmentSlotPayload) => void;
  onSave: () => void;
}) {
  const setField = <K extends keyof AppointmentSlotPayload>(
    key: K,
    value: AppointmentSlotPayload[K],
  ) => onChange({ ...form, [key]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Slot" : "Add Slot"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Doctor</Label>
            <Select
              value={form.doctorId}
              onValueChange={(value) => setField("doctorId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Slot Type</Label>
            <Select
              value={form.slotType}
              onValueChange={(value) =>
                onChange({
                  ...form,
                  slotType: value as SlotType,
                  date: value === "daily" ? form.date : "",
                  weekday: undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Day Wise Slot</SelectItem>
                <SelectItem value="weekly">Week Slot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.slotType === "daily" ? (
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date ?? ""}
                onChange={(event) => setField("date", event.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Applies On</Label>
              <div className="flex min-h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                Full week
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              value={form.startTime}
              onChange={(event) => setField("startTime", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={form.endTime}
              onChange={(event) => setField("endTime", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Maximum Patients</Label>
            <Input
              type="number"
              min={1}
              value={form.maximumPatients}
              onChange={(event) =>
                setField("maximumPatients", Number(event.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Appointment Price (INR)</Label>
            <Input
              type="number"
              min={0}
              value={form.appointmentPrice}
              onChange={(event) =>
                setField("appointmentPrice", Number(event.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Booking Time Gap (Minutes)</Label>
            <Input
              type="number"
              min={1}
              value={form.slotDurationMinutes}
              onChange={(event) =>
                setField("slotDurationMinutes", Number(event.target.value))
              }
            />
            <p className="text-xs text-muted-foreground">
              Splits this slot into bookable times. Example: 10:00 AM to 2:00 PM
              with 30 minutes allows bookings up to 1:30 PM.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 sm:col-span-2">
            <Label>Status</Label>
            <div className="flex items-center gap-2 text-sm">
              <span>{form.isActive ? "Active" : "Inactive"}</span>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setField("isActive", checked)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Slot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatSlotDate(slot: AppointmentSlot) {
  if (slot.slotType === "weekly") {
    return "Full week";
  }

  return slot.dateKey || (slot.date ? slot.date.slice(0, 10) : "Not set");
}

function formatSlotType(slotType: SlotType) {
  return slotType === "weekly" ? "Week Slot" : "Day Wise Slot";
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
