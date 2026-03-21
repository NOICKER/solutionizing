import { LegalList, LegalPageLayout, LegalSection } from "@/components/solutionizing/legal/LegalPageLayout";

export default function RefundPage() {
  return (
    <LegalPageLayout
      title="Refund and Cancellation Policy"
      intro="This Refund and Cancellation Policy explains how Solutionizing handles coin refunds, mission cancellations, wallet adjustments, and transaction disputes on the platform."
      lastUpdated="March 18, 2026"
    >
      <LegalSection title="1. Coin Purchases">
        <p>
          Coin purchases are non-refundable once those coins have been used to launch a mission, pay for tester assignments,
          or otherwise fund platform activity. Coin purchases are intended for use only within the Solutionizing platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Unused Coins on Account Deletion">
        <p>
          If you delete your account and you still have unused coins in your wallet, Solutionizing may refund the value of
          those unused coins to the original payment method used for purchase. Refunds for unused coins are generally
          processed within 7 to 10 business days after account deletion and verification.
        </p>
      </LegalSection>

      <LegalSection title="3. Mission Cancellation Before Tester Assignment">
        <p>
          If a founder cancels a mission before any tester is assigned to that mission, the founder will receive a full coin
          refund back to the platform wallet for that mission.
        </p>
      </LegalSection>

      <LegalSection title="4. Mission Cancellation After Tester Assignment">
        <p>
          If a founder cancels a mission after testers have already been assigned, coins allocated to incomplete or unfilled
          slots will be refunded to the founder&apos;s wallet. Coins allocated to completed assignments, completed tester work,
          or already-earned tester rewards are non-refundable.
        </p>
      </LegalSection>

      <LegalSection title="5. Withdrawal Requests">
        <p>
          Once a tester submits a withdrawal request, that withdrawal request cannot be cancelled. Wallet balances are
          reduced when the request is submitted and remain unavailable while the withdrawal is under review and processing.
        </p>
      </LegalSection>

      <LegalSection title="6. Transaction Disputes">
        <p>
          Any dispute relating to a coin purchase, refund, wallet adjustment, mission cancellation credit, or withdrawal
          must be raised within 7 days of the relevant transaction by emailing{" "}
          <a href="mailto:hello@solutionizing.com" className="font-semibold text-primary hover:underline">
            hello@solutionizing.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="7. Governing Law">
        <p>
          This Refund and Cancellation Policy is governed by the laws of India. Any disputes will be handled in accordance
          with applicable Indian law and the dispute resolution terms stated in our Terms of Service.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
