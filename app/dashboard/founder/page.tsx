"use client";

import { FounderDashboard } from "@/components/FoundationDashboard";
import { RequireAuth } from "@/components/RequireAuth";

export default function FounderDashboardPage() {
  return (
    <RequireAuth role="founder">
      <FounderDashboard />
    </RequireAuth>
  );
}

