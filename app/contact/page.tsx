import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-neutral-bg px-6 py-14">
      <div className="mx-auto max-w-3xl rounded-panel border border-secondary/15 bg-white p-8 shadow-card-soft lg:p-10">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">Back to home</Link>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-text-main">Contact</h1>
        <p className="mt-4 text-base leading-relaxed text-text-main/65">
          Reach the Solutionizing team for pricing questions, mission setup help, or partnership conversations.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card bg-neutral-bg p-5">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-secondary">Email</div>
            <a href="mailto:hello@solutionizing.com" className="mt-3 block text-lg font-semibold text-text-main hover:text-primary">hello@solutionizing.com</a>
          </div>
          <div className="rounded-card bg-neutral-bg p-5">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-secondary">Response time</div>
            <p className="mt-3 text-lg font-semibold text-text-main">Usually within one business day</p>
          </div>
        </div>

        <div className="mt-8 rounded-panel border border-secondary/15 bg-[#f7f4ee] p-6">
          <h2 className="text-xl font-bold text-text-main">What to include</h2>
          <p className="mt-3 text-base leading-relaxed text-text-main/70">
            Share your product stage, the decision you are trying to validate, and whether you need founder setup help or tester community information.
          </p>
        </div>
      </div>
    </main>
  );
}
