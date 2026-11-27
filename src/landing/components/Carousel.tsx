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
          className="palm-leaf-card relative rounded-2xl p-7 sm:p-10 shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
          style={{
            transform: reducedMotion ? 'none' : `rotate(${active.tiltDeg}deg)`,
          }}
        >
          {/* Ornamental gold SVG border */}
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

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-[var(--c-night-1)] text-[var(--c-ivory)]">
                {COPY.stories.sampleBadge}
              </span>
              <span className="text-xs font-semibold text-[var(--c-night-1)]">
                {activeIndex + 1} / {total}
              </span>
            </div>

            <blockquote className="m-0">
              <p className="text-lg sm:text-xl leading-relaxed font-medium text-[var(--c-night-0)] m-0">
                “{active.quote}”
              </p>
              <footer className="mt-6 pt-4 border-t border-[rgba(27,31,75,0.22)] flex flex-wrap items-baseline justify-between gap-2">
                <cite className="not-italic font-semibold text-base text-[var(--c-night-0)]">
                  {active.name}
                </cite>
                <span className="text-sm text-[var(--c-night-1)]">
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
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[rgba(212,175,55,0.45)] bg-[rgba(27,31,75,0.7)] text-[var(--c-ivory)] hover:border-[var(--c-saffron)] cursor-pointer"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden="true">
              <path d="M12.5 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={COPY.stories.nextLabel}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[rgba(212,175,55,0.45)] bg-[rgba(27,31,75,0.7)] text-[var(--c-ivory)] hover:border-[var(--c-saffron)] cursor-pointer"
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
            className="min-w-[44px] min-h-[44px] px-3.5 inline-flex items-center justify-center rounded-xl border border-[rgba(212,175,55,0.4)] bg-[rgba(27,31,75,0.5)] text-xs font-medium text-[var(--c-ivory-dim)] hover:text-[var(--c-ivory)] cursor-pointer"
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
                      ? 'w-6 h-2.5 bg-[var(--c-saffron)]'
                      : 'w-2.5 h-2.5 bg-[rgba(212,175,55,0.4)] hover:bg-[var(--c-gold)]',
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
