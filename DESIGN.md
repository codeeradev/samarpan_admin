import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { canAccessPath } from "@/lib/admin-access";
import { ROLE_LABELS, type UserRole } from "@/types";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Award,
  Briefcase,
  Calendar,
  ChevronDown,
  FileImage,
  FileText,
  HeartPulse,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  Star,
  User,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

import { getThemeApi } from "@/apiCalls/theme";
import { applyPanelTheme } from "@/lib/theme";
// ─── Nav definitions ─────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  /** The route path used to check backend-driven access rules */
  permissionPath: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    permissionPath: "/dashboard",
  },
  {
    label: "Services",
    icon: HeartPulse,
    path: "/service-management",
    permissionPath: "/service-management",
  },
  {
    label: "Roles",
    icon: Shield,
    path: "/roles",
    permissionPath: "/roles",
  },
  {
    label: "Doctors",
    icon: UserRound,
    path: "/doctors",
    permissionPath: "/doctors",
  },
  {
    label: "Specializations",
    icon: Briefcase,
    path: "/specializations",
    permissionPath: "/specializations",
  },
  {
    label: "Honors",
    icon: Award,
    path: "/honors",
    permissionPath: "/honors",
  },
  {
    label: "Patients",
    icon: Users,
    path: "/patients",
    permissionPath: "/patients",
  },
  {
    label: "Appointments",
    icon: Calendar,
    path: "/appointments",
    permissionPath: "/appointments",
  },
  {
    label: "Blogs",
    icon: FileImage,
    path: "/blogs",
    permissionPath: "/blogs",
  },
  {
    label: "Gallery",
    icon: ImageIcon,
    path: "/gallery",
    permissionPath: "/gallery",
  },
  {
    label: "Shorts",
    icon: Star,
    path: "/shorts",
    permissionPath: "/reviews-shorts",
  },
  {
    label: "Theme",
    icon: Settings,
    path: "/themes",
    permissionPath: "/manage_themes",
  },

  {
    label: "Website Content",
    icon: FileImage,
    path: "/website-content",
    permissionPath: "/website-content",
  },
  {
    label: "Website Pages",
    icon: FileText,
    path: "/website-pages",
    permissionPath: "/website-pages",
  },
  {
    label: "Careers",
    icon: Briefcase,
    path: "/careers",
    permissionPath: "/careers",
  },
  // {
  //   label: "Enquiries",
  //   icon: MessageSquare,
  //   path: "/enquiries",
  //   permissionPath: "/enquiries",
  // },
  {
    label: "Settings",
    icon: Settings,
    path: "/settings",
    permissionPath: "/settings",
  },
];

// ─── Sidebar Nav ─────────────────────────────────────────────────────────────

interface SidebarNavProps {
  currentPath: string;
  visibleItems: NavItem[];
  onNavigate?: () => void;
}

function SidebarNav({
  currentPath,
  visibleItems,
  onNavigate,
}: SidebarNavProps) {
  const navigate = useNavigate();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {visibleItems.map((item) => {
        const isActive =
          currentPath === item.path || currentPath.startsWith(`${item.path}/`);
        return (
          <button
            key={item.path}
            data-ocid={`nav.${item.label.toLowerCase().replace(/\s+/g, "_")}_link`}
            onClick={() => {
              navigate({ to: item.path });
              onNavigate?.();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
              isActive ? "text-white shadow-sm" : "hsl(var(--foreground))"
            }`}
            style={
              isActive ? { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--secondary))" } : undefined
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "hsl(var(--accent))";
                e.currentTarget.style.color = "hsl(var(--primary))";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = "";
                e.currentTarget.style.color = "hsl(var(--foreground))";
              }
            }}
            type="button"
          >
            <item.icon size={18} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const data = await getThemeApi("panel");
        console.log("theme:", data); // debug
        applyPanelTheme(data?.colors);
      } catch (err) {
        console.error("Theme load failed");
      }
    }

    loadTheme();
  }, []);

  const role = admin?.role as UserRole | undefined;
  const visibleItems = ALL_NAV_ITEMS.filter((item) =>
    canAccessPath(admin, item.permissionPath),
  );

  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }

  const initials = admin?.name
    ? admin.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  const roleLabel = role ? ROLE_LABELS[role] : "Admin";

  // ONLY COLOR RELATED CHANGES DONE — REST SAME

  return (
    <div
      className="min-h-screen flex overflow-x-hidden"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-64 fixed top-0 left-0 h-full z-30"
        style={{
          backgroundColor: "hsl(var(--card))",
          borderRight: "1px solid hsl(var(--border))",
        }}
      >
        {/* Logo */}
        <div
          className="flex justify-center items-center px-5 py-6"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}
        >
          <img
            src="/assets/images/samrpanlogo.webp"
            alt="Samarpan"
            className="h-16 w-auto object-contain mr-[10%]"
          />
        </div>

        <SidebarNav
          currentPath={location.pathname}
          visibleItems={visibleItems}
        />

        {/* Bottom admin info */}
        <div
          className="px-4 py-4"
          style={{ borderTop: "1px solid hsl(var(--border))" }}
        >
          <div
            className="flex items-center gap-3 p-2 rounded-xl"
            style={{ backgroundColor: "hsl(var(--background))" }}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback
                className="text-white text-xs font-semibold"
                style={{ backgroundColor: "hsl(var(--primary))" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold truncate"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {admin?.name}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {roleLabel}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Wrapper ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col md:ml-64">
        {/* ── Topbar ──────────────────────────────────────────────── */}
        <header
          className="fixed top-0 right-0 left-0 md:left-64 z-20"
          style={{
            backgroundColor: "hsl(var(--card))",
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <div className="flex items-center h-14 md:h-16 px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="p-0 w-72 max-w-[85vw]">
                <div
                  className="flex items-center gap-3 px-5 py-5"
                  style={{ borderBottom: "1px solid hsl(var(--border))" }}
                >
                  <img src="/assets/images/samrpanlogo.webp" className="h-10" />
                  <span
                    className="text-lg font-bold"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    Samarpan
                  </span>
                  <button onClick={() => setMobileOpen(false)}>
                    <X size={18} />
                  </button>
                </div>

                <SidebarNav
                  currentPath={location.pathname}
                  visibleItems={visibleItems}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback
                        className="text-white text-xs font-semibold"
                        style={{
                          backgroundColor: "hsl(var(--primary))",
                        }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      {admin?.name}
                    </span>
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p style={{ color: "hsl(var(--foreground))" }}>
                      {admin?.name}
                    </p>
                    <p style={{ color: "hsl(var(--muted-foreground))" }}>
                      {roleLabel}
                    </p>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/settings" })}
                  >
                    <User size={14} className="mr-2" />
                    My Profile
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut size={14} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* ── Page Content ─────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 pt-14 md:pt-16">
          <div className="min-w-0 p-3 sm:p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
