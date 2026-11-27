import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type TouchEvent,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { COPY, type TestimonialItem } from '../content/copy';
import { useReducedMotion } from '../motion/useReducedMotion';

interface CarouselProps {
  items: readonly TestimonialItem[];
}

export function Carousel({ items }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverOrFocusPaused, setHoverOrFocusPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const reducedMotion = useReducedMotion();

  const total = items.length;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (hoverOrFocusPaused || userPaused || reducedMotion || total <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((prevIdx) => (prevIdx + 1) % total);
    }, 6000);
    return () => window.clearInterval(id);
  }, [hoverOrFocusPaused, userPaused, reducedMotion, total]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) next();
      else prev();
    }
  };

  const active = items[activeIndex];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={COPY.stories.slidesListLabel}
      onMouseEnter={() => setHoverOrFocusPaused(true)}
      onMouseLeave={() => setHoverOrFocusPaused(false)}
      onFocusCapture={() => setHoverOrFocusPaused(true)}
      onBlurCapture={() => setHoverOrFocusPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative max-w-3xl mx-auto"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.article
          key={active.id}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: reducedMotion ? 0.18 : 0.3, ease: 'easeOut' }}
          className="parchment-card relative rounded-2xl p-7 sm:p-10 shadow-[0_14px_38px_rgba(20,56,42,0.12)]"
          style={{
            transform: reducedMotion ? 'none' : `rotate(${active.tiltDeg}deg)`,
          }}
        >
          {/* Ornamental gold SVG border + faint rangoli corners */}
          <svg
            aria-hidden="true"
            viewBox="0 0 400 220"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] text-[var(--c-gold)]"
          >
            <rect
              x="2"
              y="2"
              width="396"
              height="216"
              rx="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeOpacity="0.85"
            />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 32 32"
            className="pointer-events-none absolute top-3.5 left-3.5 w-6 h-6 text-[var(--c-bronze)] opacity-45"
          >
            <path d="M4 16 C4 8 8 4 16 4 M4 10 C8 10 10 8 10 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="7" cy="7" r="1.3" fill="currentColor" />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 32 32"
            className="pointer-events-none absolute bottom-3.5 right-3.5 w-6 h-6 text-[var(--c-bronze)] opacity-45 rotate-180"
          >
            <path d="M4 16 C4 8 8 4 16 4 M4 10 C8 10 10 8 10 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="7" cy="7" r="1.3" fill="currentColor" />
          </svg>

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-[var(--c-forest-900)] text-[var(--c-ivory)]">
                {COPY.stories.sampleBadge}
              </span>
              <span className="text-xs font-semibold text-[var(--c-forest-900)]">
                {activeIndex + 1} / {total}
              </span>
            </div>

            <blockquote className="m-0">
              <p className="text-lg sm:text-xl leading-relaxed font-medium text-[var(--c-ink)] m-0">
                “{active.quote}”
              </p>
              <footer className="mt-6 pt-4 border-t border-[rgba(20,56,42,0.2)] flex flex-wrap items-baseline justify-between gap-2">
                <cite className="not-italic font-semibold text-base text-[var(--c-ink)]">
                  {active.name}
                </cite>
                <span className="text-sm text-[var(--c-ink-soft)]">
                  {active.field} · {active.city}
                </span>
              </footer>
            </blockquote>
          </div>
        </motion.article>
      </AnimatePresence>

      {/* Controls: Previous, Next, Pause/Play, persistent live status, and labelled dots */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            aria-label={COPY.stories.prevLabel}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[rgba(20,56,42,0.3)] bg-[#FFFEFA] text-[var(--c-forest-900)] hover:border-[var(--c-forest-900)] hover:bg-[var(--c-brand-green)] transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden="true">
              <path d="M12.5 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={COPY.stories.nextLabel}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[rgba(20,56,42,0.3)] bg-[#FFFEFA] text-[var(--c-forest-900)] hover:border-[var(--c-forest-900)] hover:bg-[var(--c-brand-green)] transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden="true">
              <path d="M7.5 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-pressed={userPaused}
            aria-label={userPaused ? COPY.stories.playLabel : COPY.stories.pauseLabel}
            className="min-w-[44px] min-h-[44px] px-3.5 inline-flex items-center justify-center rounded-xl border border-[rgba(20,56,42,0.3)] bg-[#FFFEFA] text-xs font-semibold text-[var(--c-forest-900)] hover:border-[var(--c-forest-900)] hover:bg-[var(--c-brand-green)] transition-colors cursor-pointer"
          >
            {userPaused ? COPY.stories.playText : COPY.stories.pauseText}
          </button>
          <span className="sr-only" aria-live="polite">
            {active.name}: {activeIndex + 1} / {total}
          </span>
        </div>

        <div
          className="flex items-center gap-1"
          role="tablist"
          aria-label={COPY.stories.slidesListLabel}
        >
          {items.map((item, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`${COPY.stories.slideTabPrefix} ${idx + 1}: ${item.name}`}
                onClick={() => goTo(idx)}
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center cursor-pointer"
              >
                <span
                  className={[
                    'block rounded-full transition-all duration-200',
                    isSelected
                      ? 'w-6 h-2.5 bg-[var(--c-forest-900)]'
                      : 'w-2.5 h-2.5 bg-[rgba(20,56,42,0.28)] hover:bg-[var(--c-forest)]',
                  ].join(' ')}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
