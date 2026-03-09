"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";

export function DevControlPanel() {
  const pathname = usePathname();
  const {
    state,
    triggerNewMissionOffer,
    triggerLowDepthDrop,
    triggerSafetyFlag,
    resetAll,
    setDevPanelOpen
  } = useAppState();
  const [sampleQuestion] = useState(
    "Ask the tester to share their email so we can follow up."
  );

  const isOpen = state.ui.devPanelOpen;

  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dashboard")
  ) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-end px-3 text-xs">
      <button
        type="button"
        aria-label={isOpen ? "Hide dev controls" : "Show dev controls"}
        onClick={() => setDevPanelOpen(!isOpen)}
        className="pointer-events-auto mr-1 inline-flex items-center gap-1 rounded-full border border-border-subtle bg-background/95 px-2 py-1 text-[0.65rem] text-text-muted shadow-card-soft opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span>Dev</span>
      </button>
      {isOpen ? (
        <div className="pointer-events-auto w-[320px] rounded-2xl border border-border-subtle bg-surface/98 p-3 shadow-card-soft backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[0.7rem] font-semibold text-text-main">
              Dev control panel
            </div>
            <button
              type="button"
              className="rounded-full px-2 py-0.5 text-[0.65rem] text-text-muted hover:bg-background"
              onClick={() => setDevPanelOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="space-y-2 text-[0.7rem] text-text-muted">
            <button
              type="button"
              className="btn-secondary-muted w-full justify-between px-3 py-1.5 text-[0.7rem]"
              onClick={triggerNewMissionOffer}
            >
              <span>Trigger new mission offer</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-[0.6rem]">
                Matching
              </span>
            </button>
            <button
              type="button"
              className="btn-secondary-muted w-full justify-between px-3 py-1.5 text-[0.7rem]"
              onClick={triggerLowDepthDrop}
            >
              <span>Trigger low depth drop</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-[0.6rem]">
                Reputation
              </span>
            </button>
            <button
              type="button"
              className="btn-secondary-muted w-full justify-between px-3 py-1.5 text-[0.7rem]"
              onClick={() => triggerSafetyFlag(sampleQuestion)}
            >
              <span>Trigger safety flag</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-[0.6rem]">
                Safety
              </span>
            </button>
            <button
              type="button"
              className="mt-1 w-full rounded-pill border border-border-subtle bg-background px-3 py-1.5 text-[0.7rem] font-semibold text-text-main shadow-card-soft transition-colors hover:bg-surface"
              onClick={resetAll}
            >
              Reset all demo state
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

