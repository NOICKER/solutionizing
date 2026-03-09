import { RequireAuth } from '@/components/RequireAuth'
import { TesterVerificationPage } from '@/components/solutionizing/TesterVerificationPage'

export default function VerifyRoute() {
    return (
        <RequireAuth role="TESTER">
            <TesterVerificationPage />
        </RequireAuth>
    )
}
