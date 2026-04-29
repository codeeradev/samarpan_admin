import type {
  Admin,
  Appointment,
  ContentAbout,
  ContentBanner,
  Doctor,
  Enquiry,
  ManagedUser,
  Patient,
  Service,
} from "@/types";

// ─── Mock Doctors ────────────────────────────────────────────────────────────

export const mockDoctors: Doctor[] = [
  {
    id: "d1",
    name: "Dr. Rajesh Sharma",
    specialization: "Cardiologist",
    experience: 15,
    profileImage: "/assets/images/doctor-placeholder.svg",
    availability: "available",
    email: "rajesh.sharma@samarpan.com",
    phone: "+91 98765 43210",
    qualification: "MD, DM Cardiology",
    department: "Cardiology",
  },
  {
    id: "d2",
    name: "Dr. Priya Mehta",
    specialization: "Gynecologist",
    experience: 12,
    profileImage: "/assets/images/doctor-placeholder.svg",
    availability: "available",
    email: "priya.mehta@samarpan.com",
    phone: "+91 98765 43211",
    qualification: "MD, DGO",
    department: "Gynecology",
  },
  {
    id: "d3",
    name: "Dr. Anil Kumar",
    specialization: "Orthopedic Surgeon",
    experience: 18,
    profileImage: "/assets/images/doctor-placeholder.svg",
    availability: "busy",
    email: "anil.kumar@samarpan.com",
    phone: "+91 98765 43212",
    qualification: "MS Orthopedics",
    department: "Orthopedics",
  },
  {
    id: "d4",
    name: "Dr. Sunita Patel",
    specialization: "Pediatrician",
    experience: 10,
    profileImage: "/assets/images/doctor-placeholder.svg",
    availability: "available",
    email: "sunita.patel@samarpan.com",
    phone: "+91 98765 43213",
    qualification: "MD Pediatrics",
    department: "Pediatrics",
  },
  {
    id: "d5",
    name: "Dr. Vikram Singh",
    specialization: "Neurologist",
    experience: 20,
    profileImage: "/assets/images/doctor-placeholder.svg",
    availability: "on-leave",
    email: "vikram.singh@samarpan.com",
    phone: "+91 98765 43214",
    qualification: "MD, DM Neurology",
    department: "Neurology",
  },
  {
    id: "d6",
    name: "Dr. Meera Gupta",
    specialization: "Dermatologist",
    experience: 8,
    profileImage: "/assets/images/doctor-placeholder.svg",
    availability: "available",
    email: "meera.gupta@samarpan.com",
    phone: "+91 98765 43215",
    qualification: "MD Dermatology",
    department: "Dermatology",
  },
  {
    id: "d7",
    name: "Dr. Suresh Nair",
    specialization: "ENT Specialist",
    experience: 14,
    profileImage: "/assets/images/doctor-placeholder.svg",
    availability: "available",
    email: "suresh.nair@samarpan.com",
    phone: "+91 98765 43216",
    qualification: "MS ENT",
    department: "ENT",
  },
  {
    id: "d8",
    name: "Dr. Kavitha Reddy",
    specialization: "Ophthalmologist",
    experience: 11,
    profileImage: "/assets/images/doctor-placeholder.svg",
    availability: "busy",
    email: "kavitha.reddy@samarpan.com",
    phone: "+91 98765 43217",
    qualification: "MS Ophthalmology",
    department: "Ophthalmology",
  },
  {
    id: "d9",
    name: "Dr. Ramesh Iyer",
    specialization: "General Surgeon",
    experience: 16,
    profileImage: "/assets/images/doctor-placeholder.svg",
    availability: "available",
    email: "ramesh.iyer@samarpan.com",
    phone: "+91 98765 43218",
    qualification: "MS General Surgery",
    department: "Surgery",
  },
  {
    id: "d10",
    name: "Dr. Anjali Bose",
    specialization: "Psychiatrist",
    experience: 9,
    profileImage: "/assets/images/doctor-placeholder.svg",
    availability: "available",
    email: "anjali.bose@samarpan.com",
    phone: "+91 98765 43219",
    qualification: "MD Psychiatry",
    department: "Psychiatry",
  },
];

// ─── Mock Patients ───────────────────────────────────────────────────────────

export const mockPatients: Patient[] = [
  {
    id: "p1",
    name: "Arjun Verma",
    phone: "+91 91234 56789",
    age: 45,
    gender: "male",
    address: "12, MG Road, Bangalore",
    email: "arjun.v@email.com",
    bloodGroup: "B+",
    medicalHistory: "Hypertension, Type 2 Diabetes",
    registeredAt: "2024-01-15",
  },
  {
    id: "p2",
    name: "Lakshmi Rajan",
    phone: "+91 91234 56790",
    age: 32,
    gender: "female",
    address: "45, Anna Nagar, Chennai",
    email: "lakshmi.r@email.com",
    bloodGroup: "O+",
    registeredAt: "2024-02-20",
  },
  {
    id: "p3",
    name: "Mohit Agarwal",
    phone: "+91 91234 56791",
    age: 28,
    gender: "male",
    address: "7, Karol Bagh, Delhi",
    email: "mohit.a@email.com",
    bloodGroup: "A+",
    medicalHistory: "Asthma",
    registeredAt: "2024-03-05",
  },
  {
    id: "p4",
    name: "Divya Krishnan",
    phone: "+91 91234 56792",
    age: 55,
    gender: "female",
    address: "23, Banjara Hills, Hyderabad",
    email: "divya.k@email.com",
    bloodGroup: "AB-",
    medicalHistory: "Arthritis",
    registeredAt: "2024-03-18",
  },
  {
    id: "p5",
    name: "Rahul Desai",
    phone: "+91 91234 56793",
    age: 38,
    gender: "male",
    address: "11, Koregaon Park, Pune",
    email: "rahul.d@email.com",
    bloodGroup: "O-",
    registeredAt: "2024-04-01",
  },
  {
    id: "p6",
    name: "Pooja Sharma",
    phone: "+91 91234 56794",
    age: 26,
    gender: "female",
    address: "88, Civil Lines, Jaipur",
    email: "pooja.s@email.com",
    bloodGroup: "B-",
    registeredAt: "2024-04-12",
  },
  {
    id: "p7",
    name: "Sandeep Kumar",
    phone: "+91 91234 56795",
    age: 62,
    gender: "male",
    address: "3, Salt Lake, Kolkata",
    email: "sandeep.k@email.com",
    bloodGroup: "A-",
    medicalHistory: "Coronary Artery Disease",
    registeredAt: "2024-05-02",
  },
  {
    id: "p8",
    name: "Nisha Pillai",
    phone: "+91 91234 56796",
    age: 41,
    gender: "female",
    address: "60, Fort Kochi, Kerala",
    email: "nisha.p@email.com",
    bloodGroup: "O+",
    registeredAt: "2024-05-14",
  },
  {
    id: "p9",
    name: "Aakash Tiwari",
    phone: "+91 91234 56797",
    age: 19,
    gender: "male",
    address: "15, Gomti Nagar, Lucknow",
    email: "aakash.t@email.com",
    bloodGroup: "B+",
    registeredAt: "2024-06-01",
  },
  {
    id: "p10",
    name: "Shalini Mishra",
    phone: "+91 91234 56798",
    age: 35,
    gender: "female",
    address: "72, Aundh, Pune",
    email: "shalini.m@email.com",
    bloodGroup: "AB+",
    registeredAt: "2024-06-20",
  },
  {
    id: "p11",
    name: "Varun Joshi",
    phone: "+91 91234 56799",
    age: 50,
    gender: "male",
    address: "6, Indiranagar, Bangalore",
    email: "varun.j@email.com",
    bloodGroup: "A+",
    medicalHistory: "Hypertension",
    registeredAt: "2024-07-08",
  },
  {
    id: "p12",
    name: "Rekha Nambiar",
    phone: "+91 91234 56800",
    age: 44,
    gender: "female",
    address: "34, Calicut, Kerala",
    email: "rekha.n@email.com",
    bloodGroup: "O+",
    registeredAt: "2024-08-01",
  },
];

// ─── Mock Appointments ───────────────────────────────────────────────────────

export const mockAppointments: Appointment[] = [
  {
    _id: "a1",
    fullName: "Arjun Verma",
    email: "arjun@example.com",
    phoneNumber: "+91-9876543210",
    doctorId: "d1",
    doctorName: "Dr. Rajesh Sharma",
    serviceName: "Cardiology",
    serviceId: "s1",
    appointmentDate: "2025-04-15T10:00:00Z",
    reason: "Chest pain follow-up",
    status: "confirmed",
  },
  {
    _id: "a2",
    fullName: "Lakshmi Rajan",
    email: "lakshmi@example.com",
    phoneNumber: "+91-9876543211",
    doctorId: "d2",
    doctorName: "Dr. Priya Mehta",
    serviceName: "Gynecology",
    serviceId: "s2",
    appointmentDate: "2025-04-15T11:30:00Z",
    reason: "Routine checkup",
    status: "pending",
  },
  {
    _id: "a3",
    fullName: "Mohit Agarwal",
    email: "mohit@example.com",
    phoneNumber: "+91-9876543212",
    doctorId: "d3",
    doctorName: "Dr. Anil Kumar",
    serviceName: "Orthopedics",
    serviceId: "s3",
    appointmentDate: "2025-04-14T09:00:00Z",
    reason: "Knee pain consultation",
    status: "completed",
  },
  {
    _id: "a4",
    fullName: "Divya Krishnan",
    email: "divya@example.com",
    phoneNumber: "+91-9876543213",
    doctorId: "d4",
    doctorName: "Dr. Sunita Patel",
    serviceName: "Pediatrics",
    serviceId: "s4",
    appointmentDate: "2025-04-16T14:00:00Z",
    reason: "Child vaccination",
    status: "confirmed",
  },
  {
    _id: "a5",
    fullName: "Rahul Desai",
    email: "rahul@example.com",
    phoneNumber: "+91-9876543214",
    doctorId: "d7",
    doctorName: "Dr. Suresh Nair",
    serviceName: "ENT",
    serviceId: "s5",
    appointmentDate: "2025-04-17T15:30:00Z",
    reason: "Hearing loss evaluation",
    status: "pending",
  },
];

// ─── Mock Services ───────────────────────────────────────────────────────────

export const mockServices: Service[] = [
  {
    id: "s1",
    name: "Emergency Care",
    description:
      "24/7 emergency medical care with fully equipped trauma units and rapid response teams.",
    image: "/assets/images/service-placeholder.svg",
    price: 2500,
    category: "Emergency",
    isActive: true,
  },
  {
    id: "s2",
    name: "Cardiac Surgery",
    description:
      "Advanced cardiac procedures including bypass surgery, valve replacement, and angioplasty.",
    image: "/assets/images/service-placeholder.svg",
    price: 150000,
    category: "Surgery",
    isActive: true,
  },
  {
    id: "s3",
    name: "Maternity & Delivery",
    description:
      "Comprehensive maternity care from prenatal consultations to safe delivery and postnatal support.",
    image: "/assets/images/service-placeholder.svg",
    price: 35000,
    category: "Maternity",
    isActive: true,
  },
  {
    id: "s4",
    name: "Diagnostic Imaging",
    description:
      "State-of-the-art MRI, CT scan, X-ray, and ultrasound services with same-day reports.",
    image: "/assets/images/service-placeholder.svg",
    price: 3500,
    category: "Diagnostics",
    isActive: true,
  },
  {
    id: "s5",
    name: "Orthopedic Care",
    description:
      "Joint replacements, fracture management, and sports injury rehabilitation programs.",
    image: "/assets/images/service-placeholder.svg",
    price: 80000,
    category: "Surgery",
    isActive: true,
  },
  {
    id: "s6",
    name: "Pediatrics",
    description:
      "Specialized child healthcare including vaccinations, growth monitoring, and pediatric surgery.",
    image: "/assets/images/service-placeholder.svg",
    price: 800,
    category: "Pediatrics",
    isActive: true,
  },
  {
    id: "s7",
    name: "Mental Health Clinic",
    description:
      "Confidential psychiatric consultations, therapy sessions, and addiction recovery programs.",
    image: "/assets/images/service-placeholder.svg",
    price: 1500,
    category: "Psychiatry",
    isActive: true,
  },
  {
    id: "s8",
    name: "Eye Care Center",
    description:
      "Complete ophthalmology services including LASIK surgery, cataract removal, and retinal treatments.",
    image: "/assets/images/service-placeholder.svg",
    price: 5000,
    category: "Ophthalmology",
    isActive: true,
  },
  {
    id: "s9",
    name: "Physiotherapy",
    description:
      "Expert physiotherapy and rehabilitation for post-surgical recovery, sports injuries, and chronic pain.",
    image: "/assets/images/service-placeholder.svg",
    price: 1200,
    category: "Rehabilitation",
    isActive: true,
  },
  {
    id: "s10",
    name: "Laboratory Services",
    description:
      "Accredited pathology laboratory offering 500+ diagnostic tests with online reports.",
    image: "/assets/images/service-placeholder.svg",
    price: 500,
    category: "Diagnostics",
    isActive: false,
  },
];

// ─── Mock Enquiries ───────────────────────────────────────────────────────────

export const mockEnquiries: Enquiry[] = [
  {
    id: "e1",
    name: "Ravi Shankar",
    email: "ravi.s@email.com",
    phone: "+91 90000 11111",
    subject: "Appointment Booking",
    message:
      "I would like to book an appointment with a cardiologist at the earliest.",
    status: "new",
    submittedAt: "2025-04-13T09:30:00Z",
  },
  {
    id: "e2",
    name: "Fatima Begum",
    email: "fatima.b@email.com",
    phone: "+91 90000 22222",
    subject: "Insurance Query",
    message:
      "Do you accept HDFC ERGO health insurance? Need cashless treatment information.",
    status: "in-progress",
    submittedAt: "2025-04-12T14:15:00Z",
  },
  {
    id: "e3",
    name: "Amit Chopra",
    email: "amit.c@email.com",
    phone: "+91 90000 33333",
    subject: "Reports Not Received",
    message:
      "I visited on April 8th but have not received my blood test reports yet.",
    status: "resolved",
    submittedAt: "2025-04-10T10:00:00Z",
  },
  {
    id: "e4",
    name: "Sneha Patil",
    email: "sneha.p@email.com",
    phone: "+91 90000 44444",
    subject: "Service Inquiry",
    message: "What is the cost of a full body health checkup package?",
    status: "new",
    submittedAt: "2025-04-13T11:45:00Z",
  },
  {
    id: "e5",
    name: "Deepak Malhotra",
    email: "deepak.m@email.com",
    phone: "+91 90000 55555",
    subject: "Feedback",
    message:
      "Excellent care by Dr. Priya Mehta. Very professional and empathetic. Thank you!",
    status: "resolved",
    submittedAt: "2025-04-11T16:30:00Z",
  },
  {
    id: "e6",
    name: "Anita Desai",
    email: "anita.d@email.com",
    phone: "+91 90000 66666",
    subject: "Ambulance Service",
    message:
      "Is 24/7 ambulance service available? What is the procedure to request one?",
    status: "in-progress",
    submittedAt: "2025-04-09T08:00:00Z",
  },
  {
    id: "e7",
    name: "Naresh Kumar",
    email: "naresh.k@email.com",
    phone: "+91 90000 77777",
    subject: "Visiting Hours",
    message:
      "Can you please share the ICU visiting hours and patient ward visiting policy?",
    status: "new",
    submittedAt: "2025-04-14T07:30:00Z",
  },
  {
    id: "e8",
    name: "Preethi Nair",
    email: "preethi.n@email.com",
    phone: "+91 90000 88888",
    subject: "Cancellation Request",
    message:
      "I need to cancel my appointment scheduled for April 16. Booking ID: A-2045.",
    status: "resolved",
    submittedAt: "2025-04-12T13:00:00Z",
  },
];

// ─── Mock Content ─────────────────────────────────────────────────────────────

export const mockBanners: ContentBanner[] = [
  {
    id: "b1",
    title: "Your Health, Our Priority",
    subtitle: "World-class medical care with compassion and expertise.",
    ctaText: "Book Appointment",
    ctaLink: "/appointment",
    imageUrl: "/assets/images/banner-placeholder.svg",
    isActive: true,
  },
  {
    id: "b2",
    title: "Advanced Cardiac Care",
    subtitle: "Expert heart specialists with state-of-the-art technology.",
    ctaText: "Learn More",
    ctaLink: "/cardiology",
    imageUrl: "/assets/images/banner-placeholder.svg",
    isActive: false,
  },
];

export const mockAbout: ContentAbout = {
  heading: "About Samarpan Hospital",
  description:
    "Samarpan Hospital has been serving the community for over 25 years, providing exceptional medical care with a patient-centric approach. Our team of 200+ specialists is dedicated to delivering the highest standard of healthcare.",
  mission:
    "To provide accessible, affordable, and high-quality healthcare services to all patients with compassion and integrity.",
  vision:
    "To be the most trusted healthcare institution in the region, known for clinical excellence and patient satisfaction.",
  imageUrl: "/assets/images/about-placeholder.svg",
  stats: [
    { label: "Years of Service", value: "25+" },
    { label: "Specialist Doctors", value: "200+" },
    { label: "Happy Patients", value: "1L+" },
    { label: "Beds", value: "500+" },
  ],
};

// ─── Mock Admin ───────────────────────────────────────────────────────────────

export const mockAdmin: Admin = {
  id: "admin1",
  name: "Suresh Menon",
  email: "admin@samarpan.com",
  role: "super-admin",
  avatar: "",
};

// ─── Mock Managed Users (Role Management) ─────────────────────────────────────

const INITIAL_MANAGED_USERS: ManagedUser[] = [
  {
    id: "u1",
    name: "Suresh Menon",
    email: "admin@samarpan.com",
    role: "super-admin",
    joinedDate: "2022-01-10",
  },
  {
    id: "u2",
    name: "Anjana Krishnan",
    email: "anjana.k@samarpan.com",
    role: "super-admin",
    joinedDate: "2022-03-15",
  },
  {
    id: "u3",
    name: "Dr. Rajesh Sharma",
    email: "doctor@samarpan.com",
    role: "doctor",
    joinedDate: "2022-06-01",
  },
  {
    id: "u4",
    name: "Dr. Priya Mehta",
    email: "priya.mehta@samarpan.com",
    role: "doctor",
    joinedDate: "2023-01-20",
  },
  {
    id: "u5",
    name: "Priya Nair",
    email: "receptionist@samarpan.com",
    role: "receptionist",
    joinedDate: "2023-04-05",
  },
  {
    id: "u6",
    name: "Sonal Desai",
    email: "sonal.d@samarpan.com",
    role: "receptionist",
    joinedDate: "2023-07-12",
  },
  {
    id: "u7",
    name: "Kavitha Iyer",
    email: "nurse@samarpan.com",
    role: "nurse",
    joinedDate: "2023-09-01",
  },
  {
    id: "u8",
    name: "Meena Rao",
    email: "meena.rao@samarpan.com",
    role: "nurse",
    joinedDate: "2024-02-14",
  },
];

// Mutable in-memory store — changes persist during session
export const managedUsersStore: ManagedUser[] = [...INITIAL_MANAGED_USERS];

export const mockManagedUsers: ManagedUser[] = INITIAL_MANAGED_USERS;

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  totalDoctors: number;
  totalRevenue: number;
  appointmentTrends: {
    month: string;
    appointments: number;
    consultations: number;
  }[];
  patientGrowth: { age: string; count: number }[];
}

export const mockDashboardStats: DashboardStats = {
  totalPatients: 14352,
  totalAppointments: 1288,
  totalDoctors: 84,
  totalRevenue: 348760,
  appointmentTrends: [
    { month: "Jan", appointments: 60, consultations: 30 },
    { month: "Feb", appointments: 90, consultations: 55 },
    { month: "Mar", appointments: 85, consultations: 60 },
    { month: "Apr", appointments: 100, consultations: 70 },
    { month: "May", appointments: 130, consultations: 80 },
    { month: "Jun", appointments: 155, consultations: 90 },
    { month: "Jul", appointments: 120, consultations: 75 },
    { month: "Aug", appointments: 135, consultations: 85 },
    { month: "Sep", appointments: 115, consultations: 65 },
    { month: "Oct", appointments: 100, consultations: 60 },
    { month: "Nov", appointments: 190, consultations: 95 },
    { month: "Dec", appointments: 160, consultations: 80 },
  ],
  patientGrowth: [
    { age: "0-10", count: 52 },
    { age: "10-19", count: 76 },
    { age: "20-39", count: 64 },
    { age: "30-44", count: 92 },
    { age: "50-64", count: 70 },
    { age: "55+", count: 83 },
  ],
};

// ─── Simulated Async Fetchers ─────────────────────────────────────────────────

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchDoctors(): Promise<Doctor[]> {
  await delay(500);
  return [...mockDoctors];
}

export async function fetchPatients(): Promise<Patient[]> {
  await delay(500);
  return [...mockPatients];
}

export async function fetchAppointments(): Promise<Appointment[]> {
  await delay(500);
  return [...mockAppointments];
}

export async function fetchServices(): Promise<Service[]> {
  await delay(500);
  return [...mockServices];
}

export async function fetchEnquiries(): Promise<Enquiry[]> {
  await delay(500);
  return [...mockEnquiries];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  await delay(500);
  return { ...mockDashboardStats };
}

export async function fetchManagedUsers(): Promise<ManagedUser[]> {
  await delay(400);
  return [...managedUsersStore];
}
