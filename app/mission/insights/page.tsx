"use client";

import { InsightsView } from "@/components/InsightsView";
import { RequireAuth } from "@/components/RequireAuth";

export default function MissionInsightsPage() {
  return (
    <RequireAuth role="founder">
      <InsightsView />
    </RequireAuth>
  );
}

