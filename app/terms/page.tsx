import { LegalList, LegalPageLayout, LegalSection } from "@/components/solutionizing/legal/LegalPageLayout";

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      intro="These Terms of Service govern your access to and use of Solutionizing, a two-sided marketplace that connects founders seeking product feedback with testers who complete missions in exchange for in-platform coins."
      lastUpdated="March 18, 2026"
    >
      <LegalSection title="1. Acceptance of Terms">
        <p>
          By creating an account, accessing the platform, purchasing coins, launching a mission, or completing a mission,
          you agree to be bound by these Terms of Service, our Privacy Policy, and any platform rules or policies we publish
          from time to time.
        </p>
        <p>
          If you do not agree to these terms, you must not use Solutionizing. We may update these terms from time to time,
          and your continued use of the platform after an update takes effect means you accept the revised terms.
        </p>
      </LegalSection>

      <LegalSection title="2. Description of the Platform">
        <p>
          Solutionizing operates a software platform and two-sided marketplace where founders create paid testing missions
          and testers complete those missions by providing structured product feedback. Solutionizing facilitates matching,
          coin-based payments, reputation scoring, communication, moderation, and payout workflows, but is not a party to
          any independent contract you may try to create outside the platform.
        </p>
      </LegalSection>

      <LegalSection title="3. Eligibility">
        <p>
          You must be at least 18 years old to use Solutionizing. Residents of India may use the platform, and persons
          outside India may use the platform only if such use is lawful in their jurisdiction and they are able to comply
          with these terms, Indian law, and applicable payment, tax, and sanctions rules.
        </p>
      </LegalSection>

      <LegalSection title="4. Account Registration and Responsibilities">
        <LegalList
          items={[
            "You must provide accurate, current, and complete information when registering and when maintaining your account.",
            "You are responsible for safeguarding your login credentials and for all activity that occurs under your account.",
            "You must promptly update your email address, profile details, and payout details when they change.",
            "You may not sell, transfer, lend, or share your account with another person.",
            "You must notify Solutionizing immediately if you suspect unauthorized use of your account.",
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Founder Obligations">
        <LegalList
          items={[
            "Provide accurate product, mission, and testing instructions, including truthful descriptions of what testers will review.",
            "Maintain sufficient coins in your account to fund mission costs, tester rewards, and applicable platform charges.",
            "Submit only lawful, non-misleading, and non-deceptive missions.",
            "Do not ask testers for passwords, payment credentials, government ID numbers, or other sensitive personal information unless expressly approved by Solutionizing in writing.",
            "Do not use the platform to manipulate reviews, misrepresent products, run fake research, or harvest tester information.",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Tester Obligations">
        <LegalList
          items={[
            "Provide honest, original, and experience-based feedback.",
            "Do not plagiarize, copy another tester's work, or submit AI-generated or scripted responses as your own lived testing feedback.",
            "Complete missions diligently and on time, and avoid repeated abandonment or low-effort submissions.",
            "Do not misrepresent your identity, device setup, expertise, or testing environment.",
            "Use only the mission access and information provided for the authorized testing purpose.",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Coin System">
        <p>
          Coins are the in-platform unit used to purchase mission capacity, reward tester participation, and manage
          internal wallet balances. Coins are not legal tender, are not bank deposits, and do not represent stored value
          regulated as currency, securities, or prepaid instruments unless applicable law expressly requires otherwise.
        </p>
        <p>
          Coins do not have guaranteed cash value, and no right to cash redemption arises unless and until a withdrawal is
          approved and processed by Solutionizing under the applicable payment policy.
        </p>
      </LegalSection>

      <LegalSection title="8. Payment Terms and Refunds">
        <LegalList
          items={[
            "Coin purchases are final once completed.",
            "Refunds are available only as expressly described in our Refund and Cancellation Policy.",
            "If an account is deleted, unspent coins may be refunded to the original payment method, subject to verification, platform review, chargeback history, and applicable law.",
            "Coins already used to fund launched or completed mission activity are non-refundable unless Solutionizing determines otherwise in its sole discretion or applicable law requires a refund.",
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Intellectual Property">
        <p>
          Solutionizing and its licensors own all rights, title, and interest in the platform, software, brand assets,
          workflows, and platform content other than user-submitted mission materials and tester feedback.
        </p>
        <p>
          As between a founder and a tester, any feedback, notes, responses, recordings, annotations, or other deliverables
          submitted by a tester in response to a commissioned mission become the property of the founder who commissioned the
          mission, and the tester assigns all right, title, and interest in that mission-specific deliverable to the founder
          to the extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="10. Prohibited Conduct">
        <LegalList
          items={[
            "Creating fake accounts or impersonating another person or company.",
            "Spam, scraping, automated abuse, or any attempt to reverse engineer or disrupt the platform.",
            "Gaming the reputation system, colluding to inflate metrics, or submitting fabricated mission activity.",
            "Harassment, hate speech, intimidation, or abusive conduct toward founders, testers, or Solutionizing staff.",
            "Using the platform to distribute malware, phishing links, infringing content, or unlawful material.",
          ]}
        />
      </LegalSection>

      <LegalSection title="11. Suspension and Termination">
        <p>
          Solutionizing may review, suspend, restrict, or terminate your account, missions, payouts, or access to coins at
          any time if we believe you have violated these terms, created legal or safety risk, engaged in fraud, abused the
          platform, or harmed other users or the platform ecosystem.
        </p>
      </LegalSection>

      <LegalSection title="12. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Solutionizing provides the platform on an &quot;as is&quot; and &quot;as available&quot;
          basis without warranties of any kind. We do not guarantee uninterrupted service, uninterrupted payouts, any
          minimum level of missions, any specific commercial outcome, or any particular quality of tester or founder conduct.
        </p>
        <p>
          To the extent permitted under applicable law, Solutionizing, its affiliates, and its personnel will not be liable
          for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, data,
          goodwill, or business opportunity arising out of or relating to the use of the platform.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing Law, Jurisdiction, and Contact">
        <p>
          These terms are governed by the laws of India. Subject to applicable consumer law, courts located in Delhi, India
          shall have exclusive jurisdiction over disputes arising out of or relating to these terms or the platform.
        </p>
        <p>
          For questions, complaints, or legal notices, contact Solutionizing at{" "}
          <a href="mailto:hello@solutionizing.com" className="font-semibold text-primary hover:underline">
            hello@solutionizing.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
