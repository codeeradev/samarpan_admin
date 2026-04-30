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
import { useState } from "react";

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
    label: "Reviews & Shorts",
    icon: Star,
    path: "/reviews-shorts",
    permissionPath: "/reviews-shorts",
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
              isActive
                ? "bg-[#D89F00] text-white shadow-sm"
                : "text-[#475569] hover:bg-[#FFF8E1] hover:text-[#A67C00]"
            }`}
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
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside className="flex flex-col w-64 fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-30">
        {/* Logo */}
        <div className="flex justify-center items-center px-5 py-6 border-b border-slate-100">
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
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#F8FAFC]">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-[#D89F00] text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1E293B] truncate">
                {admin?.name}
              </p>
              <p className="text-xs text-[#64748B] truncate">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Wrapper ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* ── Topbar ──────────────────────────────────────────────── */}
        <header className="fixed top-0 right-0 left-0 md:left-64 bg-white border-b border-slate-200 z-20">
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
                <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
                  <img
                    src="/assets/images/samrpanlogo.webp"
                    alt="Samarpan"
                    className="h-10 w-auto object-contain"
                  />
                  <span className="text-lg font-bold text-[#1E293B] font-display">
                    Samarpan
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="ml-auto text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
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
                      <AvatarFallback className="bg-[#D89F00] text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium text-[#1E293B] max-w-[100px] truncate">
                      {admin?.name}
                    </span>
                    <ChevronDown
                      size={14}
                      className="text-slate-400 flex-shrink-0"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium text-[#1E293B] truncate">
                      {admin?.name}
                    </p>
                    <p className="text-xs text-[#64748B]">{roleLabel}</p>
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
                    className="text-red-600 focus:text-red-600"
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
        <main className="flex-1 pt-14 md:pt-16">
          <div className="p-3 sm:p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
