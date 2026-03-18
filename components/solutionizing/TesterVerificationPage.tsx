"use client"

import Link from 'next/link'
import { testerBodyFont, testerDisplayFont } from '@/components/tester/testerTheme'
import { BrandMark } from '@/components/solutionizing/ui'

export function TesterVerificationPage() {
    return (
        <div className={`min-h-screen bg-[#faf9f7] ${testerBodyFont.className} p-8`}>
            <div className="mx-auto max-w-4xl">
                <div className="mb-12 flex items-center justify-center">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d77a57] to-[#c4673f]">
                            <BrandMark className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <div className="mb-1 text-xs text-[#9b98a8]">SOLUTIONIZING</div>
                            <div className={`${testerDisplayFont.className} text-2xl font-black text-[#1a1625]`}>Tester Verification</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-panel border border-[#e5e4e0] bg-white p-10 shadow-sm text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <span className="material-symbols-outlined text-4xl">verified_user</span>
                    </div>

                    <h1 className={`${testerDisplayFont.className} mb-4 text-3xl font-black text-[#1a1625]`}>
                        Verify Your Device
                    </h1>
                    <p className="mx-auto mb-8 max-w-md text-lg text-[#6b687a]">
                        Device verification ensures founders receive accurate technical feedback from confirmed environments.
                    </p>

                    <div className="mx-auto mb-10 max-w-lg rounded-2xl bg-[#f8f9fc] p-6 text-left">
                        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#9b98a8]">Verification Steps</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-green-500">check_circle</span>
                                <span className="text-[#1a1625] font-medium">Account created & verified</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-[#d77a57]">radio_button_unchecked</span>
                                <span className="text-[#1a1625] font-medium">Environment & Resolution check</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-[#d77a57]">radio_button_unchecked</span>
                                <span className="text-[#1a1625] font-medium">Hardware profile validation</span>
                            </li>
                        </ul>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button
                            type="button"
                            className="rounded-full bg-blue-600 px-8 py-3.5 text-sm font-black text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
                            disabled
                        >
                            Start Verification
                        </button>
                        <p className="mb-6 max-w-sm text-center text-xs text-[#9b98a8]">
                            Coming soon — identity verification will be available shortly.
                        </p>

                        {/* TODO: wire to PATCH /api/v1/tester/profile/verify when device verification endpoint is ready */}

                        <Link
                            href="/dashboard/tester"
                            className="rounded-full border-2 border-[#e5e4e0] bg-white px-8 py-3 text-sm font-bold text-[#1a1625] transition-all hover:bg-[#f3f3f5]"
                        >
                            BACK TO DASHBOARD
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
