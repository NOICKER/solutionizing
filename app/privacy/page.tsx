import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-bg px-6 py-14">
      <div className="mx-auto max-w-3xl rounded-panel border border-secondary/15 bg-white p-8 shadow-card-soft lg:p-10">
        <Link href="/" className="text-sm font-semibold text-primary hover:underline">Back to home</Link>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-text-main">Privacy Policy</h1>
        <p className="mt-4 text-base leading-relaxed text-text-main/65">
          We collect the minimum information required to run product missions, protect participants, and deliver clear insight to founders.
        </p>

        <div className="mt-8 space-y-6 text-base leading-relaxed text-text-main/70">
          <section>
            <h2 className="text-xl font-bold text-text-main">What we collect</h2>
            <p className="mt-2">
              Account information, mission prompts, tester responses, and platform activity needed to improve matching and safety checks.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-text-main">How we use it</h2>
            <p className="mt-2">
              We use the data to power mission matching, generate synthesis, improve product quality, and prevent misuse of the platform.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-text-main">Safety and retention</h2>
            <p className="mt-2">
              We use moderation and structured review to reduce personal-data requests. Information is retained only as long as needed for product operations and compliance.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
