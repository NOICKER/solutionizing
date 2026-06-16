const fs = require('fs');

const path = 'c:/Users/Shubhi Mishra/Desktop/solutionizing 5/components/solutionizing/shared/SupportPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. SectionCard component
code = code.replace(
  /function SectionCard\([\s\S]*?<\/section>\s*\}/,
  `function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem 2rem', ...(className ? {} : {}) }}>
      {children}
    </section>
  )
}`
);

// 2. FaqCard component
code = code.replace(
  /function FaqCard\([\s\S]*?<\/div>\s*\)\s*\}/,
  `function FaqCard({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '0.6rem', transition: 'border-color 0.2s' }} className={isOpen ? 'faq-open' : 'faq-closed'}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.9rem 1.1rem', background: 'none', border: 'none', cursor: 'none', textAlign: 'left' }}
      >
        <span style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{question}</span>
        <ChevronDown
          style={{ color: 'var(--ink-soft)', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {isOpen ? <div style={{ padding: '0 1.1rem 0.9rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)', lineHeight: 1.6 }}>{answer}</div> : null}
    </div>
  )
}`
);

// 3. FaqColumn component
code = code.replace(
  /function FaqColumn\([\s\S]*?<\/div>\s*\)\s*\}/,
  `function FaqColumn({ title, items, activeIndex, onToggle, highlighted }: { title: string; items: typeof founderFaqs | typeof testerFaqs; activeIndex: number | null; onToggle: (index: number) => void; highlighted: boolean }) {
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
}`
);

// 4. Header Card
code = code.replace(
  /<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-\[#eee5df\] bg-white\/85 px-3 py-1 text-\[0\.68rem\] font-bold uppercase tracking-\[0\.22em\] text-\[#9b98a8\]">/g,
  `<div style={{ background: 'var(--electric-dim)', border: '1px solid var(--electric-mid)', borderRadius: '100px', padding: '0.25rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--electric)', letterSpacing: '0.1em' }}>`
);
code = code.replace(/<span className="h-2 w-2 rounded-full bg-\[#d77a57\]" \/>/g, `<span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--electric)' }} />`);
code = code.replace(/<h2 className="text-3xl font-black text-\[#1a1625\] dark:text-white sm:text-4xl">Support Center<\/h2>/g, `<h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.6rem', color: 'var(--ink)', fontWeight: 400, marginTop: '0.75rem' }}>Support Center</h2>`);
code = code.replace(/<p className="mt-2 text-sm text-\[#6b687a\] dark:text-gray-400 sm:text-base">How can we help you today\?<\/p>/g, `<p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>How can we help you today?</p>`);

// 5. System Status Card
code = code.replace(/<h3 className="text-lg font-black text-\[#1a1625\] dark:text-white">System Status<\/h3>/g, `<h3 style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', margin: 0 }}>System Status</h3>`);
code = code.replace(/<p className="mt-2 text-sm text-\[#6b687a\] dark:text-gray-400">Last checked just now<\/p>/g, `<p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.82rem', color: 'var(--ink-soft)', margin: '0.2rem 0 0 0' }}>Last checked just now</p>`);
code = code.replace(
  /<div className="inline-flex items-center gap-3 rounded-full border border-green-100 bg-green-50 px-4 py-2 text-sm font-bold text-green-700">/g,
  `<div style={{ background: 'rgba(39, 174, 96, 0.08)', border: '1px solid rgba(39, 174, 96, 0.25)', borderRadius: '100px', padding: '0.4rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: '#27ae60' }}>`
);
code = code.replace(/<span className="h-2\.5 w-2\.5 rounded-full bg-green-500" \/>/g, `<span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27ae60' }} />`);

// 6. FAQ Section Header
code = code.replace(/<h3 className="text-lg font-black text-\[#1a1625\] dark:text-white">Frequently Asked Questions<\/h3>/g, `<h3 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.4rem', color: 'var(--ink)', fontWeight: 400, margin: 0 }}>Frequently Asked Questions</h3>`);
code = code.replace(/<p className="mt-2 text-sm text-\[#6b687a\] dark:text-gray-400">\s*Browse the most common questions for founders and testers in one place\.\s*<\/p>/g, `<p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink-soft)', margin: '0.3rem 0 0 0' }}>Browse the most common questions for founders and testers in one place.</p>`);

// 7. "Still need help?" Card
code = code.replace(/<h3 className="text-lg font-black text-\[#1a1625\] dark:text-white">Still need help\?<\/h3>/g, `<h3 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1.1rem', color: 'var(--ink)', fontWeight: 400, margin: 0 }}>Still need help?</h3>`);
code = code.replace(/<p className="mt-2 text-sm text-\[#6b687a\] dark:text-gray-400">\s*Our team usually responds within one business day\.\s*<\/p>/g, `<p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0.3rem 0 0 0' }}>Our team usually responds within one business day.</p>`);
code = code.replace(/className=\{`px-5 py-3 text-sm \$\{primaryButtonClass\}`\}/g, `style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.65rem 1.4rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.88rem', cursor: 'none', textDecoration: 'none', display: 'inline-flex' }}`);
code = code.replace(/className=\{`px-5 py-3 text-sm \$\{outlineButtonClass\}`\}/g, `style={{ background: 'transparent', border: '1.5px solid var(--border-strong)', color: 'var(--ink)', borderRadius: '100px', padding: '0.6rem 1.4rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.88rem', cursor: 'none', textDecoration: 'none', display: 'inline-flex' }}`);

fs.writeFileSync(path, code);
console.log('SupportPage.tsx updated');
