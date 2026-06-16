const fs = require('fs');

const path = 'c:/Users/Shubhi Mishra/Desktop/solutionizing 5/components/solutionizing/founder/FounderWalletsTab.tsx';
let code = fs.readFileSync(path, 'utf8');

// Section Wrapper
code = code.replace(
  /<section className="rounded-panel border border-border-subtle bg-surface p-4 sm:p-5">/,
  '<section style={{ background: \'var(--cream)\', border: \'1px solid var(--border)\', borderRadius: \'14px\', padding: \'1.5rem 2rem\' }}>'
);
// PurchaseOutcomePanel wrapper
code = code.replace(
  /<div className="rounded-panel border border-border-subtle bg-surface p-4 sm:p-6">/,
  '<div style={{ background: \'var(--cream)\', border: \'1px solid var(--border)\', borderRadius: \'14px\', padding: \'1.5rem 2rem\' }}>'
);

// Headers
code = code.replace(
  /<div className="text-\[0\.7rem\] font-bold uppercase tracking-\[0\.22em\] text-text-muted">Architectural Capital<\/div>/,
  '<div style={{ fontFamily: \'DM Mono, monospace\', fontSize: \'0.68rem\', color: \'var(--ink-soft)\', letterSpacing: \'0.12em\' }}>ARCHITECTURAL CAPITAL</div>'
);
code = code.replace(
  /<h2 className="mt-2 text-2xl font-black text-white">Available Balance<\/h2>/,
  '<h2 style={{ fontFamily: \'Fraunces, serif\', fontStyle: \'italic\', fontSize: \'1.3rem\', color: \'var(--ink)\', fontWeight: 400 }}>available balance.</h2>'
);
code = code.replace(
  /<div className="text-\[0\.7rem\] font-bold uppercase tracking-\[0\.22em\] text-text-muted">\s*\{isSuccess \? 'Purchase complete' : 'Purchase failed'\}\s*<\/div>/,
  '<div style={{ fontFamily: \'DM Mono, monospace\', fontSize: \'0.68rem\', color: \'var(--ink-soft)\', letterSpacing: \'0.12em\' }}>{isSuccess ? \'PURCHASE COMPLETE\' : \'PURCHASE FAILED\'}</div>'
);
code = code.replace(
  /<h2 className="mt-2 text-3xl font-black text-white">\s*\{isSuccess \? 'Coins credited to wallet' : 'Checkout did not complete'\}\s*<\/h2>/,
  '<h2 style={{ fontFamily: \'Fraunces, serif\', fontStyle: \'italic\', fontSize: \'1.3rem\', color: \'var(--ink)\', fontWeight: 400 }}>{isSuccess ? \'coins credited to wallet.\' : \'checkout did not complete.\'}</h2>'
);

// Buttons Primary
const primaryBtnStyle = "style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.55rem 1.2rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.82rem', cursor: 'none' }}";
code = code.replace(/className=\{`px-5 py-3 text-sm \$\{primaryButtonClass\}`\}/g, primaryBtnStyle);
code = code.replace(/className=\{`flex items-center gap-2 px-5 py-3 text-sm \$\{primaryButtonClass\}`\}/g, primaryBtnStyle);
code = code.replace(/className="mt-6 w-full rounded-\[2rem\] bg-gradient-to-r from-\[#F97C5A\] to-\[#E45D43\] py-2\.5 text-sm font-black text-white hover:shadow-\[0_8px_24px_rgba\(249,124,90,0\.35\)\] transition-all"/g, primaryBtnStyle);

// Buttons Secondary
const secondaryBtnStyle = "style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink)', borderRadius: '100px', padding: '0.5rem 1.1rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.82rem', cursor: 'none', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}";
code = code.replace(/className="rounded-\[2rem\] border border-border-subtle px-5 py-3 text-sm font-bold text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-main"/g, secondaryBtnStyle);
code = code.replace(/className="inline-flex items-center gap-2 rounded-\[2rem\] border border-border-subtle px-5 py-3 text-sm font-bold text-text-muted transition-colors hover:bg-surface-elevated hover:text-text-main"/g, secondaryBtnStyle);

// CoinPackCard button
const packBtnStyle = "style={pack.popular ? { background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.55rem 1.2rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.82rem', cursor: 'none', width: '100%', marginTop: '2rem' } : { background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink)', borderRadius: '100px', padding: '0.5rem 1.1rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.82rem', cursor: 'none', width: '100%', marginTop: '2rem' }}";
code = code.replace(/className=\{`mt-8 flex w-full items-center justify-center gap-2 rounded-\[2rem\] py-3 text-sm font-black transition-all disabled:pointer-events-none disabled:opacity-70 \$\{[\s\S]*?\}\`\}/g, packBtnStyle);

// Cards
const genericCardStyle = "style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem' }}";
code = code.replace(/className="rounded-card border border-border-subtle bg-surface-elevated p-6"/g, genericCardStyle);
code = code.replace(/className="rounded-card border border-primary\/30 bg-gradient-to-br from-primary\/20 to-primary\/5 p-6"/g, genericCardStyle);
code = code.replace(/className="rounded-card border border-border-subtle bg-surface-elevated p-5"/g, genericCardStyle);
code = code.replace(/className="mt-8 rounded-card border border-red-900\/60 bg-red-950\/30 p-5"/g, genericCardStyle);

const coinPackCardStyle = "style={{ background: 'var(--bg-light)', border: pack.popular ? '1px solid var(--electric)' : '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem', position: 'relative' }}";
code = code.replace(/className=\{`relative rounded-card border bg-surface p-4 sm:p-5 transition-all hover:border-primary\/40 \$\{[\s\S]*?\}\`\}/g, coinPackCardStyle);

// Most Recommended Label
code = code.replace(/className="absolute -top-3 left-1\/2 -translate-x-1\/2 rounded-full bg-gradient-to-r from-\[#F97C5A\] to-\[#E45D43\] px-4 py-1 text-\[0\.65rem\] font-black uppercase tracking-\[0\.18em\] text-white shadow-\[0_4px_12px_rgba\(249,124,90,0\.4\)\]"/g, "style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--electric)', color: 'var(--cream)', borderRadius: '100px', padding: '0.2rem 0.6rem', fontSize: '0.6rem', fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em' }}");

// Other typography and colors that must be stripped of Tailwind text-white/text-text-muted
code = code.replace(/text-text-muted/g, "");
code = code.replace(/text-white/g, "");
code = code.replace(/text-primary/g, "");
code = code.replace(/<span className="text-3xl sm:text-4xl font-black \s*">/g, '<span style={{ fontFamily: \'Satoshi, sans-serif\', fontSize: \'1.5rem\', fontWeight: 700, color: \'var(--ink)\' }}>');
code = code.replace(/<h3 className="text-xl font-black \s*">Instant Power Refresh<\/h3>/g, '<h3 style={{ fontFamily: \'Satoshi, sans-serif\', fontSize: \'1.1rem\', fontWeight: 700, color: \'var(--ink)\', margin: 0 }}>Instant Power Refresh</h3>');
code = code.replace(/<p className="mt-2 text-sm \s*">Auto-refill triggered at 5,000 coins\.<\/p>/g, '<p style={{ fontFamily: \'Satoshi, sans-serif\', fontSize: \'0.88rem\', color: \'var(--ink-soft)\', margin: \'0.2rem 0 0 0\' }}>Auto-refill triggered at 5,000 coins.</p>');
code = code.replace(/<h3 className="text-2xl font-black \s*">\{pack\.name\}<\/h3>/g, '<h3 style={{ fontFamily: \'Satoshi, sans-serif\', fontSize: \'1.2rem\', fontWeight: 700, color: \'var(--ink)\', margin: 0 }}>{pack.name}</h3>');
code = code.replace(/<span className="text-4xl font-black \s*">\{formatCoins\(pack\.coins\)\}<\/span>/g, '<span style={{ fontFamily: \'Satoshi, sans-serif\', fontSize: \'1.8rem\', fontWeight: 700, color: \'var(--ink)\' }}>{formatCoins(pack.coins)}</span>');

code = code.replace(/className="mb-3 text-\[0\.65rem\] font-bold uppercase tracking-\[0\.2em\] \s*"/g, 'style={{ fontFamily: \'DM Mono, monospace\', fontSize: \'0.65rem\', letterSpacing: \'0.1em\', color: \'var(--ink-soft)\', marginBottom: \'1rem\' }}');

// Alerts (amber/red backgrounds)
const alertStyle = "style={{ background: 'rgba(192, 57, 43, 0.06)', border: '1px solid rgba(192, 57, 43, 0.2)', borderRadius: '8px', padding: '0.8rem 1rem', fontSize: '0.85rem', color: '#c0392b', marginTop: '1.5rem' }}";
code = code.replace(/className="mt-6 rounded-2xl border border-amber-900\/50 bg-amber-950\/30 p-4 text-sm text-amber-300"/g, alertStyle);
code = code.replace(/className="mt-8 rounded-2xl border border-amber-900\/50 bg-amber-950\/30 p-4 text-sm text-amber-300"/g, alertStyle);
code = code.replace(/className="mt-8 rounded-card border border-red-900\/60 bg-red-950\/30 p-5"/g, alertStyle);


fs.writeFileSync(path, code);
console.log('FounderWalletsTab.tsx updated');
