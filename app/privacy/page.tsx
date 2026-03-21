import { LegalList, LegalPageLayout, LegalSection } from "@/components/solutionizing/legal/LegalPageLayout";

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      intro="This Privacy Policy explains how Solutionizing collects, uses, stores, shares, and protects personal data for founders, testers, and visitors. We operate as a Data Fiduciary under the Digital Personal Data Protection Act, 2023 (DPDP Act), and we process digital personal data to operate our software platform and marketplace lawfully."
      lastUpdated="March 18, 2026"
    >
      <LegalSection title="1. Data Fiduciary and Scope">
        <p>
          Solutionizing is the Data Fiduciary for personal data processed through the platform. This Privacy Policy applies
          to our website, dashboards, mission workflows, onboarding flows, communications, coin purchases, tester payouts,
          and support interactions.
        </p>
      </LegalSection>

      <LegalSection title="2. What Data We Collect">
        <LegalList
          items={[
            "Account data such as name, email address, login details, role, company name, display name, and profile details.",
            "Platform activity data such as missions created, questions answered, mission responses, reputation events, support activity, and transaction history.",
            "Technical and device data such as IP address, browser type, operating system, device information, preferred device, session logs, and error diagnostics.",
            "Usage and analytics data such as page visits, clicks, session replay data, referral information, and feature interaction events.",
            "Payment and payout data such as coin purchases, withdrawal requests, UPI IDs, bank transfer details, and related payment verification metadata.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. How We Use Personal Data">
        <LegalList
          items={[
            "To create and manage accounts, authenticate users, and maintain platform security.",
            "To match founders with suitable testers and testers with relevant missions.",
            "To process coin purchases, mission funding, tester rewards, withdrawals, and account refunds where applicable.",
            "To communicate mission updates, account notices, support messages, policy updates, and transactional emails.",
            "To improve product quality, measure usage, investigate abuse, prevent fraud, and comply with legal obligations.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Legal Basis and Consent">
        <p>
          We process digital personal data for lawful purposes, including with your consent, for performance of our contract
          with you, for legitimate platform operations consistent with applicable law, and where processing is required to
          comply with legal, regulatory, tax, accounting, anti-fraud, or dispute-resolution obligations.
        </p>
      </LegalSection>

      <LegalSection title="5. Data Storage and Cross-Border Processing">
        <p>
          Solutionizing stores and processes data using third-party infrastructure providers, including Supabase servers and
          other vendors that may be located outside India. As a result, your personal data may be processed outside India,
          subject to applicable Indian law and any restrictions notified by the Government of India under the DPDP Act.
        </p>
      </LegalSection>

      <LegalSection title="6. Data Retention">
        <p>
          We retain active account data while your account remains active and for as long as reasonably necessary to provide
          the platform, maintain transaction records, resolve disputes, and comply with legal obligations. If you delete your
          account, we aim to delete or anonymize personal data within 30 days of deletion, unless longer retention is
          required by law, tax, fraud prevention, or payment reconciliation obligations.
        </p>
      </LegalSection>

      <LegalSection title="7. Your Rights Under the DPDP Act">
        <LegalList
          items={[
            "Right to access information about the personal data we process about you.",
            "Right to correction, completion, and updating of inaccurate or incomplete personal data.",
            "Right to erasure of personal data, subject to retention required for the stated purpose or for compliance with law.",
            "Right to withdraw consent where processing is based on consent.",
            "Right to grievance redressal by contacting us directly before escalating to the relevant authority.",
          ]}
        />
      </LegalSection>

      <LegalSection title="8. How to Exercise Your Rights">
        <p>
          To access, correct, update, erase, or otherwise raise a privacy request regarding your personal data, email{" "}
          <a href="mailto:hello@solutionizing.com" className="font-semibold text-primary hover:underline">
            hello@solutionizing.com
          </a>
          . We may request reasonable verification information before acting on a request.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies, Analytics, and Monitoring">
        <p>
          We use cookies and similar technologies to remember preferences, secure sessions, and understand product usage.
          We use PostHog for analytics and usage measurement, and Sentry for error monitoring, diagnostics, and service
          stability. You can manage analytics consent through our cookie banner where available.
        </p>
      </LegalSection>

      <LegalSection title="10. Third-Party Service Providers">
        <p>We use third-party service providers to support platform operations, including:</p>
        <LegalList
          items={[
            "Supabase for authentication, database, and application infrastructure.",
            "Resend for transactional email delivery.",
            "Stripe and/or Razorpay for payment collection, processing, and related financial workflows.",
            "Other service providers that help us with analytics, security monitoring, infrastructure, support, and fraud prevention.",
          ]}
        />
      </LegalSection>

      <LegalSection title="11. Children">
        <p>
          Solutionizing is not intended for children and is not available to persons under 18 years of age. If we learn that
          we have collected personal data from a person under 18 in violation of our policies, we may suspend the relevant
          account and delete the associated data, subject to legal obligations.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we may notify users by email,
          in-product notice, or both. The revised version will become effective on the date stated at the top of this page.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact and Data Fiduciary Details">
        <p>
          Data Fiduciary: Solutionizing
          <br />
          Contact email:{" "}
          <a href="mailto:hello@solutionizing.com" className="font-semibold text-primary hover:underline">
            hello@solutionizing.com
          </a>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
