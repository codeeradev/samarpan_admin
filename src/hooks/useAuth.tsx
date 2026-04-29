import type { Admin, UserRole } from "@/types";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { loginApi } from "@/apiCalls/login";
import {
  clearAuthState,
  loadAuthState,
  saveAuthState,
  type AuthState,
} from "@/lib/auth-storage";
import { getRoleFromRoleId, normalizePermissions } from "@/lib/admin-access";

interface AuthContextValue extends AuthState {
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateAdmin: (patch: Partial<Admin>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadAuthState);

  const updateAdmin = useCallback((patch: Partial<Admin>) => {
    setState((prev) => {
      if (!prev.admin) {
        return prev;
      }

      const nextState: AuthState = {
        ...prev,
        admin: {
          ...prev.admin,
          ...patch,
          permissions:
            patch.permissions !== undefined
              ? normalizePermissions(patch.permissions)
              : prev.admin.permissions,
        },
      };

      saveAuthState(nextState);
      return nextState;
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginApi(email, password);

      // Your backend returns role as "SUPER_ADMIN"/"DOCTOR"/... (roleId is also numeric).
      const rawRoleName: string | undefined = data?.admin?.role ?? data?.role;
      const rawRoleId: number | undefined = data?.admin?.roleId;

      const mappedRoleFromName: UserRole | undefined =
        rawRoleName === "SUPER_ADMIN"
          ? "super-admin"
          : rawRoleName === "DOCTOR"
            ? "doctor"
            : rawRoleName === "NURSE"
              ? "nurse"
              : rawRoleName === "RECEPTIONIST"
                ? "receptionist"
                : undefined;

      const mappedRoleFromId = rawRoleId
        ? getRoleFromRoleId(rawRoleId)
        : undefined;

      const role: UserRole =
        mappedRoleFromName ?? mappedRoleFromId ?? "receptionist";

      const admin: Admin = {
        id: data.admin?._id || "",
        name: data.admin?.name || "",
        email: data.admin?.email || email,
        role,
        roleId: rawRoleId ?? 1,
        avatar: data.admin.image || "",
        permissions: normalizePermissions(data.admin?.permissions),
        mobile: data.admin?.phone || "",
      };

      const newState: AuthState = {
        isAuthenticated: true,
        admin,
      };

      setState(newState);
      saveAuthState(newState);

      localStorage.setItem("token", data.token);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Login failed",
      };
    }
  }, []);

  const logout = useCallback(() => {
    const newState: AuthState = {
      isAuthenticated: false,
      admin: null,
    };

    setState(newState);

    clearAuthState();
    localStorage.removeItem("token");
  }, []);
  return (
    <AuthContext.Provider value={{ ...state, login, updateAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}
