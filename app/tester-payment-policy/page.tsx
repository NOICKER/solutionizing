import { LegalList, LegalPageLayout, LegalSection } from "@/components/solutionizing/legal/LegalPageLayout";

export default function TesterPaymentPolicyPage() {
  return (
    <LegalPageLayout
      title="Tester Payment Policy"
      intro="This Tester Payment Policy explains how testers earn coins, how wallet balances convert for withdrawal purposes, and how Solutionizing handles payout processing."
      lastUpdated="March 18, 2026"
    >
      <LegalSection title="1. How Testers Earn Coins">
        <p>
          Testers earn coins by completing eligible missions and submitting accepted feedback through the platform. The coin
          amount for a mission depends on factors such as mission difficulty, expected effort, and platform rules in effect
          at the time the mission is assigned.
        </p>
      </LegalSection>

      <LegalSection title="2. Conversion Rate and Minimum Withdrawal">
        <LegalList
          items={[
            "Current reference conversion rate: 1000 coins = Rs. 10.",
            "Minimum withdrawal threshold: 5000 coins (Rs. 50).",
            "Solutionizing may update payout economics prospectively by updating the platform and applicable policy disclosures.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Withdrawal Processing Time">
        <p>
          Approved withdrawals are generally processed within 3 to 5 business days. Processing timelines may vary based on
          banking rails, UPI availability, holidays, compliance review, fraud checks, and third-party payment provider
          delays.
        </p>
      </LegalSection>

      <LegalSection title="4. Supported Payout Methods">
        <p>Solutionizing currently supports payouts through:</p>
        <LegalList
          items={[
            "UPI",
            "Bank transfer",
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Tax Obligations">
        <p>
          Testers are solely responsible for determining, reporting, and paying any taxes that may arise from earnings
          received through Solutionizing, including obligations under Indian income tax law and any other applicable tax law.
        </p>
      </LegalSection>

      <LegalSection title="6. Incorrect Payout Details and Payment Holds">
        <p>
          Solutionizing is not responsible for payout delays, failures, or reversals caused by incorrect UPI IDs, bank
          details, account holder mismatches, or other inaccurate payout information submitted by a tester.
        </p>
        <p>
          Solutionizing may place a hold on, reject, reverse, or withhold payment where we reasonably suspect fraud, abuse,
          policy violations, fake submissions, repeated mission abandonment, or other misconduct affecting payment integrity.
        </p>
      </LegalSection>

      <LegalSection title="7. Payment Disputes and Contact">
        <p>
          For payment disputes or payout questions, email{" "}
          <a href="mailto:hello@solutionizing.com" className="font-semibold text-primary hover:underline">
            hello@solutionizing.com
          </a>
          . This policy is governed by the laws of India.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
