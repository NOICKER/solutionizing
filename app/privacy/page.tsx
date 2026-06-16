import { LegalList, LegalPageLayout, LegalSection } from "@/components/solutionizing/legal/LegalPageLayout";

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      intro="This Privacy Policy explains what Solutionizing collects, how we use it to run founder missions and tester feedback workflows, and how we protect mission data."
      lastUpdated="May 7, 2026"
    >
      <LegalSection title="1. What Data We Collect">
        <LegalList
          items={[
            "Account details such as name, email address, role, company name, profile details, login activity, and support requests.",
            "Mission content submitted by founders, including product descriptions, research goals, task instructions, screening criteria, uploaded assets, and product URLs.",
            "Tester responses, including ratings, survey answers, written feedback, completion status, device context, timestamps, and moderation signals.",
            "Wallet and transaction records needed to manage coin purchases, mission funding, tester rewards, refunds, and operational support.",
            "Usage analytics via PostHog, including page views, clicks, feature events, device and browser data, referral data, and session-level product usage signals.",
          ]}
        />
      </LegalSection>

      <LegalSection title="2. How We Use Data">
        <LegalList
          items={[
            "To create accounts, authenticate users, secure sessions, and provide founder and tester dashboards.",
            "To run missions, match testers to mission requirements, collect tester responses, process rewards, and show founders the results of their missions.",
            "To generate AI synthesis via Gemini API, including summaries, friction themes, signal strength, recommendations, and related mission insights.",
            "To detect abuse, moderate unsafe content, investigate errors, prevent fraud, reconcile payments, and provide customer support.",
            "To build aggregated anonymous benchmarks across the platform so founders can understand product signal quality without exposing another founder's private mission data.",
          ]}
        />
        <p className="font-semibold text-[var(--ink)]">
          We use anonymised and aggregated mission outcomes to improve our benchmark scoring models. No individual mission data is shared with other founders. Raw responses are never sold.
        </p>
      </LegalSection>

      <LegalSection title="3. AI Processing">
        <p>
          When a mission is synthesized, relevant mission content and tester responses may be sent to the Gemini API to
          produce structured insights for the founder who ran that mission. We use this processing to make the mission
          results easier to understand and act on, not to sell raw responses or expose one founder&apos;s research project to
          another founder.
        </p>
      </LegalSection>

      <LegalSection title="4. Aggregated Benchmarks">
        <p>
          We may use anonymised, aggregated mission outcomes to improve benchmark scoring, platform quality, fraud
          detection, and product analytics. Benchmark datasets are designed to remove direct identifiers and combine
          outcomes across missions so they do not reveal individual mission content, tester identities, raw tester
          responses, or private founder research.
        </p>
      </LegalSection>

      <LegalSection title="5. Data Retention and Account Deletion">
        <p>
          We retain account, mission, response, wallet, and support data while your account is active and for as long as
          needed to operate the platform, resolve disputes, prevent fraud, maintain payment records, and comply with legal
          obligations. When you delete your account, we delete or anonymise personal data associated with the account unless
          we must retain limited records for legal, tax, payment, security, or fraud-prevention reasons.
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies and PostHog Analytics">
        <p>
          We use cookies and similar technologies to keep you signed in, protect sessions, remember preferences, understand
          product usage, and improve the platform. PostHog helps us measure feature usage, diagnose product friction, and
          understand aggregate behavior. You can control cookies through your browser settings, although some platform
          features may not work correctly without essential cookies.
        </p>
      </LegalSection>

      <LegalSection title="7. Sharing and Service Providers">
        <p>
          We share data only with service providers needed to run Solutionizing, such as hosting, database, analytics,
          email, payment, support, security, and AI-processing providers. These providers process data for platform
          operations and are not allowed to use raw mission responses for their own sales or advertising purposes.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          We use reasonable technical and organizational safeguards to protect account data, mission data, tester responses,
          and transaction records. No online service can guarantee perfect security, so users should protect their login
          credentials and contact us quickly if they suspect unauthorized access.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          For privacy questions, deletion requests, or data requests, contact us at{" "}
          <a href="mailto:hello@solutionizing.com" className="font-semibold text-[var(--electric)] hover:opacity-80 cursor-none">
            hello@solutionizing.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
