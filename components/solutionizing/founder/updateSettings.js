const fs = require('fs');

const path = 'c:/Users/Shubhi Mishra/Desktop/solutionizing 5/components/solutionizing/founder/FounderSettingsTab.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. SettingsSectionCard
code = code.replace(
  /function SettingsSectionCard\([\s\S]*?className\}`\}>\s*<div className="mb-6 flex flex-wrap items-start justify-between gap-3">\s*<div>\s*<h3 className="text-lg font-black text-white">\{title\}<\/h3>\s*<p className="mt-2 max-w-2xl text-sm text-text-muted">\{description\}<\/p>\s*<\/div>\s*\{comingSoon \? <ComingSoonBadge \/> : null\}\s*<\/div>\s*\{children\}\s*<\/section>\s*\}/,
  `function SettingsSectionCard({ title, description, comingSoon = false, className = '', children }: { title: string; description: string; comingSoon?: boolean; className?: string; children: ReactNode }) {
  return (
    <section style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.5rem 2rem', ...(className ? {} : {}) }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>{title}</h3>
          <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)', maxWidth: '36rem' }}>{description}</p>
        </div>
        {comingSoon ? <ComingSoonBadge /> : null}
      </div>
      {children}
    </section>
  )
}`
);

// 2. ComingSoonBadge
code = code.replace(
  /function ComingSoonBadge\(\) \{\s*return \(\s*<span className="inline-flex rounded-full border border-border-subtle bg-surface-elevated px-3 py-1 text-\[0\.65rem\] font-bold uppercase tracking-\[0\.18em\] text-text-muted">\s*Coming Soon\s*<\/span>\s*\)\s*\}/,
  `function ComingSoonBadge() {
  return (
    <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--ink-soft)', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '100px', padding: '0.2rem 0.7rem', whiteSpace: 'nowrap' }}>
      COMING SOON
    </span>
  )
}`
);

// 3. SettingsField
code = code.replace(
  /function SettingsField\([\s\S]*?<\/label>\s*\}/,
  `function SettingsField({ label, hint, comingSoon = false, children }: { label: string; hint?: string; comingSoon?: boolean; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.1em' }}>{label}</span>
        {comingSoon ? <ComingSoonBadge /> : null}
      </div>
      {children}
      {hint ? <span style={{ display: 'block', marginTop: '0.5rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{hint}</span> : null}
    </label>
  )
}`
);

// 4. Input / Select field class -> inline styles
const fieldStyle = `style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s', opacity: (isLoadingProfile || isSavingProfile || isSavingMissionDefaults || !hasLoadedProfile || false) ? 0.5 : 1 }}`;

// We will replace className={... ? settingsFieldClass : textFieldClass} with the inline style
code = code.replace(/className=\{isLoadingProfile \|\| isSavingProfile \? settingsFieldClass : textFieldClass\}/g, fieldStyle);
code = code.replace(/className=\{isLoadingProfile \|\| isSavingMissionDefaults \|\| !hasLoadedProfile \? settingsFieldClass : textFieldClass\}/g, fieldStyle);
code = code.replace(/className=\{textFieldClass\}/g, `style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s' }}`);
code = code.replace(/className=\{settingsFieldClass\}/g, `style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s', opacity: 0.5 }}`);
code = code.replace(/className="w-full accent-primary"/g, `style={{ background: 'var(--bg-light)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.7rem 1rem', fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem', color: 'var(--ink)', outline: 'none', width: '100%', cursor: 'none', transition: 'border-color 0.2s' }}`);

// 5. NotificationToggleRow
code = code.replace(
  /function NotificationToggleRow\([\s\S]*?<\/div>\s*\)\s*\}/,
  `function NotificationToggleRow({ title, description, checked, disabled = false, onToggle, ariaLabel }: { title: string; description: string; checked: boolean; disabled?: boolean; onToggle: () => void; ariaLabel?: string }) {
  return (
    <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
      <div>
        <div style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.82rem', color: 'var(--ink-soft)', marginTop: '0.2rem' }}>{description}</div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={checked}
        aria-label={ariaLabel ?? \`Toggle \${title} notifications\`}
        style={{
          padding: 0,
          display: 'flex', alignItems: 'center',
          height: '24px', width: '44px', borderRadius: '100px', 
          border: checked ? '1px solid var(--electric)' : '1px solid var(--border-strong)', 
          background: checked ? 'rgba(255,107,26,0.15)' : 'var(--bg)', 
          cursor: 'none', transition: 'background 0.2s, border-color 0.2s',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span
          style={{
            height: '16px', width: '16px', borderRadius: '50%', 
            background: checked ? 'var(--electric)' : 'var(--ink-soft)', 
            transition: 'transform 0.2s, background 0.2s', 
            transform: checked ? 'translateX(20px)' : 'translateX(2px)'
          }}
        />
      </button>
    </div>
  )
}`
);

// 6. Save changes buttons
const saveBtnStyle = `style={{ background: 'var(--electric)', color: 'var(--cream)', border: 'none', borderRadius: '100px', padding: '0.65rem 1.6rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'none', opacity: (isLoadingProfile || isSavingProfile || isSavingMissionDefaults || !hasLoadedProfile) ? 0.6 : 1 }}`;
code = code.replace(/className=\{`px-5 py-3 text-sm \$\{primaryButtonClass\}`\}/g, saveBtnStyle);

const secBtnStyle = `style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink)', borderRadius: '100px', padding: '0.5rem 1.1rem', fontFamily: 'Satoshi, sans-serif', fontWeight: 600, fontSize: '0.82rem', cursor: 'none', opacity: (!founderEmail || isSendingResetLink) ? 0.6 : 1 }}`;
code = code.replace(/className=\{`px-5 py-3 text-sm \$\{outlineButtonClass\}`\}/g, secBtnStyle);

// 7. Transaction history rows
code = code.replace(/<div className="mt-4 rounded-card border border-border-subtle bg-surface">/g, `<div style={{ background: 'var(--bg)', borderRadius: '10px', overflow: 'hidden' }}>`);
code = code.replace(/<ul className="divide-y divide-border-subtle">/g, `<ul>`);
code = code.replace(
  /<li\s*key=\{transaction\.id\}\s*className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"\s*>/g,
  `<li key={transaction.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink)' }}>`
);
code = code.replace(/<div className="text-sm font-bold text-white">\{transaction\.description\}<\/div>/g, `<div>{transaction.description}</div>`);
code = code.replace(/<div className="mt-1 text-sm text-text-muted">\s*\{transactionDateFormatter\.format\(new Date\(transaction\.createdAt\)\)\}\s*<\/div>/g, `<div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--ink-soft)' }}>{transactionDateFormatter.format(new Date(transaction.createdAt))}</div>`);
code = code.replace(/className=\{`text-sm font-bold \$\{transaction\.amount >= 0 \? 'text-emerald-400' : 'text-red-400'\}`\}/g, `style={{ color: transaction.amount >= 0 ? 'var(--electric)' : 'var(--ink-soft)', fontWeight: transaction.amount >= 0 ? 600 : 400 }}`);

// 8. Danger zone card
code = code.replace(
  /className="border-red-900\/60 bg-red-950\/20 xl:col-span-2"/g,
  `style={{ background: 'rgba(192, 57, 43, 0.04)', border: '1px solid rgba(192, 57, 43, 0.18)', borderRadius: '10px', padding: '1.2rem 1.4rem', marginTop: '1.5rem', gridColumn: '1 / -1' }}`
);
code = code.replace(
  /<h3 className="text-lg font-black text-white">\{title\}<\/h3>/g, 
  `<div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: '#c0392b', letterSpacing: '0.12em' }}>DANGER ZONE</div>` // Wait, this will replace the one in SettingsSectionCard. 
);

// Fix danger zone replace since it's a SettingsSectionCard
// Instead of replacing the card internally, let's just use the custom style.
// Since the SettingsSectionCard is generic, passing a className with inline style won't work perfectly.
// Let's replace the entire danger zone block.
code = code.replace(
  /<SettingsSectionCard\s*title="Danger Zone"\s*description="Once you delete your account, there is no going back\. Please be certain\."\s*className="border-red-900\/60 bg-red-950\/20 xl:col-span-2"\s*>\s*<button\s*onClick=\{onOpenDeleteModal\}\s*className="rounded-xl bg-red-700 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-red-600"\s*>\s*DELETE ACCOUNT\s*<\/button>\s*<\/SettingsSectionCard>/,
  `<div style={{ background: 'rgba(192, 57, 43, 0.04)', border: '1px solid rgba(192, 57, 43, 0.18)', borderRadius: '10px', padding: '1.2rem 1.4rem', marginTop: '1.5rem', gridColumn: '1 / -1' }}>
    <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: '#c0392b', letterSpacing: '0.12em' }}>DANGER ZONE</div>
    <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', color: 'var(--ink-soft)', margin: '0.5rem 0 0.75rem' }}>Once you delete your account, there is no going back. Please be certain.</p>
    <button onClick={onOpenDeleteModal} style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: '#c0392b', background: 'none', border: 'none', cursor: 'none', textDecoration: 'underline' }}>
      DELETE ACCOUNT
    </button>
  </div>`
);

// 9. Main return layout
code = code.replace(
  /<section className="rounded-\[1\.9rem\] border border-border-subtle bg-surface p-4 sm:p-6">/,
  `<div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>`
);
code = code.replace(
  /<div className="grid gap-4 xl:grid-cols-2">/,
  `<div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>`
);
code = code.replace(
  /<\/div>\s*<\/section>\s*\)$/,
  `</div>\n    </div>\n  )`
);

// Strip out title section of old wrapper
code = code.replace(/<div className="mb-8">\s*<h2 className="text-2xl font-black text-white">Account Settings<\/h2>\s*<p className="mt-2 max-w-2xl text-sm text-text-muted">\s*Manage your founder profile, mission defaults, billing, and notifications from one place\.\s*<\/p>\s*<\/div>/, '');

// Other styling replacements
code = code.replace(/<div className="rounded-card border border-border-subtle bg-surface-elevated p-4">/g, `<div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>`);
code = code.replace(/<div className="mb-3 flex items-center justify-between text-sm">/g, `<div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Satoshi, sans-serif', fontSize: '0.85rem', marginBottom: '0.75rem' }}>`);
code = code.replace(/<span className="font-bold text-white">\{defaultTestersRequired\} testers<\/span>/g, `<span style={{ fontWeight: 700, color: 'var(--ink)' }}>{defaultTestersRequired} testers</span>`);
code = code.replace(/<span className="text-text-muted">5 to 50<\/span>/g, `<span style={{ color: 'var(--ink-soft)' }}>5 to 50</span>`);
code = code.replace(/<div className="mt-3 flex justify-between text-xs font-semibold uppercase tracking-\[0\.14em\] text-text-muted">/g, `<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--ink-soft)', letterSpacing: '0.14em' }}>`);

code = code.replace(/<div className="rounded-\[1\.75rem\] border border-dashed border-border-subtle bg-surface-elevated p-6">/g, `<div>`);
code = code.replace(/<div className="text-\[0\.7rem\] font-bold uppercase tracking-\[0\.2em\] text-text-muted">Coin Purchase History<\/div>/g, `<div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem', color: 'var(--ink-soft)', letterSpacing: '0.1em' }}>COIN PURCHASE HISTORY</div>`);

// Space-y
code = code.replace(/<div className="space-y-4">/g, `<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>`);
code = code.replace(/<div className="space-y-5">/g, `<div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>`);
code = code.replace(/<div className="space-y-3">/g, `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>`);
code = code.replace(/<div className="space-y-2">/g, `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>`);

fs.writeFileSync(path, code);
console.log('FounderSettingsTab.tsx updated');
