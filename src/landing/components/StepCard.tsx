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

  return (
    <article
      className={[
        'rounded-2xl p-6 sm:p-8 border transition-colors duration-200',
        isDark
          ? 'bg-[rgba(11,16,38,0.9)] border-[rgba(212,175,55,0.4)] text-[var(--c-ivory)] shadow-[0_18px_46px_rgba(0,0,0,0.45)]'
          : 'bg-[#FFFEFA] border-[rgba(20,56,42,0.22)] text-[var(--c-ink)] shadow-[0_18px_40px_rgba(20,56,42,0.1)]',
      ].join(' ')}
    >
      <p
        className={[
          'text-xs font-semibold uppercase tracking-[0.14em] mb-2 m-0',
          isDark ? 'text-[var(--c-gold)]' : 'text-[var(--c-forest)]',
        ].join(' ')}
      >
        Stop {scene.stopNumber} of 5 · {scene.epicTitle}
      </p>

      <h2
        id={`heading-${scene.id}`}
        className={[
          'v3-scene-heading mb-3',
          isDark ? 'text-[var(--c-ivory)]' : 'text-[var(--c-forest-900)]',
        ].join(' ')}
      >
        {isGate ? COPY.gate.heading : scene.stepTitle}
      </h2>

      {!isGate && (
        <p
          className={[
            'v3-step-title font-medium mb-4',
            isDark ? 'text-[var(--c-saffron)]' : 'text-[var(--c-forest)]',
          ].join(' ')}
        >
          {scene.epicTitle}
        </p>
      )}

      {isGate && (
        <p className="text-sm font-semibold text-[var(--c-forest)] mb-4 m-0">
          Step {scene.stopNumber}: {scene.stepTitle}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => onToggle(scene.id)}
          className={[
            'inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl text-sm font-semibold border transition-colors duration-200 cursor-pointer',
            isDark
              ? 'border-[rgba(212,175,55,0.45)] bg-[rgba(27,31,75,0.75)] text-[var(--c-ivory)] hover:border-[var(--c-saffron)]'
              : 'border-[rgba(20,56,42,0.28)] bg-[var(--c-brand-white)] text-[var(--c-forest-900)] hover:bg-[var(--c-brand-green)]',
          ].join(' ')}
        >
          <span>{expanded ? COPY.card.collapseHint : COPY.card.expandHint}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        id={detailsId}
        hidden={!expanded}
        className={[
          'mt-5 pt-5 border-t',
          isDark ? 'border-[rgba(212,175,55,0.26)]' : 'border-[rgba(20,56,42,0.16)]',
        ].join(' ')}
      >
        <p
          className={[
            'text-base leading-relaxed m-0',
            isDark ? 'text-[var(--c-ivory-dim)]' : 'text-[var(--c-ink)]',
          ].join(' ')}
        >
          {scene.body}
        </p>

        {scene.alumniLine && (
          <div className="mt-4 pt-4 border-t border-[rgba(20,56,42,0.16)] flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--c-forest-900)] m-0">
              {scene.alumniLine}
            </p>
            {onJoinAlumni && (
              <button
                type="button"
                onClick={onJoinAlumni}
                className="min-h-[44px] px-4 rounded-xl text-sm font-semibold border border-[var(--c-forest-900)] bg-[var(--c-brand-green)] text-[var(--c-forest-900)] hover:bg-[#D1FAE5] transition-colors cursor-pointer"
              >
                Join as alumni
              </button>
            )}
          </div>
        )}
      </div>

      {isGate && (
        <div className="mt-6 pt-5 border-t border-[rgba(20,56,42,0.16)] flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => onOpenAuth?.('login')}
            className="v3-btn-primary min-h-[44px] px-6 rounded-xl text-base transition-colors cursor-pointer"
          >
            {COPY.gate.loginCta}
          </button>
          <button
            type="button"
            onClick={() => onOpenAuth?.('register')}
            className="min-h-[44px] px-6 rounded-xl text-base font-semibold border border-[var(--c-forest-900)] bg-[#FFFEFA] text-[var(--c-forest-900)] hover:bg-[var(--c-brand-green)] transition-colors cursor-pointer"
          >
            {COPY.gate.signupCta}
          </button>
        </div>
      )}
    </article>
  );
}
