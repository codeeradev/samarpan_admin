// ─── Doctor ────────────────────────────────────────────────────────────────

export type DoctorAvailability = "available" | "on-leave" | "busy";

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number; // years
  profileImage: string;
  availability: DoctorAvailability;
  email: string;
  phone: string;
  qualification: string;
  department: string;
  // Optional auth-related fields (used when doctors come from backend).
  roleId?: number;
  permissions?: Record<string, any>;
  mobile?: string;
}

// ─── Patient ───────────────────────────────────────────────────────────────

export type PatientGender = "male" | "female" | "other";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: PatientGender;
  address: string;
  email: string;
  bloodGroup: string;
  medicalHistory?: string;
  registeredAt: string; // ISO date string
}

// ─── Appointment ───────────────────────────────────────────────────────────

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

// ─── Service ────────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  description: string;
  image: File | string;
  price: number;
  category: string;
  isActive: boolean;
}

// ─── Enquiry ────────────────────────────────────────────────────────────────

export type EnquiryStatus = "new" | "in-progress" | "resolved";

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  submittedAt: string; // ISO date string
}

// ─── Content ────────────────────────────────────────────────────────────────

export interface ContentBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  isActive: boolean;
}

export interface ContentAbout {
  heading: string;
  description: string;
  mission: string;
  vision: string;
  imageUrl: string;
  stats: { label: string; value: string }[];
}

// ─── Role & Permissions ───────────────────────────────────────────────────────

export type UserRole = "super-admin" | "doctor" | "receptionist" | "nurse";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  "super-admin": [
    "/dashboard",
    "/doctors",
    "/patients",
    "/appointments",
    "/service-management",
    "/blogs",
    "/gallery",
    "/reviews-shorts",
    "/content",
    "/enquiries",
    "/settings",
    "/roles",
  ],
  doctor: ["/dashboard", "/patients", "/appointments"],
  receptionist: ["/dashboard", "/patients", "/appointments", "/enquiries"],
  nurse: ["/dashboard", "/patients"],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  "super-admin": "Super Admin",
  doctor: "Doctor",
  receptionist: "Receptionist",
  nurse: "Nurse",
};

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface Admin {
  id: string;
  name: string;
  roleId?: number;
  permissions?: Record<string, any>;
  email: string;
  mobile?: string;
  role: UserRole;
  avatar: string;
}

// ─── Managed User (Role Management page) ─────────────────────────────────────

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleId?: number;
  joinedDate: string; // ISO date string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getStatusColor(
  status: AppointmentStatus | EnquiryStatus | DoctorAvailability,
): string {
  const map: Record<string, string> = {
    pending: "yellow",
    confirmed: "blue",
    completed: "green",
    cancelled: "red",
    new: "orange",
    "in-progress": "blue",
    resolved: "teal",
    available: "green",
    "on-leave": "yellow",
    busy: "orange",
  };
  return map[status] ?? "gray";
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "TBD";
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return "TBD";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
