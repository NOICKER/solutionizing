const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const trackerPath = path.join(root, "components", "solutionizing", "MissionLifecycleTracker.tsx");
const statusPagePath = path.join(root, "components", "solutionizing", "MissionStatusPage.tsx");
const insightsPagePath = path.join(root, "components", "solutionizing", "MissionInsightsPage.tsx");

const read = (filePath) => fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";

const trackerSource = read(trackerPath);
const statusSource = read(statusPagePath);
const insightsSource = read(insightsPagePath);

const requiredTrackerSnippets = [
  "export function MissionLifecycleTracker",
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "ACTIVE",
  "COMPLETED",
  "reviewedAt",
  "launchedAt",
  "completedAt",
  "Draft",
  "Pending Review",
  "Approved",
  "Active",
  "Completed",
];

const requiredPageSnippets = [
  {
    label: "status page imports tracker",
    source: statusSource,
    snippet: "MissionLifecycleTracker",
  },
  {
    label: "status page renders tracker",
    source: statusSource,
    snippet: "<MissionLifecycleTracker mission={mission} />",
  },
  {
    label: "insights page imports tracker",
    source: insightsSource,
    snippet: "MissionLifecycleTracker",
  },
  {
    label: "insights page renders tracker",
    source: insightsSource,
    snippet: "<MissionLifecycleTracker mission={mission} />",
  },
];

const missingTrackerSnippets = requiredTrackerSnippets.filter((snippet) => !trackerSource.includes(snippet));
const missingPageSnippets = requiredPageSnippets.filter((item) => !item.source.includes(item.snippet));

if (missingTrackerSnippets.length > 0 || missingPageSnippets.length > 0) {
  console.error("Mission lifecycle tracker regression:");

  for (const snippet of missingTrackerSnippets) {
    console.error(`- Tracker missing: ${snippet}`);
  }

  for (const item of missingPageSnippets) {
    console.error(`- Page missing: ${item.label}`);
  }

  process.exit(1);
}

console.log("Mission lifecycle tracker is defined and mounted on founder pages.");
