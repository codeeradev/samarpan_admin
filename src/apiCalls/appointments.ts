// src/apis/appointments.ts

import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";

// ─── Types ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected"
  | "rescheduled";

export interface Appointment {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  doctorName: string;
  doctorId?: string | null;
  serviceName: string;
  serviceId?: string | null;
  appointmentDate: Date | string;
  preferredDate?: Date | string;
  reason?: string;
  notes?: string;
  rescheduleReason?: string;
  status: AppointmentStatus;
  approvedAt?: Date | string | null;
  rescheduledAt?: Date | string | null;
  rejectedAt?: Date | string | null;
  rejectionReason?: string;
  completedAt?: Date | string | null;
  updatedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface GetAppointmentsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface GetAppointmentsResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
}

// ─── API Calls ─────────────────────────────────────────────────────────

// GET /appointments
export const getAppointmentsApi = async (
  params: GetAppointmentsParams,
): Promise<GetAppointmentsResponse> => {
  const response = await get(ENDPOINT.GET_APPOINTMENTS, {
    params,
    needAuth: true,
  });

  return response.data;
};

// POST /appointments/update/:id
export const updateAppointmentApi = async (
  id: string,
  payload: {
    action: "approve" | "reject" | "complete" | "reschedule";
    appointmentDate?: string;
    rescheduleReason?: string;
    notes?: string;
  },
) => {
  const response = await post(
    `${ENDPOINT.UPDATE_APPOINTMENT}/${id}`,
    payload,
    {needAuth: true}
  );

  return response.data;
};