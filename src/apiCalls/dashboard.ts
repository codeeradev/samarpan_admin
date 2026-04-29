import { get } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import type { Appointment } from "@/apiCalls/appointments";

export type DashboardResponse = {
  totals: {
    totalPatients: number;
    totalAppointments: number;
    appointmentsThisWeek: number;
    totalDoctors: number;
    totalServices: number;
    totalBlogs: number;
    totalGallery: number;
    totalReviews: number;
    totalShorts: number;
  };
  appointmentsByStatus: {
    pending: number;
    confirmed: number;
    rescheduled: number;
    completed: number;
    rejected: number;
    cancelled: number;
  };
  charts: {
    appointmentsLast7Days: { day: string; count: number }[];
    patientsLast6Months: { month: string; count: number }[];
  };
  recentAppointments: Appointment[];
  scope?: "doctor" | "admin";
};

export const getDashboardApi = async (): Promise<DashboardResponse> => {
  const response = await get(ENDPOINT.GET_DASHBOARD, { needAuth: true });
  return response.data;
};

