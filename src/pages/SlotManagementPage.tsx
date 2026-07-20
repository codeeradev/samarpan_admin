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
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type TimeSlotLine = {
  id: string;
  startTime: string;
  endTime: string;
  maximumPatients: number;
};

type WeeklyDayLine = {
  id: string;
  date: string;
  slots: TimeSlotLine[];
};

type AppointmentSlotForm = {
  doctorId: string;
  slotType: SlotType;
  date: string;
  appointmentPrice: number;
  bookingCloseMinutesBeforeEnd: number;
  isActive: boolean;
  slots: TimeSlotLine[];
  weeklyDays: WeeklyDayLine[];
};

const createTimeSlotLine = (
  overrides: Partial<Omit<TimeSlotLine, "id">> = {},
): TimeSlotLine => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  startTime: "09:00",
  endTime: "10:00",
  maximumPatients: 10,
  ...overrides,
});

const createWeeklyDayLine = (
  overrides: Partial<Omit<WeeklyDayLine, "id" | "slots">> & {
    slots?: TimeSlotLine[];
  } = {},
): WeeklyDayLine => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  date: "",
  slots: [createTimeSlotLine()],
  ...overrides,
});

const emptyForm: AppointmentSlotForm = {
  doctorId: "",
  slotType: "daily",
  date: "",
  appointmentPrice: 0,
  bookingCloseMinutesBeforeEnd: 10,
  isActive: true,
  slots: [createTimeSlotLine()],
  weeklyDays: [createWeeklyDayLine()],
};

export default function SlotManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AppointmentSlot | null>(null);
  const [form, setForm] = useState<AppointmentSlotForm>(() => resetForm());

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
    mutationFn: (payloads: AppointmentSlotPayload[]) =>
      Promise.all(payloads.map((payload) => addAppointmentSlotApi(payload))),
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
      extraPayloads,
    }: {
      id: string;
      payload: AppointmentSlotPayload;
      extraPayloads: AppointmentSlotPayload[];
    }) =>
      Promise.all([
        updateAppointmentSlotApi(id, payload),
        ...extraPayloads.map((extraPayload) =>
          addAppointmentSlotApi(extraPayload),
        ),
      ]),
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
        slot.timeSlots
          ?.map(
            (timeSlot) =>
              `${timeSlot.startTime} ${timeSlot.endTime} ${timeSlot.maximumPatients}`,
          )
          .join(" "),
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
    setForm(resetForm());
    setDialogOpen(true);
  }

  function openEdit(slot: AppointmentSlot) {
    setEditingSlot(slot);
    setForm({
      doctorId: String(slot.doctorId),
      slotType: slot.slotType,
      date: slot.dateKey || (slot.date ? slot.date.slice(0, 10) : ""),
      appointmentPrice: slot.appointmentPrice ?? 0,
      bookingCloseMinutesBeforeEnd: slot.bookingCloseMinutesBeforeEnd ?? 10,
      isActive: slot.isActive,
      slots:
        slot.slotType === "daily"
          ? getFormTimeSlots(slot)
          : [createTimeSlotLine()],
      weeklyDays:
        slot.slotType === "weekly"
          ? getFormWeeklyDays(slot)
          : [createWeeklyDayLine()],
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingSlot(null);
    setForm(resetForm());
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
    const payloads = buildSlotPayloads(form);

    if (!payloads.length) {
      toast.error("Please add at least one slot time.");
      return;
    }

    const invalidLine =
      form.slotType === "daily"
        ? form.slots.find(isInvalidTimeSlot)
        : form.weeklyDays.find(
            (day) =>
              !day.date ||
              !day.slots.length ||
              day.slots.some(isInvalidTimeSlot),
          );

    if (invalidLine) {
      toast.error(
        form.slotType === "weekly"
          ? "Please enter a date, valid time range and patient capacity for every weekly day."
          : "Please enter a valid time range and patient capacity for every slot.",
      );
      return;
    }

    if (form.appointmentPrice < 0) {
      toast.error("Appointment price must be 0 or more.");
      return;
    }
    if (
      !Number.isInteger(form.bookingCloseMinutesBeforeEnd) ||
      form.bookingCloseMinutesBeforeEnd < 0
    ) {
      toast.error("Booking close time must be 0 minutes or more.");
      return;
    }
    if (
      getAllFormTimeSlots(form).some(
        (slot) =>
          form.bookingCloseMinutesBeforeEnd >
          timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime),
      )
    ) {
      toast.error(
        "Booking close time cannot be longer than a slot time range.",
      );
      return;
    }

    if (editingSlot) {
      updateMutation.mutate({
        id: editingSlot._id,
        payload: payloads[0],
        extraPayloads: payloads.slice(1),
      });
    } else {
      addMutation.mutate(payloads);
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
                    <TableCell className="max-w-[180px]">
                      <div className="truncate" title={formatSlotDate(slot)}>
                        {formatSlotDate(slot)}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[250px]">
                      <div className="truncate" title={formatSlotTimes(slot)}>
                        {formatSlotTimes(slot)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {slot.bookedCount ?? 0}/{sumSlotCapacity(slot)}
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
  form: AppointmentSlotForm;
  doctors: DoctorItem[];
  isEditing: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (form: AppointmentSlotForm) => void;
  onSave: () => void;
}) {
  const setField = <K extends keyof AppointmentSlotForm>(
    key: K,
    value: AppointmentSlotForm[K],
  ) => onChange({ ...form, [key]: value });
  const updateDailySlotLine = <K extends keyof TimeSlotLine>(
    id: string,
    key: K,
    value: TimeSlotLine[K],
  ) =>
    onChange({
      ...form,
      slots: form.slots.map((slot) =>
        slot.id === id ? { ...slot, [key]: value } : slot,
      ),
    });
  const addDailySlotLine = () =>
    onChange({
      ...form,
      slots: [
        ...form.slots,
        createTimeSlotLine({
          startTime: form.slots.at(-1)?.endTime ?? "09:00",
          endTime: form.slots.at(-1)?.endTime
            ? addOneHour(form.slots.at(-1)?.endTime ?? "09:00")
            : "10:00",
          maximumPatients: form.slots.at(-1)?.maximumPatients ?? 10,
        }),
      ],
    });
  const removeDailySlotLine = (id: string) =>
    onChange({
      ...form,
      slots: form.slots.filter((slot) => slot.id !== id),
    });
  const updateWeeklyDayDate = (dayId: string, date: string) =>
    onChange({
      ...form,
      weeklyDays: form.weeklyDays.map((day) =>
        day.id === dayId ? { ...day, date } : day,
      ),
    });
  const addWeeklyDay = () =>
    onChange({
      ...form,
      weeklyDays: [
        ...form.weeklyDays,
        createWeeklyDayLine({
          date: nextWeeklyDate(form.weeklyDays.at(-1)?.date),
        }),
      ],
    });
  const removeWeeklyDay = (dayId: string) =>
    onChange({
      ...form,
      weeklyDays: form.weeklyDays.filter((day) => day.id !== dayId),
    });
  const updateWeeklyTimeLine = <K extends keyof TimeSlotLine>(
    dayId: string,
    slotId: string,
    key: K,
    value: TimeSlotLine[K],
  ) =>
    onChange({
      ...form,
      weeklyDays: form.weeklyDays.map((day) =>
        day.id === dayId
          ? {
              ...day,
              slots: day.slots.map((slot) =>
                slot.id === slotId ? { ...slot, [key]: value } : slot,
              ),
            }
          : day,
      ),
    });
  const addWeeklyTimeLine = (dayId: string) =>
    onChange({
      ...form,
      weeklyDays: form.weeklyDays.map((day) => {
        if (day.id !== dayId) return day;
        const previousSlot = day.slots.at(-1);

        return {
          ...day,
          slots: [
            ...day.slots,
            createTimeSlotLine({
              startTime: previousSlot?.endTime ?? "09:00",
              endTime: previousSlot?.endTime
                ? addOneHour(previousSlot.endTime)
                : "10:00",
              maximumPatients: previousSlot?.maximumPatients ?? 10,
            }),
          ],
        };
      }),
    });
  const removeWeeklyTimeLine = (dayId: string, slotId: string) =>
    onChange({
      ...form,
      weeklyDays: form.weeklyDays.map((day) =>
        day.id === dayId
          ? { ...day, slots: day.slots.filter((slot) => slot.id !== slotId) }
          : day,
      ),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] !max-w-3xl overflow-y-auto p-0">
        <DialogHeader>
          <div className="border-b border-border px-6 py-5">
            <DialogTitle>{isEditing ? "Edit Slot" : "Add Slot"}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
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
                  weeklyDays:
                    value === "weekly"
                      ? form.weeklyDays.map((day, index) => ({
                          ...day,
                          date: day.date || dateFromToday(index),
                        }))
                      : form.weeklyDays,
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
              <Label>Week Dates</Label>
              <div className="flex min-h-10 items-center rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                Select each day needed for this week
              </div>
            </div>
          )}

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
            <Label>Booking Closes Before End (Minutes)</Label>
            <Input
              type="number"
              min={0}
              value={form.bookingCloseMinutesBeforeEnd}
              onChange={(event) =>
                setField(
                  "bookingCloseMinutesBeforeEnd",
                  Number(event.target.value),
                )
              }
            />
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

          {form.slotType === "daily" ? (
            <div className="space-y-3 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label>Slot Times</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDailySlotLine}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add More
                </Button>
              </div>
              <div className="space-y-3">
                {form.slots.map((slot, index) => (
                  <TimeSlotFields
                    key={slot.id}
                    slot={slot}
                    canRemove={form.slots.length > 1}
                    onChange={(key, value) =>
                      updateDailySlotLine(slot.id, key, value)
                    }
                    onRemove={() => removeDailySlotLine(slot.id)}
                    removeLabel={`Remove slot ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label>Weekly Days</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWeeklyDay}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Day
                </Button>
              </div>
              <div className="space-y-3">
                {form.weeklyDays.map((day, dayIndex) => (
                  <div
                    key={day.id}
                    className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={day.date}
                          onChange={(event) =>
                            updateWeeklyDayDate(day.id, event.target.value)
                          }
                        />
                        {/* {day.date && (
                          <p className="text-xs text-muted-foreground">
                            Applies on {weekdayNames[getWeekday(day.date)]}
                          </p>
                        )} */}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addWeeklyTimeLine(day.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Time
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={form.weeklyDays.length === 1}
                          onClick={() => removeWeeklyDay(day.id)}
                          aria-label={`Remove day ${dayIndex + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {day.slots.map((slot, slotIndex) => (
                        <TimeSlotFields
                          key={slot.id}
                          slot={slot}
                          canRemove={day.slots.length > 1}
                          onChange={(key, value) =>
                            updateWeeklyTimeLine(day.id, slot.id, key, value)
                          }
                          onRemove={() => removeWeeklyTimeLine(day.id, slot.id)}
                          removeLabel={`Remove day ${dayIndex + 1} time ${
                            slotIndex + 1
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
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

function TimeSlotFields({
  slot,
  canRemove,
  onChange,
  onRemove,
  removeLabel,
}: {
  slot: TimeSlotLine;
  canRemove: boolean;
  onChange: <K extends keyof TimeSlotLine>(
    key: K,
    value: TimeSlotLine[K],
  ) => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background/70 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] md:items-end">
      <div className="space-y-2">
        <Label>Start Time</Label>
        <Input
          type="time"
          value={slot.startTime}
          onChange={(event) => onChange("startTime", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>End Time</Label>
        <Input
          type="time"
          value={slot.endTime}
          onChange={(event) => onChange("endTime", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Patient Capacity</Label>
        <Input
          type="number"
          min={1}
          value={slot.maximumPatients}
          onChange={(event) =>
            onChange("maximumPatients", Number(event.target.value))
          }
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canRemove}
          onClick={onRemove}
          aria-label={removeLabel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function formatSlotDate(slot: AppointmentSlot) {
  if (slot.slotType === "weekly") {
    if (slot.weeklyDays?.length) {
      return slot.weeklyDays
        .map((day) => {
          const dateKey = getDateKey(day.date, day.dateKey);
          return `${dateKey} (${weekdayNames[day.weekday]})`;
        })
        .join(", ");
    }

    if (slot.dateKey || slot.date) {
      const dateKey = slot.dateKey || slot.date?.slice(0, 10) || "";
      return `${dateKey} (${weekdayNames[getWeekday(dateKey)]})`;
    }

    return typeof slot.weekday === "number"
      ? `Week slot (${weekdayNames[slot.weekday]})`
      : "Week slot";
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

function isInvalidTimeSlot(slot: TimeSlotLine) {
  return (
    !slot.startTime ||
    !slot.endTime ||
    slot.startTime >= slot.endTime ||
    slot.maximumPatients < 1
  );
}

function resetForm(): AppointmentSlotForm {
  return {
    ...emptyForm,
    slots: [createTimeSlotLine()],
    weeklyDays: [createWeeklyDayLine()],
  };
}

function buildSlotPayloads(
  form: AppointmentSlotForm,
): AppointmentSlotPayload[] {
  if (form.slotType === "daily") {
    return [buildSlotPayload(form, form.slots, form.date)];
  }

  return [buildWeeklySlotPayload(form)];
}

function buildSlotPayload(
  form: AppointmentSlotForm,
  slots: TimeSlotLine[],
  weeklyDate?: string,
): AppointmentSlotPayload {
  const timeSlots = [...slots]
    .map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      maximumPatients: Number(slot.maximumPatients),
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const firstSlot = timeSlots[0];
  const lastSlot = timeSlots[timeSlots.length - 1];
  const slotDurationMinutes =
    timeToMinutes(firstSlot.endTime) - timeToMinutes(firstSlot.startTime);

  return {
    doctorId: form.doctorId,
    slotType: form.slotType,
    date: form.slotType === "daily" ? form.date : weeklyDate,
    weekday:
      form.slotType === "weekly" && weeklyDate
        ? getWeekday(weeklyDate)
        : undefined,
    startTime: firstSlot.startTime,
    endTime: lastSlot.endTime,
    maximumPatients: sumTimeSlotCapacity(timeSlots),
    timeSlots,
    appointmentPrice: form.appointmentPrice,
    slotDurationMinutes,
    bookingCloseMinutesBeforeEnd: form.bookingCloseMinutesBeforeEnd,
    isActive: form.isActive,
  };
}

function buildWeeklySlotPayload(
  form: AppointmentSlotForm,
): AppointmentSlotPayload {
  const weeklyDays = form.weeklyDays
    .map((day) => ({
      date: day.date,
      weekday: getWeekday(day.date),
      timeSlots: normalizeTimeSlots(day.slots),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const flattenedSlots = weeklyDays.flatMap((day) => day.timeSlots);
  const sortedSlots = [...flattenedSlots].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
  const firstSlot = sortedSlots[0];
  const lastSlot = sortedSlots[sortedSlots.length - 1];
  const firstDay = weeklyDays[0];
  const slotDurationMinutes =
    timeToMinutes(firstSlot.endTime) - timeToMinutes(firstSlot.startTime);

  return {
    doctorId: form.doctorId,
    slotType: "weekly",
    date: firstDay.date,
    weekday: firstDay.weekday,
    startTime: firstSlot.startTime,
    endTime: lastSlot.endTime,
    maximumPatients: sumTimeSlotCapacity(flattenedSlots),
    timeSlots: firstDay.timeSlots,
    weeklyDays,
    appointmentPrice: form.appointmentPrice,
    slotDurationMinutes,
    bookingCloseMinutesBeforeEnd: form.bookingCloseMinutesBeforeEnd,
    isActive: form.isActive,
  };
}

function normalizeTimeSlots(slots: TimeSlotLine[]) {
  return [...slots]
    .map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      maximumPatients: Number(slot.maximumPatients),
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function getFormTimeSlots(slot: AppointmentSlot): TimeSlotLine[] {
  const source = slot.timeSlots?.length
    ? slot.timeSlots
    : [
        {
          startTime: slot.startTime,
          endTime: slot.endTime,
          maximumPatients: slot.maximumPatients,
        },
      ];

  return source.map((timeSlot) =>
    createTimeSlotLine({
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      maximumPatients: timeSlot.maximumPatients,
    }),
  );
}

function getFormWeeklyDays(slot: AppointmentSlot): WeeklyDayLine[] {
  if (slot.weeklyDays?.length) {
    return slot.weeklyDays.map((day) =>
      createWeeklyDayLine({
        date: getDateKey(day.date, day.dateKey),
        slots: day.timeSlots.map((timeSlot) =>
          createTimeSlotLine({
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            maximumPatients: timeSlot.maximumPatients,
          }),
        ),
      }),
    );
  }

  return [
    createWeeklyDayLine({
      date:
        slot.dateKey ||
        (slot.date ? slot.date.slice(0, 10) : "") ||
        dateForWeekday(slot.weekday ?? undefined),
      slots: getFormTimeSlots(slot),
    }),
  ];
}

function getAllFormTimeSlots(form: AppointmentSlotForm) {
  return form.slotType === "daily"
    ? form.slots
    : form.weeklyDays.flatMap((day) => day.slots);
}

function sumSlotCapacity(slot: AppointmentSlot) {
  if (slot.weeklyDays?.length) {
    return sumTimeSlotCapacity(slot.weeklyDays.flatMap((day) => day.timeSlots));
  }

  return sumTimeSlotCapacity(
    slot.timeSlots?.length
      ? slot.timeSlots
      : [
          {
            startTime: slot.startTime,
            endTime: slot.endTime,
            maximumPatients: slot.maximumPatients,
          },
        ],
  );
}

function sumTimeSlotCapacity(
  slots: Array<{ maximumPatients: number | string }>,
) {
  return slots.reduce(
    (total, slot) => total + Number(slot.maximumPatients || 0),
    0,
  );
}

function formatSlotTimes(slot: AppointmentSlot) {
  if (slot.weeklyDays?.length) {
    return slot.weeklyDays
      .map((day) => {
        const dateKey = getDateKey(day.date, day.dateKey);
        const times = day.timeSlots
          .map(
            (timeSlot) =>
              `${formatTime12Hour(timeSlot.startTime)} - ${formatTime12Hour(
                timeSlot.endTime,
              )}`,
          )
          .join(", ");
        return `${dateKey}: ${times}`;
      })
      .join(" | ");
  }

  const timeSlots = slot.timeSlots?.length
    ? slot.timeSlots
    : [
        {
          startTime: slot.startTime,
          endTime: slot.endTime,
          maximumPatients: slot.maximumPatients,
        },
      ];

  return timeSlots
    .map(
      (timeSlot) =>
        `${formatTime12Hour(timeSlot.startTime)} - ${formatTime12Hour(
          timeSlot.endTime,
        )}`,
    )
    .join(", ");
}

function formatTime12Hour(time: string) {
  const [rawHours, rawMinutes] = time.split(":").map(Number);
  if (!Number.isFinite(rawHours) || !Number.isFinite(rawMinutes)) return time;
  const period = rawHours >= 12 ? "PM" : "AM";
  const hours = rawHours % 12 || 12;
  return `${hours}:${String(rawMinutes).padStart(2, "0")} ${period}`;
}

const weekdayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getWeekday(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`).getDay();
}

function dateForWeekday(weekday = new Date().getDay()) {
  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() + ((weekday - today.getDay() + 7) % 7));
  return formatDateInput(date);
}

function dateFromToday(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDateInput(date);
}

function nextWeeklyDate(dateKey?: string) {
  const base = dateKey ? new Date(`${dateKey}T00:00:00`) : new Date();
  base.setDate(base.getDate() + 1);
  return formatDateInput(base);
}

function addOneHour(time: string) {
  const nextMinutes = Math.min(timeToMinutes(time) + 60, 24 * 60 - 1);
  const hours = Math.floor(nextMinutes / 60);
  const minutes = nextMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateKey(date?: string | null, fallback?: string | null) {
  return fallback || (date ? date.slice(0, 10) : "");
}
