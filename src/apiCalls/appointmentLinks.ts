import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import { createApiRequestError } from "@/lib/api-errors";

// ─── Types ─────────────────────────────────────────────────────────────

export interface AppointmentLink {
  _id: string;
  title: string;
  subtitle?: string;
  link: string;
  doctorId: string;
  doctorName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentLinkPayload {
  title: string;
  subtitle?: string;
  link: string;
  doctorId: string;
  isActive: boolean;
}

export interface GetAppointmentLinksParams {
  doctorId?: string;
  isActive?: boolean;
}

// ─── API Calls ─────────────────────────────────────────────────────────

export async function getAppointmentLinksApi(
  params?: GetAppointmentLinksParams,
): Promise<AppointmentLink[]> {
  try {
    const res = await get(ENDPOINT.GET_APPOINTMENT_LINKS, {
      params,
      needAuth: true,
    });
    return res.data.appointmentLinks ?? [];
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to fetch appointment links");
  }
}

export async function addAppointmentLinkApi(
  payload: AppointmentLinkPayload,
): Promise<AppointmentLink> {
  try {
    const res = await post(ENDPOINT.ADD_APPOINTMENT_LINK, payload, {
      needAuth: true,
    });
    return res.data.appointmentLink;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to create appointment link");
  }
}

export async function updateAppointmentLinkApi(
  id: string,
  payload: AppointmentLinkPayload,
): Promise<AppointmentLink> {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_APPOINTMENT_LINK}/${id}`,
      payload,
      {
        needAuth: true,
      },
    );
    return res.data.appointmentLink;
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to update appointment link");
  }
}

export async function deleteAppointmentLinkApi(id: string): Promise<void> {
  try {
    await post(`${ENDPOINT.DELETE_APPOINTMENT_LINK}/${id}`, undefined, {
      needAuth: true,
    });
  } catch (error: any) {
    throw createApiRequestError(error, "Failed to delete appointment link");
  }
}
