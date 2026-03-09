"use client";

import { useEffect } from "react";
import { useAppState } from "@/context/AppStateContext";
import { MatchingModal } from "@/components/modals/MatchingModal";
import { ReputationModal } from "@/components/modals/ReputationModal";
import { SafetyModal } from "@/components/modals/SafetyModal";

export function ModalHost() {
  const { state } = useAppState();
  const { activeModal } = state.ui;

  useEffect(() => {
    if (!activeModal) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [activeModal]);

  if (!activeModal) return null;

  return (
    <div
      aria-hidden={false}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(45,42,38,0.18)] px-4 backdrop-blur-sm"
    >
      {activeModal === "matching" && <MatchingModal />}
      {activeModal === "reputation" && <ReputationModal />}
      {activeModal === "safety" && <SafetyModal />}
    </div>
  );
}


