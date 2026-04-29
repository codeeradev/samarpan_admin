import type { Admin, UserRole } from "@/types";

export type PermissionKey =
  | "manage_services"
  | "view_services"
  | "manage_doctors"
  | "view_doctors"
  | "manage_reviews"
  | "view_reviews"
  | "manage_shorts"
  | "view_shorts"
  | "manage_appointments"
  | "view_appointments"
  | "manage_users"
  | "view_users"
  | "manage_blogs"
  | "view_blogs"
  | "manage_gallery"
  | "view_gallery"
  | "view_settings"
  | "manage_settings"
  | "view_admin_staff"
  | "manage_admin_staff";

export type PermissionRecord = Partial<Record<PermissionKey, boolean>>;

export const ROLE_ID_TO_USER_ROLE: Record<number, UserRole> = {
  1: "super-admin",
  2: "doctor",
  3: "nurse",
  4: "receptionist",
};

export const USER_ROLE_TO_ROLE_ID: Record<UserRole, number> = {
  "super-admin": 1,
  doctor: 2,
  nurse: 3,
  receptionist: 4,
};

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  manage_services: "Manage services",
  view_services: "View services",
  manage_doctors: "Manage doctors",
  view_doctors: "View doctors",
  manage_reviews: "Manage reviews",
  view_reviews: "View reviews",
  manage_shorts: "Manage shorts",
  view_shorts: "View shorts",
  manage_appointments: "Manage appointments",
  view_appointments: "View appointments",
  manage_users: "Manage patients",
  view_users: "View patients",
  manage_blogs: "Manage blogs",
  view_blogs: "View blogs",
  manage_gallery: "Manage gallery",
  view_gallery: "View gallery",
  view_settings: "View settings",
  manage_settings: "Manage settings",
  view_admin_staff: "View admin staff",
  manage_admin_staff: "Manage admin staff",
};

export const PERMISSION_GROUPS: Array<{
  title: string;
  description: string;
  permissions: PermissionKey[];
}> = [
  {
    title: "Staff & Access",
    description: "Control who can view staff members and manage role access.",
    permissions: ["view_admin_staff", "manage_admin_staff"],
  },
  {
    title: "Doctors",
    description: "Access doctor profiles and administrative doctor actions.",
    permissions: ["view_doctors", "manage_doctors"],
  },
  {
    title: "Patients",
    description: "Access patient records and patient management actions.",
    permissions: ["view_users", "manage_users"],
  },
  {
    title: "Appointments",
    description: "View appointment requests and update scheduling workflows.",
    permissions: ["view_appointments", "manage_appointments"],
  },
  {
    title: "Services",
    description: "Manage website service content and service visibility.",
    permissions: ["view_services", "manage_services"],
  },
  {
    title: "Reviews",
    description: "Control testimonial visibility and review moderation.",
    permissions: ["view_reviews", "manage_reviews"],
  },
  {
    title: "Shorts",
    description: "Control video shorts visibility and publishing.",
    permissions: ["view_shorts", "manage_shorts"],
  },
  {
    title: "Blogs",
    description: "Control blog visibility and publishing workflows.",
    permissions: ["view_blogs", "manage_blogs"],
  },
  {
    title: "Gallery",
    description: "Manage gallery uploads and media visibility.",
    permissions: ["view_gallery", "manage_gallery"],
  },
  {
    title: "Settings",
    description: "Access and update business settings and CMS settings.",
    permissions: ["view_settings", "manage_settings"],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(
  (group) => group.permissions,
);

const LEGACY_ROLE_FALLBACK_PATHS: Record<UserRole, string[]> = {
  "super-admin": [],
  doctor: ["/dashboard", "/patients", "/appointments"],
  receptionist: ["/dashboard", "/patients", "/appointments"],
  nurse: ["/dashboard", "/patients"],
};

const PATH_PERMISSION_RULES: Record<
  string,
  {
    permissions?: PermissionKey[];
    superAdminOnly?: boolean;
  }
> = {
  "/dashboard": {},
  "/doctors": { permissions: ["view_doctors", "manage_doctors"] },
  "/patients": { permissions: ["view_users", "manage_users"] },
  "/appointments": {
    permissions: ["view_appointments", "manage_appointments"],
  },
  "/service-management": {
    permissions: ["view_services", "manage_services"],
  },
  "/blogs": { permissions: ["view_blogs", "manage_blogs"] },
  "/gallery": { permissions: ["view_gallery", "manage_gallery"] },
  "/reviews-shorts": {
    permissions: [
      "view_reviews",
      "manage_reviews",
      "view_shorts",
      "manage_shorts",
    ],
  },
  "/website-content": { superAdminOnly: true },
  "/settings": { permissions: ["view_settings", "manage_settings"] },
  "/roles": {
    permissions: ["view_admin_staff", "manage_admin_staff"],
    superAdminOnly: true,
  },
};

function isPermissionKey(value: string): value is PermissionKey {
  return ALL_PERMISSION_KEYS.includes(value as PermissionKey);
}

export function normalizePermissions(
  value: unknown,
): Record<string, boolean> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, boolean>
  >((acc, [key, item]) => {
    acc[key] = item === true;
    return acc;
  }, {});
}

export function getRoleFromRoleId(roleId?: number | null): UserRole {
  return ROLE_ID_TO_USER_ROLE[roleId ?? 0] ?? "receptionist";
}

export function createPermissionTemplate(role: UserRole): PermissionRecord {
  switch (role) {
    case "doctor":
      return {
        view_users: true,
        view_appointments: true,
      };
    case "nurse":
      return {
        view_users: true,
        view_appointments: true,
      };
    case "receptionist":
      return {
        view_users: true,
        manage_users: true,
        view_appointments: true,
        manage_appointments: true,
      };
    case "super-admin":
      return ALL_PERMISSION_KEYS.reduce<PermissionRecord>((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
    default:
      return {};
  }
}

export function countEnabledPermissions(
  permissions?: Record<string, boolean> | null,
): number {
  return Object.values(permissions ?? {}).filter(Boolean).length;
}

export function setPermissionWithDependencies(
  current: Record<string, boolean>,
  permission: PermissionKey,
  checked: boolean,
): Record<string, boolean> {
  const next = { ...current, [permission]: checked };

  if (permission.startsWith("manage_") && checked) {
    const pairedView = permission.replace("manage_", "view_");
    if (isPermissionKey(pairedView)) {
      next[pairedView] = true;
    }
  }

  if (permission.startsWith("view_") && !checked) {
    const pairedManage = permission.replace("view_", "manage_");
    if (isPermissionKey(pairedManage)) {
      next[pairedManage] = false;
    }
  }

  return next;
}

export function hasPermission(
  admin: Admin | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!admin) {
    return false;
  }

  if (admin.role === "super-admin") {
    return true;
  }

  return normalizePermissions(admin.permissions)[permission] === true;
}

function hasConfiguredPermissions(admin: Admin) {
  return countEnabledPermissions(normalizePermissions(admin.permissions)) > 0;
}

export function canAccessPath(
  admin: Admin | null | undefined,
  path: string,
): boolean {
  if (!admin) {
    return false;
  }

  if (admin.role === "super-admin") {
    return true;
  }

  const rule = PATH_PERMISSION_RULES[path];

  if (!rule) {
    return false;
  }

  if (rule.superAdminOnly) {
    return false;
  }

  if (!rule.permissions?.length) {
    return true;
  }

  const permissions = normalizePermissions(admin.permissions);
  const hasExplicitPermission = rule.permissions.some(
    (permission) => permissions[permission] === true,
  );

  if (hasExplicitPermission) {
    return true;
  }

  if (!hasConfiguredPermissions(admin)) {
    return (LEGACY_ROLE_FALLBACK_PATHS[admin.role] ?? []).includes(path);
  }

  return false;
}
