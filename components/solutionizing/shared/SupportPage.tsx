"use client"

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import { outlineButtonClass, primaryButtonClass } from '@/components/solutionizing/ui'

type SupportRole = 'FOUNDER' | 'TESTER'

const founderFaqs = [
  {
    question: 'How do coins work?',
    answer:
      'Coins are the currency you use to fund missions. Each mission costs coins based on difficulty and number of testers. You can buy coin packs from the Wallets section.',
  },
  {
    question: 'How are testers matched to my mission?',
    answer:
      'Our algorithm matches testers based on their expertise tags, device profile, reputation score, and availability. Higher difficulty missions require higher reputation testers.',
  },
  {
    question: 'What happens if a tester abandons my mission?',
    answer:
      'Abandoned assignments are automatically reassigned to a new tester. Your mission continues without interruption and you are not charged for incomplete assignments.',
  },
  {
    question: 'When do I get my results?',
    answer:
      'Results appear in your mission insights page as soon as testers start submitting. You do not need to wait for all testers to finish.',
  },
  {
    question: 'Can I pause or cancel a mission?',
    answer:
      'Yes. You can pause an active mission at any time from your dashboard. If you cancel you will receive a refund for any unfilled tester slots.',
  },
] as const

const testerFaqs = [
  {
    question: 'How do I earn coins?',
    answer:
      'You earn coins by completing missions assigned to you. The amount depends on the mission difficulty. Higher difficulty missions pay more coins.',
  },
  {
    question: 'How do I withdraw my earnings?',
    answer:
      'Once you have at least 5,000 coins you can request a withdrawal from your dashboard. Payments are processed within 3 to 5 business days.',
  },
  {
    question: 'What affects my reputation score?',
    answer:
      'Completing missions on time, receiving high ratings from founders, and giving detailed feedback all improve your score. Abandoning missions or receiving low effort flags will reduce it.',
  },
  {
    question: 'What happens if I abandon a mission?',
    answer:
      'Abandoning a mission reduces your reputation score by 4 points and may affect the quality of missions you are matched with in future.',
  },
  {
    question: 'How do I get matched with more missions?',
    answer:
      'Keep your availability toggle on in settings, complete your expertise tags and device profile, and maintain a high reputation score.',
  },
] as const

function SectionCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-card border border-[#ece6df] bg-white/95 p-6 shadow-[0_20px_50px_-40px_rgba(26,22,37,0.22)] dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      {children}
    </section>
  )
}

function FaqCard({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-card border border-[#efe8e1] bg-[#fffdfa] transition-colors hover:border-[#e2d7cd] dark:border-gray-700 dark:bg-gray-900/60 dark:hover:border-gray-600">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
      >
        <span className="text-sm font-bold leading-6 text-[#1a1625] dark:text-white">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-[#8b8797] transition-transform dark:text-gray-400 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen ? <div className="px-4 pb-4 text-sm leading-6 text-[#6b687a] dark:text-gray-400">{answer}</div> : null}
    </div>
  )
}

function FaqColumn({
  title,
  items,
  activeIndex,
  onToggle,
  highlighted,
}: {
  title: string
  items: typeof founderFaqs | typeof testerFaqs
  activeIndex: number | null
  onToggle: (index: number) => void
  highlighted: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-[#1a1625] dark:text-white">{title}</h3>
        {highlighted ? (
          <span className="rounded-full border border-[#ead2c4] bg-[#fff4ef] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#c4673f]">
            Recommended
          </span>
        ) : null}
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <FaqCard
            key={item.question}
            question={item.question}
            answer={item.answer}
            isOpen={activeIndex === index}
            onToggle={() => onToggle(index)}
          />
        ))}
      </div>
    </div>
  )
}

export function SupportPage({ role }: { role: SupportRole }) {
  const [openFounderFaq, setOpenFounderFaq] = useState<number | null>(0)
  const [openTesterFaq, setOpenTesterFaq] = useState<number | null>(0)

  return (
    <div className="space-y-4">
      <SectionCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#eee5df] bg-white/85 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#9b98a8]">
              <span className="h-2 w-2 rounded-full bg-[#d77a57]" />
              {role === 'FOUNDER' ? 'Founder support' : 'Tester support'}
            </div>
            <h2 className="text-3xl font-black text-[#1a1625] dark:text-white sm:text-4xl">Support Center</h2>
            <p className="mt-2 text-sm text-[#6b687a] dark:text-gray-400 sm:text-base">How can we help you today?</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-[#1a1625] dark:text-white">System Status</h3>
            <p className="mt-2 text-sm text-[#6b687a] dark:text-gray-400">Last checked just now</p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full border border-green-100 bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            All systems operational
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="mb-6">
          <h3 className="text-lg font-black text-[#1a1625] dark:text-white">Frequently Asked Questions</h3>
          <p className="mt-2 text-sm text-[#6b687a] dark:text-gray-400">
            Browse the most common questions for founders and testers in one place.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <FaqColumn
            title="For Founders"
            items={founderFaqs}
            activeIndex={openFounderFaq}
            onToggle={(index) => setOpenFounderFaq((current) => (current === index ? null : index))}
            highlighted={role === 'FOUNDER'}
          />
          <FaqColumn
            title="For Testers"
            items={testerFaqs}
            activeIndex={openTesterFaq}
            onToggle={(index) => setOpenTesterFaq((current) => (current === index ? null : index))}
            highlighted={role === 'TESTER'}
          />
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-[#1a1625] dark:text-white">Still need help?</h3>
            <p className="mt-2 text-sm text-[#6b687a] dark:text-gray-400">
              Our team usually responds within one business day.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="mailto:hello@solutionizing.com" className={`px-5 py-3 text-sm ${primaryButtonClass}`}>
              Email Support
            </a>
            <Link href="/contact" className={`px-5 py-3 text-sm ${outlineButtonClass}`}>
              Visit Contact Page
            </Link>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
