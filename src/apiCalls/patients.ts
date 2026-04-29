import { get, post } from "@/apis/apiClient";
import { ENDPOINT } from "@/apis/endpoint";
import type { PatientGender } from "@/types";

export interface PatientPayload {
  name: string;
  phone: string;
  age: number;
  gender: PatientGender;
  address: string;
  bloodGroup: string;
  medicalHistory?: string;
}

export interface PatientItem {
  _id: string;
  name?: string;
  phone?: number | string;
  age?: number | null;
  gender?: PatientGender | null;
  address?: string;
  email?: string;
  bloodGroup?: string;
  medicalHistory?: string;
  status?: boolean;
  isActive?: boolean;
  dischargedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export const getAllPatientsApi = async (): Promise<PatientItem[]> => {
  try {
    const res = await get(ENDPOINT.GET_ALL_PATIENTS, { needAuth: true });
    return res?.data?.patients ?? [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to fetch patients");
  }
};

export const updatePatientApi = async (
  id: string,
  payload: PatientPayload,
): Promise<PatientItem> => {
  try {
    const res = await post(
      `${ENDPOINT.UPDATE_PATIENT}/${id}`,
      {
        ...payload,
        phone: normalizePhone(payload.phone),
      },
      { needAuth: true },
    );

    return res?.data?.patient;
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to update patient");
  }
};

export const dischargePatientApi = async (
  id: string,
): Promise<PatientItem> => {
  try {
    const res = await post(`${ENDPOINT.DISCHARGE_PATIENT}/${id}`, undefined, {
      needAuth: true,
    });

    return res?.data?.patient;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ?? "Failed to discharge patient",
    );
  }
};
