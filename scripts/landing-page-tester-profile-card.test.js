const fs = require("fs");
const path = require("path");

const landingPagePath = path.join(__dirname, "..", "app", "page.tsx");
const source = fs.readFileSync(landingPagePath, "utf8");

const requiredSnippets = [
  {
    label: "tester card includes a matched tester label",
    snippet: "Matched tester"
  },
  {
    label: "tester card shows the mock profile display name",
    snippet: "Aarohi Nair"
  },
  {
    label: "tester card includes a reputation score badge",
    snippet: "Reputation score"
  },
  {
    label: "tester card shows the sample reputation score",
    snippet: "94/100"
  },
  {
    label: "tester card includes the sample feedback quote",
    snippet: "the pricing labels made me wonder if this was built for teams bigger than mine."
  }
];

const forbiddenSnippets = [
  {
    label: "old placeholder heading is removed",
    snippet: "Signal certification"
  }
];

const missing = requiredSnippets.filter((item) => !source.includes(item.snippet));
const stillPresent = forbiddenSnippets.filter((item) => source.includes(item.snippet));

if (missing.length > 0 || stillPresent.length > 0) {
  console.error("Landing page tester profile card regression:");

  for (const item of missing) {
    console.error(`- Missing: ${item.label}`);
  }

  for (const item of stillPresent) {
    console.error(`- Still present: ${item.label}`);
  }

  process.exit(1);
}

console.log("Landing page tester profile card content is present and the placeholder copy is gone.");
