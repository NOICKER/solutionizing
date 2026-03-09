"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type UserRole = "founder" | "tester";

interface AuthUser {
  name: string;
  role: UserRole;
  plan: string;
}

interface AuthState {
  hydrated: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
}

interface AuthContextShape {
  auth: AuthState;
  signIn: (role: UserRole, nameOverride?: string) => void;
  signOut: () => void;
}

interface PersistedAuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

const STORAGE_KEY = "solutionizing_auth_v1";

const defaultAuthState: AuthState = {
  hydrated: false,
  isAuthenticated: false,
  user: null
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

function getDefaultUser(role: UserRole, nameOverride?: string): AuthUser {
  if (role === "tester") {
    return {
      role,
      name: nameOverride ?? "Jamie Smith",
      plan: "Verified Panel"
    };
  }

  return {
    role,
    name: nameOverride ?? "Alex Founder",
    plan: "Pro Plan"
  };
}

function persistAuthCookie(role: UserRole) {
  document.cookie = `solutionizing_auth_role=${role}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = "solutionizing_auth_role=; Path=/; Max-Age=0; SameSite=Lax";
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [auth, setAuth] = useState<AuthState>(defaultAuthState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setAuth({ ...defaultAuthState, hydrated: true });
        return;
      }

      const parsed = JSON.parse(raw) as PersistedAuthState;
      setAuth({
        hydrated: true,
        isAuthenticated: Boolean(parsed.isAuthenticated),
        user: parsed.user ?? null
      });
    } catch {
      setAuth({ ...defaultAuthState, hydrated: true });
    }
  }, []);

  const persist = useCallback((next: PersistedAuthState) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures in this prototype.
    }
  }, []);

  const signIn = useCallback(
    (role: UserRole, nameOverride?: string) => {
      const user = getDefaultUser(role, nameOverride);
      const next: PersistedAuthState = {
        isAuthenticated: true,
        user
      };

      setAuth({
        hydrated: true,
        isAuthenticated: true,
        user
      });
      persist(next);
      persistAuthCookie(role);
    },
    [persist]
  );

  const signOut = useCallback(() => {
    setAuth({
      hydrated: true,
      isAuthenticated: false,
      user: null
    });

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures in this prototype.
    }

    clearAuthCookie();
  }, []);

  const value = useMemo<AuthContextShape>(
    () => ({
      auth,
      signIn,
      signOut
    }),
    [auth, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextShape {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

