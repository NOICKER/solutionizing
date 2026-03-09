"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAppState } from "@/context/AppStateContext";

interface UseTesterWorkspaceResult {
  readonly feedback: string;
  readonly feedbackLength: number;
  readonly canSubmit: boolean;
  readonly setFeedback: (value: string) => void;
  readonly handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function useTesterWorkspace(): UseTesterWorkspaceResult {
  const { triggerLowDepthDrop } = useAppState();
  const [feedback, setFeedback] = useState("");

  const feedbackLength = feedback.trim().length;
  const canSubmit = feedbackLength >= 120;

  const result = useMemo<UseTesterWorkspaceResult>(
    () => ({
      feedback,
      feedbackLength,
      canSubmit,
      setFeedback,
      handleSubmit: (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!canSubmit) {
          triggerLowDepthDrop();
          return;
        }
      }
    }),
    [canSubmit, feedback, feedbackLength, triggerLowDepthDrop]
  );

  return result;
}
