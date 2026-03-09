const steps = [
  {
    label: "01",
    title: "Define your mission",
    body: "Capture the exact decision you are trying to make, not just a vague feature idea."
  },
  {
    label: "02",
    title: "Automated matching",
    body: "Assigned testers are matched for fit, context, and availability, not whoever clicks first."
  },
  {
    label: "03",
    title: "Receive synthesis",
    body: "In 2-4 minutes per tester, see where people hesitate, what they misread, and what feels obvious."
  }
];

export function WorkflowSteps() {
  return (
    <div id="workflow" className="grid gap-4 md:grid-cols-3" aria-label="The 2-minute workflow">
      {steps.map((step) => (
        <article key={step.label} className="surface-card flex flex-col gap-3 p-5 md:p-6">
          <div className="text-xs font-semibold text-text-muted">{step.label}</div>
          <h3 className="text-sm font-semibold tracking-tight text-text-main">{step.title}</h3>
          <p className="text-xs leading-relaxed text-text-muted">{step.body}</p>
        </article>
      ))}
    </div>
  );
}
