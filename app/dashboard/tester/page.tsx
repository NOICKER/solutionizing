"use client";

import { TesterDashboard } from "@/components/TesterDashboard";
import { RequireAuth } from "@/components/RequireAuth";

export default function TesterDashboardPage() {
  return (
    <RequireAuth role="tester">
      <TesterDashboard />
    </RequireAuth>
  );
}

