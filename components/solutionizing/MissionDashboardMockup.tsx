export function MissionDashboardMockup() {
  return (
    <div className="group relative">
      <div className="absolute -inset-10 rounded-full bg-primary/10 opacity-40 blur-[100px]" />
      <div className="relative z-10 aspect-[4/3] overflow-hidden rounded-[2.5rem] border border-secondary/20 bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between border-b border-secondary/20 bg-neutral-bg/80 px-6 py-4 lg:px-8 lg:py-5">
          <div className="flex gap-2.5">
            <div className="h-3.5 w-3.5 rounded-full bg-red-500/60" />
            <div className="h-3.5 w-3.5 rounded-full bg-orange-500/60" />
            <div className="h-3.5 w-3.5 rounded-full bg-secondary/40" />
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.25em] text-text-main/60">Mission Dashboard - v2.4</div>
        </div>

        <div className="flex flex-col gap-8 p-6 lg:p-8">
          <div className="rounded-2xl border border-secondary/20 bg-neutral-bg p-6 lg:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <h3 className="text-lg font-black text-text-main">Checkout clarity validation</h3>
              <span className="rounded-md bg-secondary px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">Active</span>
            </div>

            <div className="mb-3 h-3 w-full rounded-full border border-secondary/5 bg-white shadow-inner">
              <div className="h-full w-3/4 rounded-full bg-primary shadow-[0_0_15px_rgba(217,119,6,0.3)]" />
            </div>
            <p className="text-[11px] font-black uppercase text-text-main/60">18 of 24 responses collected</p>
          </div>

          <div className="grid grid-cols-2 gap-5 lg:gap-6">
            <div className="rounded-2xl border border-secondary/20 bg-white p-5 shadow-xl shadow-black/5 lg:p-6">
              <p className="mb-2 text-[11px] font-black uppercase text-secondary">Signal strength</p>
              <p className="text-4xl font-black text-text-main">84%</p>
            </div>

            <div className="z-20 rounded-2xl border-[3px] border-primary bg-white p-6 shadow-[0_25px_50px_-12px_rgba(217,119,6,0.25)] lg:translate-y-2 lg:scale-[1.03]">
              <p className="mb-2 text-[11px] font-black uppercase text-primary">Critical insight</p>
              <p className="text-3xl font-black tracking-tight text-text-main">Copy is underspecified</p>
            </div>
          </div>

          <div className="mockup-layer rounded-2xl border border-white/10 bg-text-main p-5 sm:p-7 text-white shadow-2xl lg:translate-x-4">
            <div className="mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
              <span className="material-symbols-outlined text-xl sm:text-2xl font-bold text-primary">chat_bubble</span>
              <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-primary">Key friction point</h4>
            </div>
            <p className="mb-2 sm:mb-3 text-base sm:text-lg font-bold leading-relaxed text-white">&quot;I understood the action, but not what would happen next.&quot;</p>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Verified signal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
