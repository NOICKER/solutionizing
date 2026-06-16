const fs = require('fs');

const path = 'c:/Users/Shubhi Mishra/Desktop/solutionizing 5/components/solutionizing/founder/FounderMissionsTab.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Section Wrapper
code = code.replace(
  /<section[\s\S]*?className="rounded-\[1\.9rem\] border border-border-subtle bg-surface p-4 sm:p-5"/,
  '<section\n      id="missions-section"\n      style={{ background: \'var(--cream)\', border: \'1px solid var(--border)\', borderRadius: \'14px\', padding: \'1.5rem 2rem\' }}'
);

// 2. Section Header
code = code.replace(
  /<div className="text-\[0\.7rem\] font-bold uppercase tracking-\[0\.22em\] text-text-muted">Mission Control<\/div>/,
  '<div style={{ fontFamily: \'DM Mono, monospace\', fontSize: \'0.68rem\', color: \'var(--ink-soft)\', letterSpacing: \'0.12em\' }}>MISSION CONTROL</div>'
);
code = code.replace(
  /<h2 className="mt-2 text-2xl font-black text-white">Your Missions<\/h2>/,
  '<h2 style={{ fontFamily: \'Fraunces, serif\', fontStyle: \'italic\', fontSize: \'1.3rem\', color: \'var(--ink)\', fontWeight: 400 }}>your missions.</h2>'
);

// 3. New Mission Button
code = code.replace(
  /<Link href="\/mission\/wizard" className=\{`px-6 py-3 text-base \$\{primaryButtonClass\}`\}>\s*\+\s*New Mission\s*<\/Link>/,
  '<Link href="/mission/wizard" style={{ background: \'var(--electric)\', color: \'var(--cream)\', border: \'none\', borderRadius: \'100px\', padding: \'0.55rem 1.2rem\', fontFamily: \'Satoshi, sans-serif\', fontWeight: 700, fontSize: \'0.82rem\', cursor: \'none\', textDecoration: \'none\' }}>+ New Mission</Link>'
);

// 4. Filter Pills Bar
code = code.replace(
  /<div className="mb-5 flex flex-wrap gap-2 rounded-card border border-border-subtle bg-surface-elevated p-2">/,
  '<div style={{ background: \'var(--bg)\', border: \'1px solid var(--border)\', borderRadius: \'10px\', padding: \'0.4rem\', display: \'flex\', flexWrap: \'wrap\', gap: \'0.3rem\', marginBottom: \'1.2rem\' }}>'
);
code = code.replace(
  /className=\{`rounded-full px-4 py-2 text-xs font-black uppercase tracking-\[0\.16em\] transition-colors \$\{\s*isActive\s*\?\s*'bg-primary text-white shadow-sm'\s*:\s*'text-text-muted hover:bg-surface hover:text-text-main'\s*\}`\}/g,
  "style={isActive ? { background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.4rem 1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.08em', cursor: 'none' } : { background: 'transparent', color: 'var(--ink-soft)', border: 'none', borderRadius: '100px', padding: '0.4rem 1rem', fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.08em', cursor: 'none' }}"
);

// 5. Mission Cards
code = code.replace(
  /className=\{`rounded-card border border-border-subtle bg-surface p-4 sm:p-5 \$\{isCardClickable \? 'cursor-pointer transition-all hover:border-primary\/30 hover:bg-surface-elevated' : ''\}`\}/g,
  "style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem', marginBottom: '0.8rem', transition: 'border-color 0.2s', cursor: isCardClickable ? 'none' : undefined }} className={isCardClickable ? 'hover-border-strong' : ''}"
);
code = code.replace(
  /<h3 className="mb-1 text-lg font-black text-white">\{mission\.title\}<\/h3>/g,
  '<h3 style={{ fontFamily: \'Satoshi, sans-serif\', fontWeight: 700, fontSize: \'1rem\', color: \'var(--ink)\', margin: \'0 0 0.5rem 0\' }}>{mission.title}</h3>'
);
code = code.replace(
  /<p className="text-sm text-text-muted">\{mission\.goal\}<\/p>/g,
  '<p style={{ fontFamily: \'Satoshi, sans-serif\', fontSize: \'0.88rem\', color: \'var(--ink-soft)\', margin: 0 }}>{mission.goal}</p>'
);
code = code.replace(
  /<p className="text-sm text-text-muted">Under review — usually within 24 hours<\/p>/g,
  '<p style={{ fontFamily: \'Satoshi, sans-serif\', fontSize: \'0.88rem\', color: \'var(--ink-soft)\' }}>Under review — usually within 24 hours</p>'
);
code = code.replace(
  /<p className="text-sm text-text-muted">\s*Approved and ready to launch\. Once you launch, tester assignment begins immediately\.\s*<\/p>/g,
  '<p style={{ fontFamily: \'Satoshi, sans-serif\', fontSize: \'0.88rem\', color: \'var(--ink-soft)\' }}>Approved and ready to launch. Once you launch, tester assignment begins immediately.</p>'
);

// 6. Progress bar
code = code.replace(
  /<div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">/g,
  '<div style={{ background: \'var(--bg)\', height: \'4px\', borderRadius: \'100px\' }}>'
);
code = code.replace(
  /<div\s*className="h-full rounded-full bg-gradient-to-r from-\[#F97C5A\] to-\[#E45D43\]"\s*style=\{\{\s*width: `\$\{progress\}%`\s*\}\}\s*\/>/g,
  '<div style={{ width: `${progress}%`, background: \'var(--electric)\', height: \'4px\', borderRadius: \'100px\' }} />'
);

// 7. Buttons (Primary)
const primaryStyle = "style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.55rem 1.2rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.82rem', cursor: 'none', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}";
code = code.replace(/className=\{`flex items-center gap-2 px-6 py-2 text-sm \$\{primaryButtonClass\}`\}/g, primaryStyle);
code = code.replace(/className=\{`inline-flex px-6 py-3 \$\{primaryButtonClass\}`\}/g, primaryStyle);
code = code.replace(/className=\{`flex items-center gap-2 px-4 py-2 text-sm \$\{primaryButtonClass\}`\}/g, primaryStyle);

// 8. Buttons (Secondary)
const secondaryStyle = "style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink)', borderRadius: '100px', padding: '0.5rem 1.1rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.82rem', cursor: 'none', textDecoration: 'none' }}";
code = code.replace(/className=\{`px-4 py-2 text-sm \$\{outlineButtonClass\}`\}/g, secondaryStyle);
code = code.replace(/className=\{`px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 \$\{mutedButtonClass\}`\}/g, secondaryStyle);

// 9. Close Text Link
const closeStyle = "style={{ color: '#c0392b', fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', background: 'none', border: 'none', cursor: 'none' }}";
code = code.replace(/className="ml-auto text-sm font-semibold text-red-400 hover:underline disabled:cursor-not-allowed disabled:opacity-50"/g, closeStyle);

// 10. Rejection Feedback
code = code.replace(
  /<div className="rounded-2xl border border-red-900\/60 bg-red-950\/30 p-4">/g,
  '<div style={{ background: \'rgba(192, 57, 43, 0.06)\', border: \'1px solid rgba(192, 57, 43, 0.2)\', borderRadius: \'8px\', padding: \'0.8rem 1rem\' }}>'
);
code = code.replace(
  /<h4 className="mb-1 text-sm font-bold text-red-300">Feedback from our team<\/h4>/g,
  '<h4 style={{ fontFamily: \'Satoshi, sans-serif\', fontSize: \'0.9rem\', fontWeight: 700, color: \'#c0392b\', margin: \'0 0 0.3rem 0\' }}>Feedback from our team</h4>'
);
code = code.replace(
  /<p className="text-sm text-red-400">\{mission\.rejectionReason \?\? mission\.reviewNote \?\? 'Your mission needs changes before it can go live\.'\}<\/p>/g,
  '<p style={{ fontSize: \'0.85rem\', color: \'#c0392b\', margin: 0 }}>{mission.rejectionReason ?? mission.reviewNote ?? \'Your mission needs changes before it can go live.\'}</p>'
);

// Extra text elements styling tweaks to match design
code = code.replace(
  /<div className="mb-2 flex items-center justify-between text-sm">/g,
  '<div style={{ display: \'flex\', alignItems: \'center\', justifyContent: \'space-between\', marginBottom: \'0.5rem\', fontFamily: \'Satoshi, sans-serif\', fontSize: \'0.8rem\' }}>'
);
code = code.replace(
  /<span className="text-text-muted">/g,
  '<span style={{ color: \'var(--ink-soft)\' }}>'
);
code = code.replace(
  /<span className="font-bold text-white">\{Math\.round\(progress\)\}%<\/span>/g,
  '<span style={{ fontWeight: 700, color: \'var(--ink)\' }}>{Math.round(progress)}%</span>'
);
code = code.replace(
  /<p className="text-sm text-text-muted">Completed \{format\(new Date\(mission\.completedAt\), 'MMM d, yyyy'\)\}<\/p>/g,
  '<p style={{ fontFamily: \'DM Mono, monospace\', fontSize: \'0.72rem\', color: \'var(--ink-soft)\' }}>Completed {format(new Date(mission.completedAt), \'MMM d, yyyy\')}</p>'
);

fs.writeFileSync(path, code);
console.log('FounderMissionsTab.tsx updated');
