import {
  type AppointmentSlot,
  type AppointmentSlotPayload,
  addAppointmentSlotApi,
  deleteAppointmentSlotApi,
  getAppointmentSlotsApi,
  updateAppointmentSlotApi,
} from "@/apiCalls/appointmentSettings";
import { type DoctorItem, getAllDoctorsApi } from "@/apiCalls/doctors";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type OPDScheduleForm = {
  department: string;
  doctorId: string;
  days: string[]; // Array of selected weekdays: ["0", "1", "2"] etc.
  startTime: string;
  endTime: string;
};

const WEEKDAYS = [
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
  { value: "0", label: "Sunday" },
];

const emptyForm: OPDScheduleForm = {
  department: "",
  doctorId: "",
  days: [],
  startTime: "09:00",
  endTime: "17:00",
};

export default function OPDSchedulePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterDoctor, setFilterDoctor] = useState<string | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AppointmentSlot | null>(null);
  const [form, setForm] = useState<OPDScheduleForm>(emptyForm);

  const { data: allDoctors = [] } = useQuery<DoctorItem[]>({
    queryKey: ["doctors"],
    queryFn: getAllDoctorsApi,
  });

  const {
    data: slots = [],
    isLoading,
    isError,
    error,
  } = useQuery<AppointmentSlot[], Error>({
    queryKey: ["opd-schedule", filterDoctor],
    queryFn: () =>
      getAppointmentSlotsApi({
        doctorId: filterDoctor,
      }),
  });

  const addMutation = useMutation({
    mutationFn: (payload: AppointmentSlotPayload) => addAppointmentSlotApi(payload),
    onSuccess: () => {
      toast.success("OPD Schedule created successfully.");
      queryClient.invalidateQueries({ queryKey: ["opd-schedule"] });
      closeDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AppointmentSlotPayload }) =>
      updateAppointmentSlotApi(id, payload),
    onSuccess: () => {
      toast.success("OPD Schedule updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["opd-schedule"] });
      closeDialog();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAppointmentSlotApi(id, { isActive } as AppointmentSlotPayload),
    onSuccess: () => {
      toast.success("Status updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["opd-schedule"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAppointmentSlotApi,
    onSuccess: () => {
      toast.success("OPD Schedule deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["opd-schedule"] });
      setDeleteOpen(false);
      setEditingSlot(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filteredSlots = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return slots;
    return slots.filter((slot) =>
      [slot.doctorName, slot.departmentName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
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
      department: slot.departmentName || "",
      doctorId: String(slot.doctorId),
      days: (slot.weekdays || []).map(d => String(d)),
      startTime: slot.startTime || "09:00",
      endTime: slot.endTime || "17:00",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingSlot(null);
    setForm(emptyForm);
  }

  function toggleDay(dayValue: string) {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(dayValue)
        ? prev.days.filter((d) => d !== dayValue)
        : [...prev.days, dayValue],
    }));
  }

  function toggleSelectAll() {
    if (form.days.length === WEEKDAYS.length) {
      // Deselect all
      setForm((prev) => ({ ...prev, days: [] }));
    } else {
      // Select all
      setForm((prev) => ({ ...prev, days: WEEKDAYS.map((d) => d.value) }));
    }
  }

  function saveSchedule() {
    if (!form.department.trim()) {
      toast.error("Please enter a department name.");
      return;
    }
    if (!form.doctorId) {
      toast.error("Please select a doctor.");
      return;
    }
    if (!form.days.length) {
      toast.error("Please select at least one day.");
      return;
    }
    if (!form.startTime || !form.endTime) {
      toast.error("Please enter start and end time.");
      return;
    }
    if (form.startTime >= form.endTime) {
      toast.error("End time must be after start time.");
      return;
    }

    const payload: AppointmentSlotPayload = {
      doctorId: form.doctorId,
      departmentName: form.department,
      weekdays: form.days.map(d => Number(d)),
      startTime: form.startTime,
      endTime: form.endTime,
      isActive: true,
    };

    if (editingSlot) {
      updateMutation.mutate({ id: editingSlot._id, payload });
    } else {
      addMutation.mutate(payload);
    }
  }

  function toggleStatus(slot: AppointmentSlot) {
    toggleStatusMutation.mutate({
      id: slot._id,
      isActive: !slot.isActive,
    });
  }

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title="OPD Schedule"
        description="Manage OPD schedules with department, doctor, days and timing."
        action={
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Schedule
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schedules"
            className="pl-9"
          />
        </div>
        <Select
          value={filterDoctor || "all"}
          onValueChange={(value) => setFilterDoctor(value === "all" ? undefined : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Doctors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Doctors</SelectItem>
            {allDoctors.map((doctor) => (
              <SelectItem key={doctor._id} value={doctor._id}>
                {doctor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableHead>Sr.No.</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Doctor's Name</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((key) => (
                  <TableRow key={key}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredSlots.length ? (
                filteredSlots.map((slot, index) => (
                  <TableRow key={slot._id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {slot.departmentName || "N/A"}
                    </TableCell>
                    <TableCell>{slot.doctorName}</TableCell>
                    <TableCell>
                      {slot.weekdays && slot.weekdays.length > 0
                        ? slot.weekdays
                            .map(day => WEEKDAYS.find(d => d.value === String(day))?.label)
                            .filter(Boolean)
                            .join(", ")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {slot.startTime} - {slot.endTime}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={slot.isActive}
                          onCheckedChange={() => toggleStatus(slot)}
                          disabled={toggleStatusMutation.isPending}
                        />
                        <span className="text-sm">
                          {slot.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(slot)}
                          title="Edit"
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
                          title="Delete"
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
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No OPD schedules found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] !max-w-2xl overflow-y-auto p-0">
          <DialogHeader>
            <div className="border-b border-border px-6 py-5">
              <DialogTitle>
                {editingSlot ? "Edit OPD Schedule" : "Add OPD Schedule"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid gap-5 px-6 py-5">
            {/* Department - TEXT INPUT */}
            <div className="space-y-2">
              <Label>Department *</Label>
              <Input
                type="text"
                placeholder="Enter department name"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>

            {/* Doctor */}
            <div className="space-y-2">
              <Label>Doctor *</Label>
              <Select
                value={form.doctorId}
                onValueChange={(value) => setForm({ ...form, doctorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {allDoctors.map((doctor) => (
                    <SelectItem key={doctor._id} value={doctor._id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Days - MULTIPLE SELECT with Checkboxes */}
            <div className="space-y-3">
              <Label>Days * (Select multiple)</Label>
              <div className="rounded-lg border border-border p-4">
                {/* Select All */}
                <div className="mb-3 flex items-center space-x-2 border-b border-border pb-3">
                  <Checkbox
                    id="select-all"
                    checked={form.days.length === WEEKDAYS.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All
                  </label>
                </div>

                {/* Individual Days */}
                <div className="grid grid-cols-2 gap-3">
                  {WEEKDAYS.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={form.days.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <label
                        htmlFor={`day-${day.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Time - Simple Start and End */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button variant="outline" onClick={() => closeDialog()}>
              Cancel
            </Button>
            <Button onClick={saveSchedule} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete OPD Schedule"
        message="This schedule will be permanently deleted."
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete"}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (editingSlot) deleteMutation.mutate(editingSlot._id);
        }}
      />
    </div>
  );
}
