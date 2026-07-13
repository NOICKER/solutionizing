"use client"

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useState } from 'react'

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
      className={`rounded-2xl border p-6 ${className}`}
      style={{ background: 'var(--bg-light)', borderColor: 'var(--border)' }}
    >
      {children}
    </section>
  )
}

function FaqCard({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <div 
      style={{ 
        background: 'var(--cream)', 
        border: `1px solid ${isOpen ? 'var(--electric)' : isHovered ? 'var(--border-strong)' : 'var(--border)'}`, 
        borderRadius: '10px', 
        marginBottom: '0.6rem', 
        transition: 'border-color 0.2s' 
      }} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button className="cursor-none"
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.9rem 1.1rem', background: 'none', border: 'none', cursor: 'none', textAlign: 'left' }}
      >
        <span style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{question}</span>
        <ChevronDown
          style={{ color: isOpen ? 'var(--electric)' : 'var(--ink-soft)', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {isOpen ? <div style={{ padding: '0 1.1rem 0.9rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>{answer}</div> : null}
    </div>
  )
}

function FaqColumn({ title, items, activeIndex, onToggle, highlighted }: { title: string; items: typeof founderFaqs | typeof testerFaqs; activeIndex: number | null; onToggle: (index: number) => void; highlighted: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--ink)', fontWeight: 400 }}>{title}</h3>
        {highlighted ? (
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.1em', background: 'var(--electric-dim)', border: '1px solid var(--electric-mid)', color: 'var(--electric)', borderRadius: '100px', padding: '0.2rem 0.7rem', whiteSpace: 'nowrap' }}>
            RECOMMENDED
          </span>
        ) : null}
      </div>
      <div>
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
            <div style={{ background: 'var(--electric-dim)', border: '1px solid var(--electric-mid)', borderRadius: '100px', padding: '0.25rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--electric)', letterSpacing: '0.1em' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--electric)' }} />
              {role === 'FOUNDER' ? 'FOUNDER SUPPORT' : 'TESTER SUPPORT'}
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.6rem', color: 'var(--ink)', fontWeight: 400, marginTop: '0.75rem' }}>Support Center</h2>
            <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>How can we help you today?</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', margin: 0 }}>System Status</h3>
            <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.82rem', color: 'var(--ink-soft)', margin: '0.2rem 0 0 0' }}>Last checked just now</p>
          </div>
          <div style={{ background: 'rgba(74,197,128,0.1)', border: '1px solid rgba(74,197,128,0.25)', borderRadius: '100px', padding: '0.4rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: '#1e7a47' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1e7a47' }} />
            All systems operational
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="mb-6">
          <h3 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.4rem', color: 'var(--ink)', fontWeight: 400, margin: 0 }}>Frequently Asked Questions</h3>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink-soft)', margin: '0.3rem 0 0 0' }}>Browse the most common questions for founders and testers in one place.</p>
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

      <section style={{ background: 'var(--dark)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--cream)', fontWeight: 400, margin: 0 }}>Still need help?</h3>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'rgba(250,247,242,0.5)', margin: '0.3rem 0 0 0' }}>Our team usually responds within one business day.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:hello@solutionizing.com" style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.65rem 1.4rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.88rem', cursor: 'none', textDecoration: 'none', display: 'inline-flex' }}>
            Email Support
          </a>
          <Link href="/contact" style={{ background: 'transparent', border: '1.5px solid rgba(250,247,242,0.25)', color: 'var(--cream)', borderRadius: '100px', padding: '0.6rem 1.4rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.88rem', cursor: 'none', textDecoration: 'none', display: 'inline-flex' }}>
            Visit Contact Page
          </Link>
        </div>
      </section>
    </div>
  )
}
