"use client";

import { TesterWorkspace } from "@/components/TesterWorkspace";
import { RequireAuth } from "@/components/RequireAuth";

export default function TesterWorkspacePage() {
  return (
    <RequireAuth role="tester">
      <TesterWorkspace />
    </RequireAuth>
  );
}

