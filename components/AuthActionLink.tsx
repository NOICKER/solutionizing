"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

interface AuthActionLinkProps {
  readonly authedHref: string;
  readonly role?: "founder" | "tester" | "FOUNDER" | "TESTER";
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
  const { isAuthenticated } = useAuth();

  const href = useMemo(() => {
    if (isAuthenticated) {
      return authedHref;
    }

    if (publicHref) {
      return publicHref;
    }

    const guardParams = new URLSearchParams({
      mode,
      next: authedHref
    });

    return `/auth?${guardParams.toString()}`;
  }, [authedHref, isAuthenticated, mode, publicHref]);

  return (
    <Link href={href} className={className} prefetch={false}>
      {children}
    </Link>
  );
}
