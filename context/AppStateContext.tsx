"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type MissionStatus = "matching" | "active" | "completed" | "needs_clarity";

export interface Mission {
  id: string;
  name: string;
  focus: string;
  status: MissionStatus;
  createdAt: string;
  clarityScore: number;
  matchingProgress: number;
}

export interface TesterReputation {
  name: string;
  score: number;
  previousScore: number;
  lastChangeReason?: string;
}

type ModalType = "matching" | "reputation" | "safety" | null;

interface UIState {
  activeModal: ModalType;
  matchingCountdown: number | null;
  devPanelOpen: boolean;
  safetyFlaggedQuestion?: string;
}

interface AppState {
  missions: Mission[];
  tester: TesterReputation;
  ui: UIState;
}

interface AppContextShape {
  state: AppState;
  triggerNewMissionOffer: () => void;
  acceptMissionOffer: () => void;
  passOnMissionOffer: () => void;
  triggerLowDepthDrop: () => void;
  resolveReputationResubmission: (isDeepEnough: boolean) => void;
  triggerSafetyFlag: (question: string) => void;
  resolveSafetyUpdate: () => void;
  setDevPanelOpen: (open: boolean) => void;
  resetAll: () => void;
  incrementMatchingProgress: (missionId: string, amount: number) => void;
}

const initialMissions: Mission[] = [
  {
    id: "m1",
    name: "Homepage Usability",
    focus: "Can people find the pricing in under 3 seconds?",
    status: "active",
    createdAt: "Today � 9:14 AM",
    clarityScore: 96,
    matchingProgress: 72
  },
  {
    id: "m2",
    name: "Pricing Clarity",
    focus: "Do founders understand which plan to start with?",
    status: "matching",
    createdAt: "Yesterday � 4:02 PM",
    clarityScore: 88,
    matchingProgress: 34
  }
];

const initialTester: TesterReputation = {
  name: "Jamie Smith",
  score: 982,
  previousScore: 982,
  lastChangeReason: undefined
};

const defaultState: AppState = {
  missions: initialMissions,
  tester: initialTester,
  ui: {
    activeModal: null,
    matchingCountdown: null,
    devPanelOpen: false,
    safetyFlaggedQuestion: undefined
  }
};

const AppStateContext = createContext<AppContextShape | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [state, setState] = useState<AppState>(defaultState);

  const triggerNewMissionOffer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        activeModal: "matching",
        matchingCountdown: 90
      }
    }));
  }, []);

  const acceptMissionOffer = useCallback(() => {
    setState((prev) => {
      const missions = prev.missions.map<Mission>((m) =>
        m.status === "matching" ? { ...m, status: "active", matchingProgress: 100 } : m
      );
      return {
        ...prev,
        missions,
        ui: { ...prev.ui, activeModal: null, matchingCountdown: null }
      };
    });
  }, []);

  const passOnMissionOffer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, activeModal: null, matchingCountdown: null }
    }));
  }, []);

  const triggerLowDepthDrop = useCallback(() => {
    setState((prev) => ({
      ...prev,
      tester: {
        ...prev.tester,
        previousScore: prev.tester.score,
        score: Math.max(prev.tester.score - 48, 600),
        lastChangeReason: "Short, low-context response"
      },
      ui: {
        ...prev.ui,
        activeModal: "reputation"
      }
    }));
  }, []);

  const resolveReputationResubmission = useCallback(
    (isDeepEnough: boolean) => {
      setState((prev) => {
        if (!isDeepEnough) {
          return {
            ...prev,
            ui: { ...prev.ui, activeModal: null }
          };
        }
        return {
          ...prev,
          tester: {
            ...prev.tester,
            score: prev.tester.previousScore,
            lastChangeReason: "Depth recovered via richer feedback"
          },
          ui: { ...prev.ui, activeModal: null }
        };
      });
    },
    []
  );

  const triggerSafetyFlag = useCallback((question: string) => {
    setState((prev) => ({
      ...prev,
      ui: {
        ...prev.ui,
        activeModal: "safety",
        safetyFlaggedQuestion: question
      }
    }));
  }, []);

  const resolveSafetyUpdate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, activeModal: null, safetyFlaggedQuestion: undefined }
    }));
  }, []);

  const setDevPanelOpen = useCallback((open: boolean) => {
    setState((prev) => ({
      ...prev,
      ui: { ...prev.ui, devPanelOpen: open }
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState(defaultState);
  }, []);

  const incrementMatchingProgress = useCallback(
    (missionId: string, amount: number) => {
      setState((prev) => ({
        ...prev,
        missions: prev.missions.map((m) =>
          m.id === missionId
            ? {
                ...m,
                matchingProgress: Math.min(100, m.matchingProgress + amount)
              }
            : m
        )
      }));
    },
    []
  );

  // Matching countdown side-effect
  useEffect(() => {
    if (state.ui.activeModal !== "matching" || state.ui.matchingCountdown == null) {
      return;
    }
    if (state.ui.matchingCountdown <= 0) {
      setState((prev) => ({
        ...prev,
        ui: { ...prev.ui, matchingCountdown: 0 }
      }));
      return;
    }
    const timer = window.setInterval(() => {
      setState((prev) => ({
        ...prev,
        ui: {
          ...prev.ui,
          matchingCountdown:
            prev.ui.matchingCountdown != null && prev.ui.matchingCountdown > 0
              ? prev.ui.matchingCountdown - 1
              : 0
        }
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.ui.activeModal, state.ui.matchingCountdown]);

  const value = useMemo<AppContextShape>(
    () => ({
      state,
      triggerNewMissionOffer,
      acceptMissionOffer,
      passOnMissionOffer,
      triggerLowDepthDrop,
      resolveReputationResubmission,
      triggerSafetyFlag,
      resolveSafetyUpdate,
      setDevPanelOpen,
      resetAll,
      incrementMatchingProgress
    }),
    [
      state,
      triggerNewMissionOffer,
      acceptMissionOffer,
      passOnMissionOffer,
      triggerLowDepthDrop,
      resolveReputationResubmission,
      triggerSafetyFlag,
      resolveSafetyUpdate,
      setDevPanelOpen,
      resetAll,
      incrementMatchingProgress
    ]
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
};

export const useAppState = (): AppContextShape => {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
};


