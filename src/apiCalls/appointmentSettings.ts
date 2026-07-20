import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

export type SlotType = "daily" | "weekly";

export interface AppointmentSlot {
  _id: string;
  doctorId: string;
  doctorName: string;
  slotType: SlotType;
  date?: string | null;
  dateKey?: string | null;
  appliesOnDateKey?: string | null;
  weekday?: number | null;
  startTime: string;
  endTime: string;
  maximumPatients: number;
  timeSlots?: Array<{
    startTime: string;
    endTime: string;
    maximumPatients: number;
  }>;
  weeklyDays?: Array<{
    date: string;
    dateKey?: string | null;
    weekday: number;
    timeSlots: Array<{
      startTime: string;
      endTime: string;
      maximumPatients: number;
    }>;
  }>;
  appointmentPrice: number;
  slotDurationMinutes: number;
  bookingCloseMinutesBeforeEnd?: number;
  bookingCloseTime?: string;
  bookingCloseAt?: string | Date;
  isActive: boolean;
  bookedCount?: number;
  remainingPatients?: number;
  isFull?: boolean;
  isExpired?: boolean;
  startTimePassed?: boolean;
  isAvailable?: boolean;
  disabledReason?: string;
}

export interface AppointmentSlotPayload {
  doctorId: string;
  slotType: SlotType;
  date?: string;
  weekday?: number;
  startTime: string;
  endTime: string;
  maximumPatients: number;
  timeSlots?: Array<{
    startTime: string;
    endTime: string;
    maximumPatients: number;
  }>;
  weeklyDays?: Array<{
    date: string;
    weekday: number;
    timeSlots: Array<{
      startTime: string;
      endTime: string;
      maximumPatients: number;
    }>;
  }>;
  appointmentPrice: number;
  slotDurationMinutes: number;
  bookingCloseMinutesBeforeEnd: number;
  isActive: boolean;
}

export async function getAppointmentSlotsApi(params?: {
  doctorId?: string;
  slotType?: SlotType | "all";
  status?: "all" | "active" | "inactive";
  date?: string;
}): Promise<AppointmentSlot[]> {
  try {
    const res = await get(ENDPOINT.GET_APPOINTMENT_SLOTS, {
      params,
      needAuth: true,
    });
    return res.data.slots ?? [];
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to fetch appointment slots");
  }
}

export async function addAppointmentSlotApi(
  payload: AppointmentSlotPayload,
): Promise<AppointmentSlot> {
  try {
    const res = await post(ENDPOINT.ADD_APPOINTMENT_SLOT, payload, {
      needAuth: true,
    });
    return res.data.slot;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to create appointment slot");
  }
}

export async function updateAppointmentSlotApi(
  id: string,
  payload: AppointmentSlotPayload,
): Promise<AppointmentSlot> {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_APPOINTMENT_SLOT}/${id}`,
      payload,
      {
        needAuth: true,
      },
    );
    return res.data.slot;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to update appointment slot");
  }
}

export async function deleteAppointmentSlotApi(id: string): Promise<void> {
  try {
    await post(`${ENDPOINT.DELETE_APPOINTMENT_SLOT}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to delete appointment slot");
  }
}
