import AdminLayout from "@/layouts/AdminLayout";
import { canAccessPath } from "@/lib/admin-access";
import { loadAuthState } from "@/lib/auth-storage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import CareerManagementPage from "@/pages/CareerManagementPage";
import DashboardPage from "@/pages/DashboardPage";
import DoctorsPage from "@/pages/DoctorsPage";
// import EnquiriesPage from "@/pages/EnquiriesPage";
import GalleryPage from "@/pages/GalleryPage";
import HonorsPage from "@/pages/HonorsPage";
import LeadsPage from "@/pages/LeadsPage";
import LoginPage from "@/pages/LoginPage";
import MetaAnalyticsPage from "@/pages/MetaAnalyticsPage";
import MetaCallbackPage from "@/pages/MetaCallbackPage";
import PagesPage from "@/pages/PagesPage";
import PatientsPage from "@/pages/PatientsPage";
import ReviewsAndShortsPage from "@/pages/ReviewsAndShortsPage";
import RoleManagementPage from "@/pages/RoleManagementPage";
import ServiceFeaturesPage from "@/pages/ServiceFeaturesPage";
import ServiceManagementPage from "@/pages/ServiceManagementPage";
import ServiceSubCategoriesPage from "@/pages/ServiceSubCategoriesPage";
import SettingsPage from "@/pages/SettingsPage";
import SlotManagementPage from "@/pages/SlotManagementPage";
import ThemePage from "@/pages/ThemePage";
import TPAPage from "@/pages/TPAPage";
import WebsiteContentPage from "@/pages/WebsiteContentPage";

import JobApplicationsPage from "@/pages/JobApplicationsPage";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import BlogCategoryPage from "./pages/BlogCategoryPage";
import BlogsPage from "./pages/BlogPage";
import ProcedurePage from "./pages/ProcedurePage";
import SeoReportPage from "./pages/SeoReportPage";
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

const metaAnalyticsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/meta-analytics",
  beforeLoad: () => checkPermission("/meta-analytics"),
  component: MetaAnalyticsPage,
});

const seoReportRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/seo-report",
  beforeLoad: () => checkPermission("/seo-report"),
  component: SeoReportPage,
});

const metaCallbackRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/meta/callback",
  beforeLoad: () => checkPermission("/meta-analytics"),
  component: MetaCallbackPage,
});

const leadsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/leads",
  beforeLoad: () => checkPermission("/leads"),
  component: LeadsPage,
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

const procedureRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/procedures",
  beforeLoad: () => checkPermission("/procedures"),
  component: ProcedurePage,
});

const appointmentsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/appointments",
  beforeLoad: () => checkPermission("/appointments"),
  component: AppointmentsPage,
});

const slotManagementRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/slot-management",
  beforeLoad: () => checkPermission("/slot-management"),
  component: SlotManagementPage,
});

const serviceManagementRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/service-management",
  beforeLoad: () => checkPermission("/service-management"),
  component: ServiceManagementPage,
});

const serviceFeaturesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/service-category",
  beforeLoad: () => checkPermission("/service-features"),
  component: ServiceFeaturesPage,
});

const serviceSubCategoryRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/service-sub-category",
  beforeLoad: () => checkPermission("/service-features"),
  component: ServiceSubCategoriesPage,
});

const blogsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/blogs",
  beforeLoad: () => checkPermission("/blogs"),
  component: BlogsPage,
});

const blogCategoryRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/blog-category",
  beforeLoad: () => checkPermission("/blogs"),
  component: BlogCategoryPage,
});

const galleryRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/gallery",
  beforeLoad: () => checkPermission("/gallery"),
  component: GalleryPage,
});

const tpaRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/tpa",
  beforeLoad: () => checkPermission("/tpa"),
  component: TPAPage,
});

const reviewsAndShortsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/shorts",
  beforeLoad: () => checkPermission("/reviews-shorts"),
  component: ReviewsAndShortsPage,
});

const themeRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/themes",
  beforeLoad: () => checkPermission("/themes"),
  component: ThemePage,
});

const jobApplicationsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,

  path: "/job-applications",

  beforeLoad: () => checkPermission("/job-applications"),

  component: JobApplicationsPage,
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
    metaAnalyticsRoute,
    seoReportRoute,
    metaCallbackRoute,
    leadsRoute,
    doctorsRoute,
    specializationsRoute,
    honorsRoute,
    patientsRoute,
    procedureRoute,
    appointmentsRoute,
    slotManagementRoute,
    serviceManagementRoute,
    serviceFeaturesRoute,
    serviceSubCategoryRoute,
    blogsRoute,
    blogCategoryRoute,
    galleryRoute,
    tpaRoute,
    reviewsAndShortsRoute,
    jobApplicationsRoute,
    themeRoute,
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
