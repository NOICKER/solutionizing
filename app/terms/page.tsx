import { LegalList, LegalPageLayout, LegalSection } from "@/components/solutionizing/legal/LegalPageLayout";

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      intro="These Terms of Service explain the rules for using Solutionizing as a founder, tester, or visitor."
      lastUpdated="May 7, 2026"
    >
      <LegalSection title="1. Acceptance of Terms">
        <p>
          By creating an account, launching a mission, purchasing coins, completing a mission, or otherwise using
          Solutionizing, you agree to these Terms of Service and our Privacy Policy. If you do not agree, you must not use
          the platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Founder responsibilities">
        <LegalList
          items={[
            "Founders must provide accurate product information, clear mission instructions, truthful product URLs, and enough context for testers to complete the mission safely.",
            "Founders must not submit illegal content, deceptive claims, malware, phishing links, infringing material, hate or harassment, or content that asks testers to break the law.",
            "Founders must not ask testers for passwords, payment details, government IDs, private contact information, or other sensitive data unless Solutionizing has approved that workflow in writing.",
            "Founders are responsible for reviewing mission results and making their own product decisions based on the feedback they receive.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Tester responsibilities">
        <LegalList
          items={[
            "Testers must provide honest feedback based on their actual experience with the mission.",
            "Testers must not submit plagiarism, copied responses, fabricated feedback, or another person's work as their own.",
            "Testers must follow mission instructions, respect product confidentiality, avoid abusive conduct, and complete accepted missions with reasonable care.",
            "Testers must not manipulate rewards, create duplicate accounts, collude with founders, or misrepresent their identity, device, location, or expertise.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Coin economy and refunds">
        <p>
          Coins are the in-platform unit used to fund missions, purchase tester capacity, and reward completed work. Coins
          are not legal tender, bank deposits, securities, or a guaranteed cash-value instrument.
        </p>
        <p>
          Coin purchases are non-refundable except for unfilled missions. If a mission is not filled or cannot be run, we
          may return the unused mission allocation to the founder&apos;s wallet or issue another remedy required by applicable
          law. Coins already used for filled, active, completed, or rewarded mission activity are not refundable unless
          Solutionizing decides otherwise or applicable law requires it.
        </p>
      </LegalSection>

      <LegalSection title="5. Aggregated anonymised data">
        <p>
          Solutionizing may use aggregated anonymised data from missions, tester responses, product usage, and outcomes to
          improve benchmarks, scoring models, fraud detection, product quality, and platform operations. We do not share
          individual mission data with other founders, and raw responses are not sold.
        </p>
      </LegalSection>

      <LegalSection title="6. No guarantee of specific outcomes">
        <p>
          Testing feedback is informational. Solutionizing does not guarantee specific outcomes, including product-market
          fit, conversion increases, revenue, investment, user growth, approval, tester sentiment, or any particular
          business result from running missions.
        </p>
      </LegalSection>

      <LegalSection title="7. Platform ownership and user content">
        <p>
          Solutionizing owns the platform, software, branding, workflows, and system-generated product experience. Founders
          keep ownership of their submitted product materials. Tester feedback submitted for a paid mission may be used by
          the founder who commissioned that mission, subject to these terms and applicable law.
        </p>
      </LegalSection>

      <LegalSection title="8. Prohibited conduct">
        <LegalList
          items={[
            "Do not abuse, scrape, overload, reverse engineer, or attempt to bypass the platform.",
            "Do not create fake accounts, impersonate others, manipulate reputation or reward systems, or interfere with another user's missions.",
            "Do not upload malware, infringing content, illegal content, or material that violates another person's rights.",
            "Do not use Solutionizing to harvest personal data, send spam, or run deceptive research.",
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Account suspension">
        <p>
          We may warn, restrict, suspend, or terminate accounts, missions, coin access, tester rewards, payouts, or platform
          access if we believe a user has violated these terms, created safety or legal risk, submitted fraudulent activity,
          abused another user, attempted to manipulate the platform, or harmed the integrity of Solutionizing.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes and contact">
        <p>
          We may update these terms from time to time. Continued use of Solutionizing after an update means you accept the
          updated terms. For questions or legal notices, contact{" "}
          <a href="mailto:hello@solutionizing.com" className="font-semibold text-primary hover:underline">
            hello@solutionizing.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
