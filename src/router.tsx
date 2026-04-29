import AdminLayout from "@/layouts/AdminLayout";
import AppointmentsPage from "@/pages/AppointmentsPage";
import ContentPage from "@/pages/ContentPage";
import DashboardPage from "@/pages/DashboardPage";
import DoctorsPage from "@/pages/DoctorsPage";
// import EnquiriesPage from "@/pages/EnquiriesPage";
import LoginPage from "@/pages/LoginPage";
import PatientsPage from "@/pages/PatientsPage";
import ReviewsAndShortsPage from "@/pages/ReviewsAndShortsPage";
import RoleManagementPage from "@/pages/RoleManagementPage";
import ServiceManagementPage from "@/pages/ServiceManagementPage";
import SettingsPage from "@/pages/SettingsPage";
import GalleryPage from "@/pages/GalleryPage";
import { loadAuthState } from "@/lib/auth-storage";
import type { UserRole } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import BlogsPage from "./pages/BlogPage";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

interface StoredAuth {
  isAuthenticated?: boolean;
  admin?: { role?: string } | null;
}

function getAuthState(): StoredAuth {
  return loadAuthState();
}

function getIsAuthenticated(): boolean {
  return !!getAuthState().isAuthenticated;
}

function getUserRole(): UserRole | null {
  const state = getAuthState();
  return (state.admin?.role as UserRole) ?? null;
}

function checkPermission(path: string): void {
  if (!getIsAuthenticated()) {
    throw redirect({ to: "/" });
  }
  const role = getUserRole();
  if (!role) {
    throw redirect({ to: "/" });
  }
  const allowed = ROLE_PERMISSIONS[role] ?? [];
  if (!allowed.includes(path)) {
    throw redirect({ to: "/dashboard" });
  }
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// ─── Login ────────────────────────────────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    if (getIsAuthenticated()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

// ─── Protected Layout ─────────────────────────────────────────────────────────

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "admin",
  beforeLoad: () => {
    if (!getIsAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

// ─── Child Routes ─────────────────────────────────────────────────────────────

const dashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/dashboard",
  beforeLoad: () => checkPermission("/dashboard"),
  component: DashboardPage,
});

const doctorsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/doctors",
  beforeLoad: () => checkPermission("/doctors"),
  component: DoctorsPage,
});

const patientsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/patients",
  beforeLoad: () => checkPermission("/patients"),
  component: PatientsPage,
});

const appointmentsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/appointments",
  beforeLoad: () => checkPermission("/appointments"),
  component: AppointmentsPage,
});

const serviceManagementRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/service-management",
  beforeLoad: () => checkPermission("/service-management"),
  component: ServiceManagementPage,
});

const blogsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/blogs",
  beforeLoad: () => checkPermission("/blogs"),
  component: BlogsPage,
});

const galleryRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/gallery",
  beforeLoad: () => checkPermission("/gallery"),
  component: GalleryPage,
});

const reviewsAndShortsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/reviews-shorts",
  beforeLoad: () => checkPermission("/reviews-shorts"),
  component: ReviewsAndShortsPage,
});

const contentRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/content",
  beforeLoad: () => checkPermission("/content"),
  component: ContentPage,
});

// const enquiriesRoute = createRoute({
//   getParentRoute: () => adminLayoutRoute,
//   path: "/enquiries",
//   beforeLoad: () => checkPermission("/enquiries"),
//   component: EnquiriesPage,
// });

const settingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/settings",
  beforeLoad: () => checkPermission("/settings"),
  component: SettingsPage,
});

const rolesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/roles",
  beforeLoad: () => checkPermission("/roles"),
  component: RoleManagementPage,
});

// ─── Route Tree ───────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  loginRoute,
  adminLayoutRoute.addChildren([
    dashboardRoute,
    doctorsRoute,
    patientsRoute,
    appointmentsRoute,
    serviceManagementRoute,
    blogsRoute,
    galleryRoute,
    reviewsAndShortsRoute,
    contentRoute,
    // enquiriesRoute,
    settingsRoute,
    rolesRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
