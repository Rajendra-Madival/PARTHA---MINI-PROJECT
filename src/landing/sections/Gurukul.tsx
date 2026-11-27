import { COPY } from '../content/copy';
import { GurukulSceneSvg } from '../components/GurukulSceneSvg';
import { JharokhaArchSvg, RangoliBorder } from '../components/Patterns';

export function Gurukul() {
  return (
    <section
      id="gurukul"
      data-section-mode="light"
      aria-labelledby="gurukul-heading"
      className="relative bg-[var(--c-brand-white)] py-24 sm:py-32 px-5 overflow-hidden border-b border-[rgba(212,175,55,0.4)]"
    >
      {/* Rangoli border tile along top edge (v2 Section 4.6) */}
      <div className="absolute top-0 inset-x-0 text-[var(--c-bronze)]">
        <RangoliBorder />
      </div>

      {/* Banyan forest silhouette strip along the bottom edge (v2 Section 4.3) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full h-16 sm:h-24 text-[var(--c-forest)] opacity-15"
      >
        <path
          d="M0 120V82C70 68 120 76 180 86C240 52 330 56 390 88C460 66 530 70 590 92C670 46 770 48 840 84C910 60 990 66 1050 90C1130 56 1220 62 1290 86C1350 70 1400 72 1440 82V120H0Z"
          fill="currentColor"
        />
      </svg>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <h2 id="gurukul-heading" className="text-section-h2 text-[var(--c-forest-900)] mb-4">
            {COPY.gurukul.heading}
          </h2>
          <p className="text-body-copy text-[var(--c-ink)] mx-auto">
            {COPY.gurukul.body}
          </p>
        </div>

        {/* Jharokha arch framing the static Gurukul scene (v2 Section 6.3) */}
        <div className="relative max-w-3xl mx-auto mb-10 sm:mb-12 rounded-2xl bg-[#FFFEFA] border border-[rgba(140,106,59,0.28)] px-4 pt-6 pb-4 sm:px-8 sm:pt-8 shadow-[0_14px_40px_-24px_rgba(20,56,42,0.2)] overflow-hidden">
          <JharokhaArchSvg className="absolute inset-0 w-full h-full text-[var(--c-bronze)] opacity-45" />
          <div className="relative z-10">
            <GurukulSceneSvg label={COPY.gurukul.sceneLabel} />
          </div>
        </div>

        {/* Three pillar panels (static in Phase 4R-A; student selection added in Phase 4R-C) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {COPY.gurukul.pillars.map((pillar) => (
            <article
              key={pillar.id}
              className="rounded-2xl p-6 bg-[#FFFEFA] border border-[rgba(20,56,42,0.18)] shadow-[0_10px_28px_-20px_rgba(20,56,42,0.18)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  aria-hidden="true"
                  className="inline-block w-2 h-2 rounded-full bg-[var(--c-vermilion)]"
                />
                <p className="font-mixed text-xs uppercase tracking-[0.12em] text-[var(--c-forest-900)] font-semibold m-0">
                  {pillar.sanskritLabel}
                </p>
              </div>
              <h3 className="text-card-h3 text-[var(--c-forest-900)] mb-2 font-semibold">
                {pillar.title}
              </h3>
              <p className="text-base text-[var(--c-ink)] m-0">{pillar.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
