const fs = require("fs");
const path = require("path");

const landingPagePath = path.join(__dirname, "..", "app", "page.tsx");
const source = fs.readFileSync(landingPagePath, "utf8");

const expectations = [
  {
    label: "product pillar cards use the permanent dark surface",
    snippet: 'className="rounded-[2.5rem] border border-secondary/20 bg-neutral-card p-8 text-text-main shadow-card-soft"'
  },
  {
    label: "product pillar descriptions use muted dark-theme copy",
    snippet: 'className="mt-4 text-base leading-relaxed text-text-main/70 lg:text-lg"'
  },
  {
    label: "example mission cards use the permanent dark surface",
    snippet: 'className="rounded-[2rem] border border-secondary/20 bg-neutral-card p-6 text-text-main shadow-card-soft"'
  },
  {
    label: "example mission card titles use dark-theme text color",
    snippet: 'className="text-sm font-black uppercase tracking-[0.18em] text-text-main"'
  },
  {
    label: "pricing cards use the permanent dark surface",
    snippet: 'className={`rounded-[2.5rem] border p-8 text-text-main shadow-card-soft ${plan.featured ? "border-primary bg-neutral-card shadow-[0_25px_60px_-20px_rgba(217,119,6,0.25)]" : "border-secondary/20 bg-neutral-card"}`}'
  },
  {
    label: "pricing descriptions use muted dark-theme copy",
    snippet: 'className="mt-4 text-base leading-relaxed text-text-main/70"'
  }
];

const missing = expectations.filter((expectation) => !source.includes(expectation.snippet));

if (missing.length > 0) {
  console.error("Landing page dark-card text color regression:");
  for (const item of missing) {
    console.error(`- Missing: ${item.label}`);
  }
  process.exit(1);
}

console.log("Landing page cards use permanent dark-theme text colors.");
