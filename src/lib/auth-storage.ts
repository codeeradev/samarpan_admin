import type { Admin } from "@/types";

export const AUTH_STORAGE_KEY = "samarpan_auth";

const LEGACY_AUTH_STORAGE_KEYS = ["auth"] as const;

export interface AuthState {
  isAuthenticated: boolean;
  admin: Admin | null;
}

const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  admin: null,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeAdmin(value: unknown): Admin | null {
  if (!isObject(value)) {
    return null;
  }

  const { id, name, email, role, avatar } = value;

  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof avatar !== "string"
  ) {
    return null;
  }

  if (
    role !== "super-admin" &&
    role !== "doctor" &&
    role !== "receptionist" &&
    role !== "nurse"
  ) {
    return null;
  }

  return { id, name, email, role, avatar };
}

function normalizeAuthState(value: unknown): AuthState {
  if (!isObject(value)) {
    return DEFAULT_AUTH_STATE;
  }

  return {
    isAuthenticated: value.isAuthenticated === true,
    admin: normalizeAdmin(value.admin),
  };
}

function getStoredValue(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

export function loadAuthState(): AuthState {
  const keys = [AUTH_STORAGE_KEY, ...LEGACY_AUTH_STORAGE_KEYS];

  for (const key of keys) {
    const raw = getStoredValue(key);

    if (!raw) {
      continue;
    }

    try {
      const parsed = normalizeAuthState(JSON.parse(raw));

      if (key !== AUTH_STORAGE_KEY) {
        saveAuthState(parsed);
        window.localStorage.removeItem(key);
      }

      return parsed;
    } catch {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    }
  }

  return DEFAULT_AUTH_STATE;
}

export function saveAuthState(state: AuthState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));

  for (const key of LEGACY_AUTH_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

export function clearAuthState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);

  for (const key of LEGACY_AUTH_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}
