import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-bg px-6 py-14">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-secondary/15 bg-white p-8 shadow-card-soft lg:p-10">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">Back to home</Link>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-text-main">Terms of Service</h1>
        <p className="mt-4 text-base leading-relaxed text-text-main/65">
          These terms describe how teams use Solutionizing to create missions, review synthesized insight, and participate in the tester community.
        </p>

        <div className="mt-8 space-y-6 text-base leading-relaxed text-text-main/70">
          <section>
            <h2 className="text-xl font-bold text-text-main">Using the service</h2>
            <p className="mt-2">
              You agree to use the product for legitimate product research and not to request sensitive personal information from testers.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-text-main">Mission content</h2>
            <p className="mt-2">
              Founders are responsible for the prompts they submit. We reserve the right to pause or reject missions that request contact details or violate platform safety rules.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-text-main">Tester participation</h2>
            <p className="mt-2">
              Tester access depends on fit, clarity, and reliability. Participation may be limited if responses are consistently low-signal or policy-violating.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
