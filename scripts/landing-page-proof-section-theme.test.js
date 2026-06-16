const fs = require("fs");
const path = require("path");

const landingPagePath = path.join(__dirname, "..", "app", "page.tsx");
const source = fs.readFileSync(landingPagePath, "utf8");

const requiredSnippets = [
  {
    label: "proof section uses a dark wrapper background",
    snippet: '        <section className="bg-neutral-bg py-24 lg:py-28">'
  },
  {
    label: "proof section heading still uses theme text color",
    snippet: '                <h2 className="mt-3 text-4xl font-black tracking-tight text-text-main lg:text-5xl">Proof looks like clearer decisions, not more transcripts.</h2>'
  }
];

const forbiddenSnippets = [
  {
    label: "proof section no longer uses the old beige wrapper",
    snippet: '        <section className="bg-[#f7f4ee] py-24 lg:py-28">'
  }
];

const missing = requiredSnippets.filter((item) => !source.includes(item.snippet));
const stillPresent = forbiddenSnippets.filter((item) => source.includes(item.snippet));

if (missing.length > 0 || stillPresent.length > 0) {
  console.error("Landing page proof section theme regression:");

  for (const item of missing) {
    console.error(`- Missing: ${item.label}`);
  }

  for (const item of stillPresent) {
    console.error(`- Still present: ${item.label}`);
  }

  process.exit(1);
}

console.log("Landing page proof section uses the dark theme wrapper.");
