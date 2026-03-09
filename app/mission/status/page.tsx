"use client";

import { MissionStatusView } from "@/components/MissionStatusView";
import { RequireAuth } from "@/components/RequireAuth";

export default function MissionStatusPage() {
  return (
    <RequireAuth role="founder">
      <MissionStatusView />
    </RequireAuth>
  );
}
