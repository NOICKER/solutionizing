const fs = require("fs");
const path = require("path");

const landingPagePath = path.join(__dirname, "..", "app", "page.tsx");
const source = fs.readFileSync(landingPagePath, "utf8");

const expectations = [
  {
    label: "product pillar cards keep an explicit dark copy color",
    snippet: 'className="light-surface rounded-[2.5rem] border border-secondary/15 bg-white p-8 text-[#1a1a1a] shadow-card-soft"'
  },
  {
    label: "product pillar descriptions use explicit dark supporting text",
    snippet: 'className="mt-4 text-base leading-relaxed text-[#222222]/80 lg:text-lg"'
  },
  {
    label: "example mission cards keep an explicit dark copy color",
    snippet: 'className="rounded-[2rem] border border-secondary/15 bg-white p-6 text-[#1a1a1a] shadow-card-soft"'
  },
  {
    label: "example mission card titles use a dark text color",
    snippet: 'className="text-sm font-black uppercase tracking-[0.18em] text-[#222222]"'
  },
  {
    label: "pricing cards keep an explicit dark copy color",
    snippet: 'className={`light-surface rounded-[2.5rem] border p-8 text-[#1a1a1a] shadow-card-soft ${plan.featured ? "border-primary bg-white shadow-[0_25px_60px_-20px_rgba(217,119,6,0.25)]" : "border-secondary/15 bg-white"}`}'
  },
  {
    label: "pricing descriptions use explicit dark supporting text",
    snippet: 'className="mt-4 text-base leading-relaxed text-[#222222]/80"'
  }
];

const missing = expectations.filter((expectation) => !source.includes(expectation.snippet));

if (missing.length > 0) {
  console.error("Landing page light-card text color regression:");
  for (const item of missing) {
    console.error(`- Missing: ${item.label}`);
  }
  process.exit(1);
}

console.log("Landing page light-card text colors are explicitly dark where required.");
