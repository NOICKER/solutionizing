const audience = [
  {
    label: "Early stage founders",
    emphasized: true,
    body: "Ship with more confidence when every release meaningfully shifts activation, retention, or revenue."
  },
  {
    label: "Product designers",
    emphasized: false,
    body: "Show why your direction is right with structured signal instead of subjective opinions."
  },
  {
    label: "UX researchers",
    emphasized: false,
    body: "Quickly pressure-test flows without spinning up a full study, panel, or screener."
  },
  {
    label: "Venture studios",
    emphasized: false,
    body: "Validate concepts with the right people before you commit scarce build cycles."
  }
];

export function AudienceGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {audience.map((item) => (
        <article
          key={item.label}
          className={`surface-card flex flex-col justify-between gap-3 p-4 text-xs leading-relaxed ${
            item.emphasized ? "bg-primary text-white shadow-card" : ""
          }`}
        >
          <div className="space-y-2">
            <h3
              className={`text-sm font-semibold tracking-tight ${
                item.emphasized ? "text-white" : "text-text-main"
              }`}
            >
              {item.label}
            </h3>
            <p className={item.emphasized ? "text-white/90" : "text-text-muted"}>
              {item.body}
            </p>
          </div>
          <div className={item.emphasized ? "text-white/80" : "text-text-muted"}>
            {item.emphasized ? "Most common entry point" : "Fits best when stakes are high"}
          </div>
        </article>
      ))}
    </div>
  );
}

