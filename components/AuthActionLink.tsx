"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";

interface AuthActionLinkProps {
  readonly authedHref: string;
  readonly role: UserRole;
  readonly mode?: "signin" | "signup";
  readonly publicHref?: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}

export function AuthActionLink({
  authedHref,
  role,
  mode = "signin",
  publicHref,
  className,
  children
}: Readonly<AuthActionLinkProps>) {
  const { auth } = useAuth();

  const href = useMemo(() => {
    const guardParams = new URLSearchParams({
      mode,
      role,
      next: authedHref
    });

    if (auth.hydrated && auth.isAuthenticated) {
      return authedHref;
    }

    if (publicHref) {
      return publicHref;
    }

    return `/auth?${guardParams.toString()}`;
  }, [auth.hydrated, auth.isAuthenticated, authedHref, mode, publicHref, role]);

  return (
    <Link href={href} className={className} prefetch={false}>
      {children}
    </Link>
  );
}
