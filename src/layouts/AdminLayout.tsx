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
import { useTheme } from "@/hooks/useTheme";
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
  Settings,
  Shield,
  Star,
  User,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

// ─── Nav definitions ─────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  icon?: React.ElementType;
  path?: string;
  /** The route path used to check backend-driven access rules */
  permissionPath: string;
  children?: NavItem[];
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
    permissionPath: "/service-management",
    children: [
      {
        label: "Service Management",
        path: "/service-management",
        permissionPath: "/service-management",
      },
      {
        label: "Service Features",
        path: "/service-features",
        permissionPath: "/service-features",
      },
    ],
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
    label: "Cosmetic Procedures",
    icon: Calendar,
    path: "/procedures",
    permissionPath: "/procedures",
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

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Services: true,
  });

  function toggleMenu(label: string) {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  }

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {visibleItems.map((item) => {
        // submenu
        if (item.children?.length) {
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => toggleMenu(item.label)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-accent"
              >
                <div className="flex items-center gap-3">
                  {item.icon && <item.icon size={18} />}
                  {item.label}
                </div>

                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    openMenus[item.label]
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {openMenus[item.label] && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => {
                    const isActive =
                      currentPath === child.path;

                    return (
                      <button
                        key={child.path}
                        type="button"
                        onClick={() => {
                          navigate({
                            to: child.path!,
                          });

                          onNavigate?.();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "hover:bg-sidebar-accent"
                        }`}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // normal menu
        const isActive =
          currentPath === item.path ||
          currentPath.startsWith(`${item.path}/`);

        return (
          <button
            key={item.path}
            onClick={() => {
              navigate({ to: item.path! });
              onNavigate?.();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
            type="button"
          >
            {item.icon && <item.icon size={18} />}
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
  useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-x-hidden">
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border z-30">
        {/* Logo */}
        <div className="flex justify-center items-center px-5 py-6 border-b border-sidebar-border">
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
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-accent/40">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {admin?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Wrapper ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col md:ml-64">
        {/* ── Topbar ──────────────────────────────────────────────── */}
        <header className="fixed top-0 right-0 left-0 md:left-64 bg-card border-b border-border z-20">
          <div className="flex items-center h-14 md:h-16 px-3 sm:px-4 lg:px-6 gap-2 sm:gap-3">
            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden flex-shrink-0 h-9 w-9"
                  data-ocid="topbar.mobile_menu_button"
                  type="button"
                  aria-label="Open navigation menu"
                >
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 max-w-[85vw]">
                <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
                  <img
                    src="/assets/images/samrpanlogo.webp"
                    alt="Samarpan"
                    className="h-10 w-auto object-contain"
                  />
                  <span className="text-lg font-bold text-sidebar-foreground font-display">
                    Samarpan
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="ml-auto text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors"
                    aria-label="Close menu"
                  >
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

            {/* Spacer for mobile */}
            <div className="flex-1 sm:hidden" />

            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1.5 px-1.5 sm:px-2 h-9 min-w-0"
                    data-ocid="topbar.profile_dropdown"
                    type="button"
                  >
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">
                      {admin?.name}
                    </span>
                    <ChevronDown
                      size={14}
                      className="text-muted-foreground flex-shrink-0"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-foreground truncate">
                      {admin?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/settings" })}
                    data-ocid="topbar.profile_settings_item"
                  >
                    <User size={14} className="mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                    data-ocid="topbar.logout_button"
                  >
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
          <div className="overflow-x-auto">
            <div className="min-w-0 p-3 sm:p-4 lg:p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
