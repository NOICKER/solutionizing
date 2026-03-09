"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RequireAuth } from '@/components/RequireAuth'
import { BrandMark, SpinnerIcon, primaryButtonClass, textFieldClass } from '@/components/solutionizing/ui'
import { useAuth } from '@/context/AuthContext'
import { apiFetch, isApiClientError } from '@/lib/api/client'

function SelectRoleContent() {
  const router = useRouter()
  const { user, refetch } = useAuth()
  const [founderName, setFounderName] = useState('')
  const [testerName, setTesterName] = useState('')
  const [founderNameError, setFounderNameError] = useState('')
  const [testerNameError, setTesterNameError] = useState('')
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submittingRole, setSubmittingRole] = useState<'FOUNDER' | 'TESTER' | null>(null)

  useEffect(() => {
    if (user?.role === 'FOUNDER') {
      router.replace('/dashboard/founder')
      return
    }

    if (user?.role === 'TESTER') {
      router.replace('/dashboard/tester')
    }
  }, [router, user?.role])

  async function handleSelectRole(role: 'FOUNDER' | 'TESTER') {
    const displayName = role === 'FOUNDER' ? founderName.trim() : testerName.trim()

    setFounderNameError('')
    setTesterNameError('')
    setGlobalError('')

    if (displayName.length < 2) {
      const message = 'Display name must be at least 2 characters'
      if (role === 'FOUNDER') {
        setFounderNameError(message)
      } else {
        setTesterNameError(message)
      }
      return
    }

    setSubmittingRole(role)
    setIsLoading(true)

    try {
      await apiFetch('/api/v1/auth/select-role', {
        method: 'POST',
        body: {
          role,
          displayName,
        },
      })

      await refetch()
      router.push(role === 'FOUNDER' ? '/dashboard/founder' : '/dashboard/tester')
    } catch (error) {
      if (isApiClientError(error) && error.status === 409) {
        router.push(role === 'FOUNDER' ? '/dashboard/founder' : '/dashboard/tester')
        return
      }

      setGlobalError('Something went wrong. Please try again.')
      setIsLoading(false)
      setSubmittingRole(null)
      return
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d77a57] to-[#c4673f] flex items-center justify-center">
              <BrandMark />
            </div>
            <h1 className="text-4xl font-black text-[#1a1625]">SOLUTIONIZING</h1>
          </div>
          <p className="text-xl text-[#6b687a]">How will you use Solutionizing?</p>
        </div>

        <div className="grid gap-6 max-w-3xl mx-auto md:grid-cols-2">
          <div className="bg-[#fdf8f6] rounded-3xl p-8 border-2 border-[#d77a57]">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d77a57] to-[#c4673f] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-[#1a1625] mb-2">I&apos;m a Founder</h2>
              <p className="text-[#6b687a] text-sm">I have a product and need real feedback from real people</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#1a1625] mb-2 uppercase tracking-wide">DISPLAY NAME</label>
              <input
                type="text"
                value={founderName}
                onChange={(event) => setFounderName(event.target.value)}
                placeholder="Your first name"
                className={textFieldClass}
              />
              {founderNameError ? <p className="text-sm text-red-600 mt-1">{founderNameError}</p> : null}
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => void handleSelectRole('FOUNDER')}
              className={`w-full py-3.5 text-base ${primaryButtonClass} flex items-center justify-center gap-2`}
            >
              {submittingRole === 'FOUNDER' && isLoading ? <SpinnerIcon className="w-5 h-5" /> : null}
              CONTINUE AS FOUNDER →
            </button>
          </div>

          <div className="bg-white rounded-3xl p-8 border-2 border-[#e5e4e0]">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-[#1a1625] mb-2">I&apos;m a Tester</h2>
              <p className="text-[#6b687a] text-sm">I want to earn by giving honest feedback on real products</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#1a1625] mb-2 uppercase tracking-wide">DISPLAY NAME</label>
              <input
                type="text"
                value={testerName}
                onChange={(event) => setTesterName(event.target.value)}
                placeholder="Your first name"
                className={textFieldClass}
              />
              {testerNameError ? <p className="text-sm text-red-600 mt-1">{testerNameError}</p> : null}
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => void handleSelectRole('TESTER')}
              className="w-full py-3.5 rounded-[2rem] bg-white border-2 border-[#d77a57] text-[#d77a57] font-black text-base hover:shadow-lg hover:scale-[1.02] transition-all disabled:pointer-events-none disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {submittingRole === 'TESTER' && isLoading ? <SpinnerIcon className="w-5 h-5" /> : null}
              CONTINUE AS TESTER →
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-[#9b98a8] mt-8">You can only choose once. Choose carefully.</p>
        {globalError ? (
          <p className="mt-4 text-center text-sm text-red-600">{globalError}</p>
        ) : null}
      </div>
    </div>
  )
}

export default function SelectRolePage() {
  return (
    <RequireAuth>
      <SelectRoleContent />
    </RequireAuth>
  )
}
