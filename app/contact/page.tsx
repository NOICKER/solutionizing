import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-14">
      <div className="rounded-[16px] border border-[var(--border)] bg-[var(--cream)] p-6 sm:p-8 w-full max-w-lg mx-auto">
        <Link href="/" className="text-sm font-semibold text-[var(--electric)] hover:underline cursor-none">Back to home</Link>
        <h1 className="mt-4 font-[family-name:var(--font-fraunces)] italic font-normal text-[var(--ink)] text-2xl sm:text-3xl">Contact</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
          Reach the Solutionizing team for pricing questions, mission setup help, or partnership conversations.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[12px] bg-[var(--bg-light)] p-5">
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.68rem] uppercase tracking-[0.1em] text-[var(--ink-soft)]">Email</div>
            <a href="mailto:hello@solutionizing.com" className="mt-3 block text-lg font-semibold text-[var(--electric)] hover:opacity-80 cursor-none">hello@solutionizing.com</a>
          </div>
          <div className="rounded-[12px] bg-[var(--bg-light)] p-5">
            <div className="font-[family-name:var(--font-dm-mono)] text-[0.68rem] uppercase tracking-[0.1em] text-[var(--ink-soft)]">Response time</div>
            <p className="mt-3 text-lg font-semibold text-[var(--ink)]">Usually within one business day</p>
          </div>
        </div>

        <div className="mt-8 rounded-[16px] border border-[var(--border)] bg-[var(--bg-light)] p-6">
          <h2 className="text-xl font-bold text-[var(--ink)]">What to include</h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--ink-soft)]">
            Share your product stage, the decision you are trying to validate, and whether you need founder setup help or tester community information.
          </p>
        </div>
      </div>
    </main>
  );
}
