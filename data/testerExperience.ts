export interface TesterMatchReason {
  readonly title: string;
  readonly detail: string;
  readonly icon: string;
}

export interface TesterAchievement {
  readonly title: string;
  readonly detail: string;
  readonly icon: string;
  readonly locked?: boolean;
}

export interface TesterOnboardingStep {
  readonly title: string;
  readonly body: string;
  readonly icon: string;
}

export interface TesterDevice {
  readonly name: string;
  readonly icon: string;
}

export interface TesterMissionOffer {
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly duration: string;
  readonly impact: string;
  readonly founder: string;
  readonly timer: string;
  readonly summary: string;
  readonly reasons: readonly TesterMatchReason[];
}

export const testerMatchOffer: TesterMissionOffer = {
  eyebrow: "New Mission Offer",
  title: "Redesigning the Checkout Flow",
  subtitle: "Invitation: Transparency First",
  duration: "Approx. 3 mins",
  impact: "Validate Idea",
  founder: "Solo Student Builder",
  timer: "05:00",
  summary:
    "A supportive platform for first-time founders needs a simple checkout. Help identify friction points in the new three-step guest checkout process.",
  reasons: [
    {
      title: "12 Mobile UX Missions completed",
      detail: "Your expertise in mobile interfaces is a perfect fit.",
      icon: "task_alt"
    },
    {
      title: "Top 5% Clarity Score",
      detail: "Founders value your clear, actionable written feedback.",
      icon: "star_half"
    },
    {
      title: "Recent Activity",
      detail: "You have been active in the last 48 hours.",
      icon: "bolt"
    }
  ]
};

export const testerOnboardingSteps: readonly TesterOnboardingStep[] = [
  {
    title: "Selection",
    body: "Our system identifies your profile as a strong fit for a founder's mission.",
    icon: "filter_list"
  },
  {
    title: "Notification",
    body: "You receive a direct invite via email or dashboard with the details up front.",
    icon: "notifications_active"
  },
  {
    title: "Accept or Decline",
    body: "Review the mission. If it is not a fit, you can pass with zero penalty.",
    icon: "thumbs_up_down"
  },
  {
    title: "Execution",
    body: "Complete the task in a guided workspace and submit specific findings.",
    icon: "task_alt"
  }
];

export const testerDevices: readonly TesterDevice[] = [
  { name: "MacBook Pro", icon: "laptop_mac" },
  { name: "iPhone 15", icon: "smartphone" }
];

export const testerAchievements: readonly TesterAchievement[] = [
  {
    title: "Eagle Eye",
    detail: "Found 3 bugs in one session",
    icon: "emoji_events"
  },
  {
    title: "First Step",
    detail: "Completed your first mission",
    icon: "auto_awesome"
  },
  {
    title: "Power User",
    detail: "Complete 10 more missions",
    icon: "lock",
    locked: true
  }
];

export const testerDepthExamples = {
  lowDepth:
    "The sign-up page was a bit confusing. I did not like the colors much. Everything else seemed fine.",
  greatInsight:
    "On the sign-up page, the Submit button is below the fold on mobile. The terracotta text on beige has low contrast, making it hard to read. I would move the CTA higher and tighten the hierarchy."
} as const;

export const testerWorkspacePrompts = {
  task:
    "Imagine you are considering this tool for your own team. Try to find the pricing and decide which plan might fit you.",
  prompt:
    "What felt clear? What made you hesitate? Mention the exact moment you paused and what you expected to happen next.",
  coaching: [
    "Mention what you expected versus what you saw.",
    "Call out specific words, labels, or layout choices.",
    "Share what you would try next if this were your product."
  ]
} as const;

export const founderSafetyReview = {
  question:
    "Please provide your email address so we can send you a follow-up discount code for our store.",
  saferAlternative:
    "Would you be interested in a follow-up discount? Check the Rewards tab after submitting your feedback."
} as const;

export const founderMissionStatus = {
  joined: 2,
  target: 5,
  elapsed: "12h 42m",
  avgSpeed: "6.3h",
  note:
    "Matches are currently finding your mission at a slower pace than average. This often happens when profiles are being carefully vetted to ensure the highest quality feedback."
} as const;
