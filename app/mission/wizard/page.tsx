"use client";

import { MissionWizard } from "@/components/MissionWizard";
import { RequireAuth } from "@/components/RequireAuth";

export default function MissionWizardPage() {
  return (
    <RequireAuth role="founder">
      <MissionWizard />
    </RequireAuth>
  );
}

