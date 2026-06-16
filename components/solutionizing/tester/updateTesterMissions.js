const fs = require('fs');

const path = 'c:/Users/Shubhi Mishra/Desktop/solutionizing 5/components/solutionizing/tester/TesterMissionsTab.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. RatingEventList - No score changes text
code = code.replace(/<p className="mt-3 text-xs font-semibold text-text-muted">No score changes yet\.<\/p>/, `<p style={{ marginTop: '0.75rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>No score changes yet.</p>`);
// RatingEventList container
code = code.replace(/<div className="mt-3 space-y-2 border-t border-border-subtle pt-3">/, `<div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>`);
// RatingEventList item
code = code.replace(/<p key=\{event\.id\} className="text-xs font-semibold leading-5 text-text-muted">/g, `<p key={event.id} style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--ink-soft)' }}>`);

// 2. CheckMissionsButton
code = code.replace(
  /<button\s*type="button"\s*disabled=\{state === 'loading'\}\s*onClick=\{[^}]*\}\s*className="group relative inline-flex h-8 items-center justify-center gap-1\.5 overflow-hidden rounded-full border border-sky-500\/30 bg-gradient-to-r from-sky-500\/10 to-sky-500\/5 px-4 text-xs font-bold tracking-wide text-sky-400 transition-all hover:border-sky-500\/50 hover:from-sky-500\/20 hover:to-sky-500\/10 hover:shadow-\[0_0_15px_rgba\(14,165,233,0\.15\)\] focus:outline-none focus:ring-2 focus:ring-sky-500\/50 focus:ring-offset-2 focus:ring-offset-surface disabled:pointer-events-none disabled:opacity-60"\s*>/g,
  `<button
        type="button"
        disabled={state === 'loading'}
        onClick={() => void handleClick()}
        style={{
          background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '100px', 
          padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', 
          fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.8rem', color: 'var(--ink)',
          cursor: 'none', transition: 'border-color 0.2s, background 0.2s', opacity: state === 'loading' ? 0.6 : 1
        }}
      >`
);
code = code.replace(/<svg className="h-3\.5 w-3\.5 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">/g, `<svg style={{ width: '14px', height: '14px', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">`);
code = code.replace(/<motion\.p\s*initial=\{\{ opacity: 0, y: -4 \}\}\s*animate=\{\{ opacity: 1, y: 0 \}\}\s*exit=\{\{ opacity: 0, y: -4 \}\}\s*className=\{`text-right text-\[0\.65rem\] font-bold \$\{\s*state === 'success'\s*\? 'text-emerald-400'\s*: state === 'rate-limited'\s*\? 'text-amber-400'\s*: 'text-red-400'\s*\}`\}\s*>/, 
  `<motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              textAlign: 'right', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.75rem',
              color: state === 'success' ? '#27ae60' : state === 'rate-limited' ? '#f39c12' : '#c0392b'
            }}
          >`);

// 3. Loading cards
code = code.replace(/<div className="space-y-4">/g, `<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>`);
code = code.replace(/<div key=\{card\} className="rounded-card border border-border-subtle bg-surface p-6">/g, `<div key={card} style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem' }}>`);
code = code.replace(/<div className="mb-4 h-6 w-1\/3 animate-pulse rounded bg-surface-elevated" \/>/g, `<div style={{ marginBottom: '1rem', height: '24px', width: '33%', borderRadius: '4px', background: 'var(--border-strong)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />`);
code = code.replace(/<div className="mb-4 h-20 animate-pulse rounded-2xl bg-surface-elevated" \/>/g, `<div style={{ marginBottom: '1rem', height: '80px', borderRadius: '16px', background: 'var(--border-strong)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />`);
code = code.replace(/<div className="h-12 animate-pulse rounded-\[2rem\] bg-surface-elevated" \/>/g, `<div style={{ height: '48px', borderRadius: '32px', background: 'var(--border-strong)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />`);

// 4. Zero assignments state
code = code.replace(/<div className="rounded-card border border-sky-900\/50 bg-sky-950\/20 p-8 text-left">/, `<div style={{ background: 'rgba(215, 122, 87, 0.05)', border: '1px solid rgba(215, 122, 87, 0.2)', borderRadius: '14px', padding: '2rem', textAlign: 'left' }}>`);
code = code.replace(/<div className="flex items-start gap-4">/g, `<div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>`);
code = code.replace(/<div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-900\/50 text-sky-300">/, `<div style={{ marginTop: '0.25rem', width: '44px', height: '44px', borderRadius: '12px', background: 'var(--electric-dim)', color: 'var(--electric)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`);
code = code.replace(/<div className="space-y-2">/g, `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>`);
code = code.replace(/<div className="text-sm font-bold uppercase tracking-\[0\.18em\] text-sky-300">In Queue<\/div>/, `<div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--electric)', letterSpacing: '0.12em' }}>IN QUEUE</div>`);
code = code.replace(/<p className="text-base font-semibold text-white">/g, `<p style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '1rem', color: 'var(--ink)' }}>`);
code = code.replace(/<p className="text-sm text-sky-100\/80">/g, `<p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>`);

// 5. Assignment Card
code = code.replace(
  /<div key=\{assignment\.id\} className="rounded-card border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary\/30 hover:bg-surface-elevated">/g,
  `<div key={assignment.id} style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', transition: 'border-color 0.2s, background 0.2s' }}>`
);
code = code.replace(/<div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">/g, `<div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', ...(true ? { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' } : {}) }}>`);
code = code.replace(/<div className="flex-1">/g, `<div style={{ flex: 1 }}>`);
code = code.replace(/<h3 className="text-lg font-black text-white">\{assignment\.mission\.title\}<\/h3>/g, `<h3 style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>{assignment.mission.title}</h3>`);
code = code.replace(/<p className="mt-1 text-sm leading-relaxed text-text-muted">\{assignment\.mission\.goal\}<\/p>/g, `<p style={{ marginTop: '0.25rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--ink-soft)' }}>{assignment.mission.goal}</p>`);

// Assignment status pill
code = code.replace(
  /<div\s*className=\{`inline-flex rounded-full px-3 py-1 text-xs font-bold \$\{\s*assignment\.status === 'ASSIGNED' \? 'bg-emerald-950\/60 text-emerald-400 border border-emerald-900\/60' : 'bg-amber-950\/60 text-amber-400 border border-amber-900\/60'\s*\}`\}\s*>/g,
  `<div
                  style={{
                    display: 'inline-flex', padding: '0.25rem 0.75rem', borderRadius: '100px', border: '1px solid',
                    fontFamily: 'DM Mono, monospace', fontSize: '0.7rem',
                    ...(assignment.status === 'ASSIGNED' ? { background: 'rgba(39, 174, 96, 0.08)', borderColor: 'rgba(39, 174, 96, 0.3)', color: '#27ae60' } : { background: 'rgba(243, 156, 18, 0.08)', borderColor: 'rgba(243, 156, 18, 0.3)', color: '#f39c12' })
                  }}
                >`
);

code = code.replace(/<div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-4">/g, `<div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>`);
code = code.replace(/<div className="col-span-1">/g, `<div>`);
code = code.replace(/<div className="col-span-2 sm:col-span-1">/g, `<div>`);
code = code.replace(/<div className="mb-1 text-\[0\.6rem\] font-bold uppercase tracking-widest text-text-muted">REWARD<\/div>/g, `<div style={{ marginBottom: '0.25rem', fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--ink-soft)', letterSpacing: '0.12em' }}>REWARD</div>`);
code = code.replace(/<div className="mb-1 text-\[0\.6rem\] font-bold uppercase tracking-widest text-text-muted">DURATION<\/div>/g, `<div style={{ marginBottom: '0.25rem', fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--ink-soft)', letterSpacing: '0.12em' }}>DURATION</div>`);
code = code.replace(/<div className="mb-1 text-\[0\.6rem\] font-bold uppercase tracking-widest text-text-muted">EXPIRES IN<\/div>/g, `<div style={{ marginBottom: '0.25rem', fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--ink-soft)', letterSpacing: '0.12em' }}>EXPIRES IN</div>`);

code = code.replace(/<div className="text-base sm:text-lg font-black text-white">/g, `<div style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>`);
code = code.replace(/<div className="text-\[0\.65rem\] font-semibold text-text-muted uppercase">/g, `<div style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.75rem', color: 'var(--ink-soft)' }}>`);

// Expires in color logic
code = code.replace(
  /<div\s*className=\{`text-base sm:text-lg font-black \$\{\s*preciseHours <= 0\.5\s*\? 'text-red-400'\s*: preciseHours <= 2\s*\? 'text-amber-400'\s*: 'text-text-muted'\s*\}`\}\s*>/g,
  `<div
                    style={{
                      fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '1.1rem',
                      color: preciseHours <= 0.5 ? '#c0392b' : preciseHours <= 2 ? '#f39c12' : 'var(--ink)'
                    }}
                  >`
);
code = code.replace(/<span className="flex items-center gap-2">/g, `<span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>`);
code = code.replace(/<span className="h-2 w-2 animate-pulse rounded-full bg-red-500" \/>/g, `<span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c0392b', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />`);

code = code.replace(/<div className="flex items-center gap-3">/g, `<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>`);
code = code.replace(
  /<Link href=\{`\/tester\/workspace\/\$\{assignment\.id\}`\} className=\{`flex-1 py-3 text-center \$\{primaryButtonClass\}`\}>/g,
  `<Link href={\`/tester/workspace/\${assignment.id}\`} style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'var(--electric)', color: 'var(--cream)', borderRadius: '100px', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.95rem', cursor: 'none', textDecoration: 'none' }}>`
);
code = code.replace(
  /<button\s*className="text-sm font-semibold text-text-muted hover:text-red-400 transition-colors"\s*onClick=\{\(\) => onAbandon\(assignment\)\}\s*>/g,
  `<button
                  onClick={() => onAbandon(assignment)}
                  style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink-soft)', background: 'none', border: 'none', cursor: 'none', textDecoration: 'underline' }}
                >`
);

// 6. Header
code = code.replace(/<div className="mx-auto max-w-6xl">/g, `<div style={{ maxWidth: '72rem', margin: '0 auto' }}>`);
code = code.replace(/<div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">/g, `<div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', ...(true ? { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } : {}) }}>`);
code = code.replace(/<h1 className="text-3xl font-black text-white">Dashboard<\/h1>/g, `<h1 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: '2rem', color: 'var(--ink)' }}>Dashboard</h1>`);
code = code.replace(/<p className="text-text-muted">Welcome back! Here&apos;s your mission overview\.<\/p>/g, `<p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '1rem', color: 'var(--ink-soft)' }}>Welcome back! Here&apos;s your mission overview.</p>`);
code = code.replace(/<div className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2">/g, `<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)', borderRadius: '100px', background: 'var(--bg-light)', padding: '0.5rem 1rem' }}>`);
code = code.replace(/<div className="h-2 w-2 rounded-full bg-emerald-500" \/>/g, `<div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27ae60' }} />`);
code = code.replace(/<span className="text-sm font-semibold text-white">Ready for Missions<\/span>/g, `<span style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink)' }}>Ready for Missions</span>`);

// 7. Stats Grid
code = code.replace(/<div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-4">/g, `<div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>`);
code = code.replace(/<div className="rounded-card border border-border-subtle bg-surface p-4 sm:p-5 transition-all hover:border-primary\/30 hover:bg-surface-elevated">/g, `<div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', transition: 'border-color 0.2s, background 0.2s' }}>`);
code = code.replace(/<div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-950\/60 text-emerald-400">/g, `<div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(39, 174, 96, 0.1)', color: '#27ae60', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`);
code = code.replace(/<div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-950\/60 text-purple-400">/g, `<div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`);
code = code.replace(/<div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-sky-950\/60 text-sky-400">/g, `<div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(41, 128, 185, 0.1)', color: '#2980b9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`);
code = code.replace(/<div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-950\/60 text-amber-400">/g, `<div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(243, 156, 18, 0.1)', color: '#f39c12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>`);
code = code.replace(/<div className="text-\[0\.65rem\] font-bold uppercase tracking-wider text-text-muted">/g, `<div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--ink-soft)', letterSpacing: '0.12em' }}>`);
code = code.replace(/<div className="mb-1 text-2xl sm:text-3xl font-black text-white">/g, `<div style={{ marginBottom: '0.25rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '1.8rem', color: 'var(--ink)' }}>`);
code = code.replace(/<div className="text-\[0\.7rem\] font-semibold text-text-muted uppercase tracking-tighter">/g, `<div style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>`);
code = code.replace(/<div className="text-\[0\.7rem\] font-bold text-text-muted uppercase tracking-tighter">/g, `<div style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>`);
code = code.replace(/<div className="text-\[0\.75rem\] font-black uppercase text-emerald-400 tracking-tighter">/g, `<div style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#27ae60' }}>`);

// 8. Payout banner
code = code.replace(
  /<div className="relative mb-8 overflow-hidden rounded-\[2\.5rem\] bg-gradient-to-br from-\[#F97C5A\] to-\[#E45D43\] p-6 sm:p-8 text-white shadow-\[0_8px_32px_-8px_rgba\(249,124,90,0\.4\)\]">/g,
  `<div style={{ position: 'relative', marginBottom: '2rem', overflow: 'hidden', borderRadius: '24px', background: 'var(--electric)', padding: '2rem', color: 'var(--cream)' }}>`
);
code = code.replace(/<div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white\/10 blur-3xl" \/>/g, ``);
code = code.replace(/<div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between text-center lg:text-left">/g, `<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', ...(true ? { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' } : {}) }}>`);
code = code.replace(/<h3 className="mb-2 text-2xl font-black tracking-tight">/g, `<h3 style={{ marginBottom: '0.5rem', fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: '1.6rem', color: 'var(--cream)' }}>`);
code = code.replace(/<p className="mb-4 text-base sm:text-lg font-bold text-white\/90">/g, `<p style={{ marginBottom: '1rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)' }}>`);
code = code.replace(/<span className="text-white underline decoration-white\/30 underline-offset-4">/g, `<span style={{ textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.4)', textUnderlineOffset: '4px' }}>`);
code = code.replace(/<div className="flex items-center gap-4 px-2 sm:px-0">/g, `<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>`);
code = code.replace(/<div className="h-3 flex-1 rounded-full bg-white\/20">/g, `<div style={{ height: '12px', flex: 1, borderRadius: '100px', background: 'rgba(255,255,255,0.2)' }}>`);
code = code.replace(/className="h-3 rounded-full bg-white shadow-\[0_0_15px_rgba\(255,255,255,0\.8\)\] transition-all duration-1000"/g, `style={{ height: '12px', borderRadius: '100px', background: 'var(--cream)', transition: 'width 1s ease-in-out', width: \`\${Math.min(100, (balance / minimumWithdrawalCoins) * 100)}%\` }}`);
code = code.replace(/<span className="text-\[0\.65rem\] font-black uppercase tracking-widest">/g, `<span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.12em' }}>`);
code = code.replace(/<p className="mt-4 flex items-center justify-center lg:justify-start gap-2 text-\[0\.65rem\] font-black uppercase tracking-\[0\.14em\] text-white\/70">/g, `<p style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.12em' }}>`);
code = code.replace(/<div className="flex-shrink-0">/g, `<div>`);

code = code.replace(
  /<button\s*className="w-full sm:w-auto rounded-\[1\.4rem\] bg-white px-10 py-4 font-black text-\[#F97C5A\] tracking-widest transition-all hover:scale-105 hover:shadow-xl active:scale-95"\s*onClick=\{onOpenWithdrawal\}\s*>/g,
  `<button
                onClick={onOpenWithdrawal}
                style={{ background: 'var(--cream)', color: 'var(--electric)', border: 'none', borderRadius: '100px', padding: '1rem 2.5rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.95rem', cursor: 'none' }}
              >`
);
code = code.replace(
  /<button className="w-full sm:w-auto cursor-not-allowed rounded-\[1\.4rem\] bg-white\/30 backdrop-blur-sm px-10 py-4 font-black text-white\/70 tracking-widest" disabled>/g,
  `<button disabled style={{ background: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '100px', padding: '1rem 2.5rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.95rem', cursor: 'none' }}>`
);

// 9. Warning box
code = code.replace(/<div className="mb-6 rounded-card border border-amber-900\/50 bg-amber-950\/20 p-4 text-sm leading-6 text-amber-100">/g, `<div style={{ marginBottom: '1.5rem', background: 'rgba(243, 156, 18, 0.05)', border: '1px solid rgba(243, 156, 18, 0.2)', borderRadius: '12px', padding: '1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)' }}>`);

// 10. Missions Header
code = code.replace(/<div className="mb-6 flex items-center justify-between">/g, `<div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>`);
code = code.replace(/<h2 className="text-2xl font-black text-white">Current Missions<\/h2>/g, `<h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: '1.6rem', color: 'var(--ink)' }}>Current Missions</h2>`);
code = code.replace(/<span className="rounded-full border border-border-subtle bg-surface-elevated px-4 py-1 text-sm font-bold text-text-muted">/g, `<span style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '100px', padding: '0.25rem 0.75rem', fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>`);

// 11. Missed missions
code = code.replace(/<section className="mt-10">/g, `<section style={{ marginTop: '2.5rem' }}>`);
code = code.replace(/<div className="mb-4">/g, `<div style={{ marginBottom: '1rem' }}>`);
code = code.replace(/<h2 className="text-2xl font-black text-white">Missed Missions<\/h2>/g, `<h2 style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: '1.6rem', color: 'var(--ink)' }}>Missed Missions</h2>`);
code = code.replace(/<p className="mt-1 text-sm text-text-muted">Expired assignments stay here so you can track what affected your score\.<\/p>/g, `<p style={{ marginTop: '0.25rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>Expired assignments stay here so you can track what affected your score.</p>`);

code = code.replace(/<div\s*key=\{assignment\.id\}\s*className="rounded-card border border-gray-700\/70 bg-gray-900\/50 p-4 opacity-75 sm:p-5"\s*>/g, `<div key={assignment.id} style={{ background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '1.25rem', opacity: 0.7 }}>`);
code = code.replace(/<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">/g, `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', ...(true ? { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' } : {}) }}>`);
code = code.replace(/<h3 className="text-lg font-black text-gray-200">\{assignment\.mission\.title\}<\/h3>/g, `<h3 style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '1.1rem', color: 'var(--ink)' }}>{assignment.mission.title}</h3>`);
code = code.replace(/<p className="mt-1 text-sm text-gray-400">Expired \{formatEventDate\(expiredAt\)\}<\/p>/g, `<p style={{ marginTop: '0.25rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Expired {formatEventDate(expiredAt)}</p>`);
code = code.replace(/<span className="inline-flex rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-xs font-bold text-gray-400">/g, `<span style={{ display: 'inline-flex', padding: '0.25rem 0.75rem', borderRadius: '100px', border: '1px solid var(--border)', background: 'var(--bg-light)', fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: 'var(--ink-soft)' }}>`);
code = code.replace(/<p className="mt-4 text-sm font-semibold text-gray-300">/g, `<p style={{ marginTop: '1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>`);


// Fix duplicate style attr in button style above
// Note: string replacements can be tricky if not exact. The above are mostly unique strings.

fs.writeFileSync(path, code);
console.log('TesterMissionsTab.tsx updated');
