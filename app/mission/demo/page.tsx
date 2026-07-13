"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandMark, StarRow, primaryButtonClass, textFieldClass } from '@/components/solutionizing/ui'

const workspacePageClass = 'min-h-screen bg-[var(--dark)] px-4 py-4 text-[var(--cream)] sm:px-6 lg:px-8'
const workspacePanelClass = 'relative overflow-hidden rounded-[1.25rem] border border-[rgba(255,255,255,0.08)] bg-[var(--dark-surface)]'
const workspaceSectionClass = 'rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[var(--dark-surface)]'
const workspaceEyebrowClass = "inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-3 py-1 text-[0.68rem] font-['DM_Mono'] uppercase tracking-[0.1em] text-[var(--cream)] opacity-60"
const workspaceBackLinkClass = 'font-semibold text-[var(--cream)] opacity-60 transition-opacity hover:opacity-100 cursor-none'
const selectedChoiceClass = 'border-[var(--electric)] bg-[var(--electric-dim)] text-[var(--cream)]'
const unselectedChoiceClass = 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-[var(--cream)] hover:border-[var(--electric-mid)]'

type DemoPhase = 'briefing' | 'questions' | 'success'

interface DemoQuestion {
  id: string
  type: 'MULTIPLE_CHOICE' | 'MULTIPLE_CHOICE_OTHER' | 'RATING_1_5' | 'TEXT_SHORT'
  text: string
  options?: string[]
}

const DEMO_QUESTIONS: DemoQuestion[] = [
  {
    id: 'q1',
    type: 'MULTIPLE_CHOICE_OTHER',
    text: "You just saw how a mission works \u2014 a founder gives you a task, you complete it, then answer questions about your experience. Does that make sense?",
    options: ['Yes, makes sense', 'Sort of', "No, I'm confused"],
  },
  {
    id: 'q2',
    type: 'MULTIPLE_CHOICE',
    text: 'Have you done user testing, feedback, or beta testing before?',
    options: ['Never', 'A little', 'Regularly'],
  },
  {
    id: 'q3',
    type: 'RATING_1_5',
    text: "How confident do you feel giving honest, detailed feedback to a founder you've never met?",
  },
  {
    id: 'q4',
    type: 'TEXT_SHORT',
    text: 'What would make you not want to finish a mission halfway through?',
  },
  {
    id: 'q5',
    type: 'MULTIPLE_CHOICE_OTHER',
    text: 'What are you hoping to get out of testing on Solutionizing?',
    options: ['Extra income', 'Something to do in free time', 'Curiosity about products'],
  },
]

export default function DemoMissionPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<DemoPhase>('briefing')
  const [answers, setAnswers] = useState<Record<number, string | number>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [currentError, setCurrentError] = useState('')
  const [touchedTextQuestions, setTouchedTextQuestions] = useState<Record<number, boolean>>({})

  const current = DEMO_QUESTIONS[currentQuestion]
  const answer = answers[currentQuestion]

  function validateCurrentQuestion() {
    if (current.type === 'TEXT_SHORT') {
      const trimmedLength = typeof answer === 'string' ? answer.trim().length : 0
      if (trimmedLength < 5) return 'Answer too short (min 5 characters)'
      return ''
    }

    if (current.type === 'RATING_1_5') {
      if (answer === undefined || answer === 0) return 'Please select a star rating to continue.'
      return ''
    }

    if (current.type === 'MULTIPLE_CHOICE' || current.type === 'MULTIPLE_CHOICE_OTHER') {
      if (answer === undefined) return 'Please pick one of the choices before continuing.'
      if (answer === '') return 'Please specify your answer.'
      return ''
    }

    return ''
  }

  function handleNextQuestion() {
    if (current.type === 'TEXT_SHORT') {
      setTouchedTextQuestions((prev) => ({ ...prev, [currentQuestion]: true }))
    }

    const error = validateCurrentQuestion()
    setCurrentError(error)
    if (error) return

    setCurrentError('')

    if (currentQuestion === DEMO_QUESTIONS.length - 1) {
      setPhase('success')
      return
    }

    setCurrentQuestion((v) => v + 1)
  }

  // ── Briefing ──────────────────────────────────────────────
  if (phase === 'briefing') {
    return (
      <div className={workspacePageClass}>
        <div className="mx-auto max-w-5xl">
          <div className={`${workspacePanelClass} p-6 sm:p-8 lg:p-10`}>
            <div className="relative z-10">
              <div className="mb-8 text-center">
                <div className={`${workspaceEyebrowClass} mb-4`}>
                  <BrandMark className="h-3.5 w-3.5 text-[var(--cream)]" />
                  Demo Mission
                </div>
                <h1 className="mb-3 text-3xl font-['Fraunces'] italic font-normal text-[var(--cream)] sm:text-5xl">
                  Try a demo mission
                </h1>
                <p className="mx-auto max-w-3xl text-sm leading-7 text-[var(--cream)] opacity-70 sm:text-base">
                  This is a practice mission &mdash; it won&apos;t earn you any coins and nothing gets saved. It&apos;s here so you can see exactly how real missions work before you jump in.
                </p>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <div className={`${workspaceSectionClass} p-5 text-center sm:p-6`}>
                  <div className="mb-3 text-[0.68rem] font-['DM_Mono'] uppercase tracking-[0.1em] text-[var(--cream)] opacity-50">Questions</div>
                  <div className="mb-1 text-3xl font-['Fraunces'] font-bold text-[var(--cream)]">5</div>
                  <div className="text-sm text-[var(--cream)] opacity-60">practice questions</div>
                </div>
                <div className={`${workspaceSectionClass} p-5 text-center sm:p-6`}>
                  <div className="mb-3 text-[0.68rem] font-['DM_Mono'] uppercase tracking-[0.1em] text-[var(--cream)] opacity-50">Estimated time</div>
                  <div className="mb-1 text-3xl font-['Fraunces'] font-bold text-[var(--cream)]">2</div>
                  <div className="text-sm text-[var(--cream)] opacity-60">minutes</div>
                </div>
              </div>

              <div className="mt-12 mb-8 flex flex-col items-center justify-center gap-5 border-t border-[rgba(255,255,255,0.08)] pt-12">
                <style>{`
                  @keyframes begin-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(255,107,26, 0.5); }
                    70% { box-shadow: 0 0 0 25px rgba(255,107,26, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255,107,26, 0); }
                  }
                `}</style>
                <p className="font-['DM_Mono'] text-sm uppercase tracking-[0.15em] text-[var(--electric)] font-semibold text-center">
                  Ready? Your demo begins when you click below
                </p>
                <button
                  className={`cursor-none flex w-full items-center justify-center gap-3 px-14 py-5 text-xl font-bold sm:w-auto sm:text-2xl transition-transform hover:scale-105 ${primaryButtonClass}`}
                  style={{ animation: 'begin-pulse 2s infinite' }}
                  onClick={() => setPhase('questions')}
                >
                  BEGIN DEMO &rarr;
                </button>
              </div>

              <div className="mt-8 flex justify-center">
                <Link href="/dashboard/tester" className={workspaceBackLinkClass}>&larr; Back to dashboard</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Questions ─────────────────────────────────────────────
  if (phase === 'questions') {
    const progress = ((currentQuestion + 1) / DEMO_QUESTIONS.length) * 100
    const currentTextLength = typeof answer === 'string' ? answer.length : 0
    const currentTextError =
      current.type === 'TEXT_SHORT' && touchedTextQuestions[currentQuestion]
        ? (typeof answer === 'string' && answer.trim().length >= 5 ? '' : 'Answer too short (min 5 characters)')
        : ''

    return (
      <div className={workspacePageClass}>
        <div className="mx-auto max-w-4xl">
          <div className={`${workspacePanelClass} p-5 sm:p-6 lg:p-8`}>
            <div className="relative z-10">
              {/* Progress bar */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-[var(--cream)] opacity-60">Question {currentQuestion + 1} of {DEMO_QUESTIONS.length}</span>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">Demo</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.04)]">
                  <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="mb-6">
                <div className={workspaceEyebrowClass}>
                  <BrandMark className="h-3.5 w-3.5 text-[var(--cream)]" />
                  Demo Mission
                </div>
              </div>

              <div className={`${workspaceSectionClass} mb-6 p-6 sm:p-8`}>
                <h2 className="mb-2 text-center text-xl font-['Fraunces'] italic font-normal text-[var(--cream)]">{current.text}</h2>
                <p className="mb-6 text-center text-sm text-[var(--cream)] opacity-40">Tip: explain your reasoning before your answer. Vague or one-word responses won&apos;t help the founder.</p>

                {/* TEXT_SHORT */}
                {current.type === 'TEXT_SHORT' ? (
                  <div>
                    <textarea
                      value={typeof answer === 'string' ? answer : ''}
                      onChange={(event) => {
                        setAnswers((curr) => ({ ...curr, [currentQuestion]: event.target.value }))
                        setTouchedTextQuestions((prev) => ({ ...prev, [currentQuestion]: true }))
                        setCurrentError('')
                      }}
                      rows={4}
                      maxLength={500}
                      placeholder="Your answer..."
                      className={`${textFieldClass} resize-none`}
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-[var(--cream)] opacity-60">
                      <span>Minimum 5 characters</span>
                      <span>{currentTextLength} / 500 characters</span>
                    </div>
                    {currentTextError ? <p className="mt-2 text-sm text-red-400">{currentTextError}</p> : null}
                  </div>
                ) : null}

                {/* RATING_1_5 */}
                {current.type === 'RATING_1_5' ? (
                  <div className="flex flex-col items-center">
                    <div className="mb-3 flex items-center justify-center">
                      <StarRow
                        value={Number(answer ?? 0)}
                        size={48}
                        onChange={(val) => setAnswers((curr) => ({ ...curr, [currentQuestion]: val }))}
                      />
                    </div>
                  </div>
                ) : null}

                {/* MULTIPLE_CHOICE (no Other) */}
                {current.type === 'MULTIPLE_CHOICE' ? (
                  <div className="space-y-3">
                    {(current.options ?? []).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setAnswers((curr) => ({ ...curr, [currentQuestion]: option }))
                          setCurrentError('')
                        }}
                        className={`flex w-full items-start gap-4 rounded-[1.75rem] border-2 p-4 text-left transition-colors ${
                          answer === option ? selectedChoiceClass : unselectedChoiceClass
                        }`}
                      >
                        <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          answer === option ? 'border-primary bg-primary' : 'border-[rgba(255,255,255,0.08)] bg-[var(--dark-surface)]'
                        }`}>
                          {answer === option ? <span className="h-2.5 w-2.5 rounded-full bg-[var(--dark-surface)]" /> : null}
                        </span>
                        <span className="flex-1 break-words text-base font-semibold leading-6">{option}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {/* MULTIPLE_CHOICE_OTHER (with Other free-text input) */}
                {current.type === 'MULTIPLE_CHOICE_OTHER' ? (() => {
                  const isOther = answer !== undefined && !current.options?.includes(answer as string);
                  return (
                    <div className="space-y-3">
                      {(current.options ?? []).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setAnswers((curr) => ({ ...curr, [currentQuestion]: option }))
                            setCurrentError('')
                          }}
                          className={`flex w-full items-start gap-4 rounded-[1.75rem] border-2 p-4 text-left transition-colors ${
                            answer === option ? selectedChoiceClass : unselectedChoiceClass
                          }`}
                        >
                          <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            answer === option ? 'border-primary bg-primary' : 'border-[rgba(255,255,255,0.08)] bg-[var(--dark-surface)]'
                          }`}>
                            {answer === option ? <span className="h-2.5 w-2.5 rounded-full bg-[var(--dark-surface)]" /> : null}
                          </span>
                          <span className="flex-1 break-words text-base font-semibold leading-6">{option}</span>
                        </button>
                      ))}

                      {/* Other option button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isOther) {
                            setAnswers((curr) => ({ ...curr, [currentQuestion]: '' }))
                            setCurrentError('')
                          }
                        }}
                        className={`flex w-full items-start gap-4 rounded-[1.75rem] border-2 p-4 text-left transition-colors ${
                          isOther ? selectedChoiceClass : unselectedChoiceClass
                        }`}
                      >
                        <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          isOther ? 'border-primary bg-primary' : 'border-[rgba(255,255,255,0.08)] bg-[var(--dark-surface)]'
                        }`}>
                          {isOther ? <span className="h-2.5 w-2.5 rounded-full bg-[var(--dark-surface)]" /> : null}
                        </span>
                        <span className="flex-1 break-words text-base font-semibold leading-6">Other (please specify)</span>
                      </button>

                      {/* Other free-text input */}
                      {isOther ? (
                        <div className="mt-3 pl-4 pr-1">
                          <input
                            type="text"
                            value={answer as string}
                            onChange={(e) => {
                              setAnswers((curr) => ({ ...curr, [currentQuestion]: e.target.value }))
                              setCurrentError('')
                            }}
                            placeholder="Type your answer here..."
                            autoFocus
                            className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-[var(--cream)] placeholder-[var(--cream)] placeholder-opacity-40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })() : null}
              </div>

              {currentError && current.type !== 'TEXT_SHORT' ? <p className="mb-4 text-sm text-red-400">{currentError}</p> : null}

              <div className="mb-4 flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
                <button className={workspaceBackLinkClass} onClick={() => {
                  if (currentQuestion > 0) {
                    setCurrentQuestion((v) => v - 1)
                    setCurrentError('')
                  } else {
                    setPhase('briefing')
                  }
                }}>&larr; Back</button>
                <button className={`cursor-none w-full px-8 py-3.5 sm:w-auto ${primaryButtonClass}`} onClick={handleNextQuestion}>
                  {currentQuestion === DEMO_QUESTIONS.length - 1 ? 'SUBMIT DEMO \u2192' : 'NEXT \u2192'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────
  return (
    <div className={workspacePageClass}>
      <div className="mx-auto max-w-4xl">
        <div className={`${workspacePanelClass} p-8 text-center sm:p-10 lg:p-12`}>
          <div className="relative z-10">
            <div className="mb-6 inline-flex h-28 w-28 items-center justify-center rounded-full bg-[var(--electric)] shadow-[0_20px_45px_-22px_rgba(249,124,90,0.55)]">
              <svg className="w-14 h-14 text-[var(--cream)]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className={`${workspaceEyebrowClass} mb-4`}>
              <BrandMark className="h-3.5 w-3.5 text-[var(--cream)]" />
              Demo complete
            </div>
            <h1 className="mb-3 text-4xl font-[family-name:var(--font-fraunces)] italic font-normal tracking-tight text-[var(--cream)]">
              Demo complete!
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-[var(--cream)] opacity-60">
              Thank you for trying the demo! This was just practice &mdash; nothing was saved and no coins were earned.
              Real missions work the exact same way: a founder assigns you a task, you answer questions about it, and you earn coins for your feedback.
            </p>

            <button className={`cursor-none mb-4 px-10 py-3.5 ${primaryButtonClass}`} onClick={() => router.push('/dashboard/tester')}>
              BACK TO DASHBOARD
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
