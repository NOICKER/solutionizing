"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";

interface RequireAuthProps {
  role: UserRole;
  children: React.ReactNode;
}

export function RequireAuth({ role, children }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { auth } = useAuth();

  useEffect(() => {
    if (!auth.hydrated) {
      return;
    }

    if (!auth.isAuthenticated) {
      const search = typeof window !== "undefined" ? window.location.search : "";
      const current = `${pathname}${search}`;
      const guard = new URLSearchParams({
        mode: "signin",
        role,
        next: current
      });
      router.replace(`/auth?${guard.toString()}`);
      return;
    }

    if (auth.user?.role !== role) {
      const fallback =
        auth.user?.role === "tester" ? "/dashboard/tester" : "/dashboard/founder";
      router.replace(fallback);
    }
  }, [
    auth.hydrated,
    auth.isAuthenticated,
    auth.user?.role,
    pathname,
    role,
    router
  ]);

  if (!auth.hydrated) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-text-main/60">
        Loading...
      </div>
    );
  }

  if (!auth.isAuthenticated || auth.user?.role !== role) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-text-main/60">
        Redirecting to secure sign in...
      </div>
    );
  }

  return <>{children}</>;
}
