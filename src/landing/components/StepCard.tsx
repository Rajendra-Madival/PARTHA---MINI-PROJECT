import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { COPY, type StoryWaypointScene } from '../content/copy';

interface StepCardProps {
  scene: StoryWaypointScene;
  expanded: boolean;
  onToggle: (id: StoryWaypointScene['id']) => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onJoinAlumni?: () => void;
}

export function StepCard({
  scene,
  expanded,
  onToggle,
  onOpenAuth,
  onJoinAlumni,
}: StepCardProps) {
  const detailsId = useId();
  const isDark = scene.mode === 'dark';
  const isGate = scene.id === 'gate';

  // Gate renders a compact card sitting cleanly above the arch in sky with auth CTAs inside
  if (isGate) {
    return (
      <article
        data-step-card={scene.id}
        className="max-w-[340px] w-full rounded-2xl px-4 py-2.5 border backdrop-blur-md bg-[rgba(255,254,250,0.92)] border-[rgba(20,56,42,0.22)] text-[var(--c-ink)] shadow-[0_14px_32px_rgba(20,56,42,0.12)]"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--c-forest)] leading-none mb-1 m-0">
              Stop {scene.stopNumber} of 5 · {scene.epicTitle}
            </p>
            <h2
              id={`heading-${scene.id}`}
              className="font-[var(--font-landing-display)] text-xl sm:text-2xl font-bold leading-tight text-[var(--c-forest-900)] m-0"
            >
              {COPY.gate.heading}
            </h2>
          </div>

          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={expanded ? COPY.card.collapseHint : COPY.card.expandHint}
            onClick={() => onToggle(scene.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-[rgba(20,56,42,0.24)] bg-[rgba(250,247,240,0.9)] text-[var(--c-forest-900)] hover:bg-[var(--c-brand-green)] transition-colors cursor-pointer shrink-0"
          >
            <span>{expanded ? 'Hide' : 'Details'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          id={detailsId}
          hidden={!expanded}
          className="mt-2.5 pt-2.5 border-t border-[rgba(20,56,42,0.16)]"
        >
          <p className="text-xs leading-relaxed text-[var(--c-ink)] m-0">{scene.body}</p>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenAuth?.('login')}
            className="v3-btn-primary flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-sm transition-colors cursor-pointer"
          >
            {COPY.gate.loginCta}
          </button>
          <button
            type="button"
            onClick={() => onOpenAuth?.('register')}
            className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl text-sm font-semibold border border-[var(--c-forest-900)] bg-[#FFFEFA] text-[var(--c-forest-900)] hover:bg-[var(--c-brand-green)] transition-colors cursor-pointer"
          >
            {COPY.gate.signupCta}
          </button>
        </div>
      </article>
    );
  }

  // Stops 1-4: <= 240x64px translucent pill when collapsed; <= 340px wide expanded card in same slot
  const surfaceClasses = isDark
    ? 'bg-[rgba(11,16,38,0.72)] border-[rgba(212,175,55,0.42)] text-[var(--c-ivory)] shadow-[0_14px_34px_rgba(0,0,0,0.42)]'
    : 'bg-[rgba(255,254,250,0.8)] border-[rgba(20,56,42,0.22)] text-[var(--c-ink)] shadow-[0_14px_32px_rgba(20,56,42,0.12)]';

  return (
    <article
      data-step-card={scene.id}
      className={[
        'backdrop-blur-md border transition-all duration-200',
        surfaceClasses,
        expanded
          ? 'w-[min(340px,calc(100vw-76px))] md:w-[min(340px,calc(100vw-2rem))] max-w-[340px] rounded-2xl p-4 sm:p-5'
          : 'w-fit max-w-[240px] max-h-[64px] rounded-2xl overflow-hidden',
      ].join(' ')}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => onToggle(scene.id)}
        className={[
          'w-full text-left flex items-center justify-between gap-2.5 cursor-pointer bg-transparent border-0',
          expanded ? 'p-0' : 'px-3.5 py-2',
        ].join(' ')}
      >
        <div className="min-w-0">
          <p
            className={[
              'text-[10px] font-semibold uppercase tracking-[0.13em] leading-none mb-1 m-0',
              isDark ? 'text-[var(--c-gold)]' : 'text-[var(--c-forest)]',
            ].join(' ')}
          >
            Stop {scene.stopNumber} of 5
          </p>
          <h2
            id={`heading-${scene.id}`}
            className={[
              'font-[var(--font-landing-display)] font-semibold leading-tight m-0',
              expanded ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg truncate',
              isDark ? 'text-[var(--c-ivory)]' : 'text-[var(--c-forest-900)]',
            ].join(' ')}
          >
            {scene.stepTitle}
          </h2>
        </div>

        <ChevronDown
          className={[
            'w-4 h-4 shrink-0 transition-transform duration-200',
            expanded ? 'rotate-180' : '',
            isDark ? 'text-[var(--c-gold)]' : 'text-[var(--c-forest-900)]',
          ].join(' ')}
          aria-hidden="true"
        />
      </button>

      <div
        id={detailsId}
        hidden={!expanded}
        className={[
          'mt-3 pt-3 border-t',
          isDark ? 'border-[rgba(212,175,55,0.26)]' : 'border-[rgba(20,56,42,0.16)]',
        ].join(' ')}
      >
        <p
          className={[
            'text-xs font-semibold uppercase tracking-[0.1em] mb-1.5 m-0',
            isDark ? 'text-[var(--c-saffron)]' : 'text-[var(--c-forest)]',
          ].join(' ')}
        >
          {scene.epicTitle}
        </p>

        <p
          className={[
            'text-sm leading-relaxed m-0',
            isDark ? 'text-[var(--c-ivory-dim)]' : 'text-[var(--c-ink)]',
          ].join(' ')}
        >
          {scene.body}
        </p>

        {scene.alumniLine && (
          <div className="mt-3 pt-3 border-t border-[rgba(20,56,42,0.16)] flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[var(--c-forest-900)] m-0">
              {scene.alumniLine}
            </p>
            {onJoinAlumni && (
              <button
                type="button"
                onClick={onJoinAlumni}
                className="min-h-[36px] px-3 rounded-xl text-xs font-semibold border border-[var(--c-forest-900)] bg-[var(--c-brand-green)] text-[var(--c-forest-900)] hover:bg-[#D1FAE5] transition-colors cursor-pointer"
              >
                Join as alumni
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
