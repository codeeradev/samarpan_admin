import AdminLayout from "@/layouts/AdminLayout";
import AppointmentsPage from "@/pages/AppointmentsPage";
import CareerManagementPage from "@/pages/CareerManagementPage";
import DashboardPage from "@/pages/DashboardPage";
import DoctorsPage from "@/pages/DoctorsPage";
// import EnquiriesPage from "@/pages/EnquiriesPage";
import GalleryPage from "@/pages/GalleryPage";
import HonorsPage from "@/pages/HonorsPage";
import LoginPage from "@/pages/LoginPage";
import PatientsPage from "@/pages/PatientsPage";
import ReviewsAndShortsPage from "@/pages/ReviewsAndShortsPage";
import RoleManagementPage from "@/pages/RoleManagementPage";
import ServiceManagementPage from "@/pages/ServiceManagementPage";
import SettingsPage from "@/pages/SettingsPage";
import PagesPage from "@/pages/PagesPage";
import WebsiteContentPage from "@/pages/WebsiteContentPage";
import { loadAuthState } from "@/lib/auth-storage";
import { canAccessPath } from "@/lib/admin-access";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import BlogsPage from "./pages/BlogPage";
import SpecializationsPage from "./pages/Specialization";

// ─── Auth helpers ─────────────────────────────────────────────────────────────

type StoredAuth = ReturnType<typeof loadAuthState>;

function getAuthState(): StoredAuth {
  return loadAuthState();
}

function getIsAuthenticated(): boolean {
  return !!getAuthState().isAuthenticated;
}

function checkPermission(path: string): void {
  if (!getIsAuthenticated()) {
    throw redirect({ to: "/" });
  }
  const state = getAuthState();
  if (!state.admin) {
    throw redirect({ to: "/" });
  }
  if (!canAccessPath(state.admin, path)) {
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

const specializationsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/specializations",
  beforeLoad: () => checkPermission("/specializations"),
  component: SpecializationsPage,
});

const honorsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/honors",
  beforeLoad: () => checkPermission("/honors"),
  component: HonorsPage,
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
  path: "/shorts",
  beforeLoad: () => checkPermission("/reviews-shorts"),
  component: ReviewsAndShortsPage,
});

const websiteContentRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/website-content",
  beforeLoad: () => checkPermission("/website-content"),
  component: WebsiteContentPage,
});

const websitePagesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/website-pages",
  beforeLoad: () => checkPermission("/website-pages"),
  component: PagesPage,
});

const careersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/careers",
  beforeLoad: () => checkPermission("/careers"),
  component: CareerManagementPage,
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
    specializationsRoute,
    honorsRoute,
    patientsRoute,
    appointmentsRoute,
    serviceManagementRoute,
    blogsRoute,
    galleryRoute,
    reviewsAndShortsRoute,
    websiteContentRoute,
    websitePagesRoute,
    careersRoute,
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
