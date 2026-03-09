"use client";

import { MissionSafetyReview } from "@/components/MissionSafetyReview";
import { RequireAuth } from "@/components/RequireAuth";

export default function MissionSafetyReviewPage() {
  return (
    <RequireAuth role="founder">
      <MissionSafetyReview />
    </RequireAuth>
  );
}
