import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COPY } from '../content/copy';
import { DwaraArchSvg } from '../components/MotifIcons';
import { useScrollProgress } from '../motion/useScrollProgress';
import { useReducedMotion } from '../motion/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const RING_ARCH_COUNT = 6;

function useIsTabletOrDesktop(): boolean {
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 640px)').matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(min-width: 640px)');
    const onChange = (e: MediaQueryListEvent) => setWide(e.matches);
    setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return wide;
}

export function Gurukul() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const isTabletOrDesktop = useIsTabletOrDesktop();

  const use3DRing = isTabletOrDesktop && !reducedMotion;

  const progress = useScrollProgress(sectionRef, {
    start: 'top 65%',
    end: 'bottom 35%',
    scrub: 0.75,
    disabled: !use3DRing,
  });

  useEffect(() => {
    if (!reducedMotion || !cardsRef.current) return;
    const el = cardsRef.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.2,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [reducedMotion]);

  // Ring rotates 0deg to 300deg with scroll progress (Section 6.3)
  const rotationDeg = progress * 300;

  return (
    <section
      id="gurukul"
      ref={sectionRef}
      aria-labelledby="gurukul-heading"
      className="bg-[var(--c-night-1)] py-24 sm:py-32 px-5 overflow-hidden border-b border-[rgba(212,175,55,0.4)]"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <h2 id="gurukul-heading" className="text-section-h2 text-[var(--c-ivory)] mb-4">
            {COPY.gurukul.heading}
          </h2>
          <p className="text-body-copy text-[var(--c-ivory-dim)] mx-auto">
            {COPY.gurukul.body}
          </p>
        </div>

        {use3DRing ? (
          <div className="gurukul-stage relative h-[380px] flex items-center justify-center">
            <div
              className="gurukul-ring relative w-[290px] h-[340px]"
              style={{
                transform: `rotateY(${-rotationDeg}deg)`,
              }}
            >
              {Array.from({ length: RING_ARCH_COUNT }, (_, idx) => {
                const archAngle = idx * 60;
                const relativeAngle = (((archAngle - rotationDeg) % 360) + 360) % 360;
                const distanceFromFront = Math.min(relativeAngle, 360 - relativeAngle);
                const isFront = distanceFromFront < 42;
                const pillar = COPY.gurukul.pillars[idx % COPY.gurukul.pillars.length];
                const isDuplicatePillar = idx >= COPY.gurukul.pillars.length;

                return (
                  <article
                    key={idx}
                    aria-hidden={isDuplicatePillar ? true : undefined}
                    className="gurukul-arch-face absolute inset-0 rounded-t-[140px] rounded-b-2xl p-6 flex flex-col items-center justify-center text-center bg-[rgba(11,16,38,0.9)] border border-[rgba(212,175,55,0.6)]"
                    style={{
                      transform: `rotateY(${archAngle}deg) translateZ(295px)`,
                      opacity: isFront ? 1 : 0.3,
                      transition: 'opacity 220ms ease-out',
                    }}
                  >
                    <DwaraArchSvg className="pointer-events-none absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] text-[var(--c-gold)] opacity-35" />
                    <div className="relative z-10 px-2">
                      <p className="font-mixed text-xs uppercase tracking-[0.14em] text-[var(--c-gold)] mb-2 m-0">
                        {pillar.sanskritLabel}
                      </p>
                      <h3 className="text-card-h3 text-[var(--c-saffron)] mb-3">
                        {pillar.title}
                      </h3>
                      <p className="text-sm sm:text-base text-[var(--c-ivory)] leading-relaxed m-0">
                        {pillar.body}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          /* Mobile swipeable row OR static 3-column grid under reduced motion */
          <div
            ref={cardsRef}
            className={
              reducedMotion
                ? 'grid grid-cols-1 sm:grid-cols-3 gap-5'
                : 'flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-3'
            }
            aria-label={COPY.gurukul.mobileRegionLabel}
          >
            {COPY.gurukul.pillars.map((pillar) => (
              <article
                key={pillar.id}
                className={[
                  'rounded-t-[100px] sm:rounded-t-2xl rounded-b-2xl p-6 pt-10 sm:pt-6 relative bg-[var(--c-night-0)] border border-[rgba(212,175,55,0.45)] text-center sm:text-left',
                  reducedMotion ? '' : 'snap-center shrink-0 w-[85%]',
                ].join(' ')}
              >
                <DwaraArchSvg className="sm:hidden pointer-events-none absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] text-[var(--c-gold)] opacity-25" />
                <div className="relative z-10">
                  <p className="font-mixed text-xs uppercase tracking-[0.12em] text-[var(--c-gold)] mb-2 m-0">
                    {pillar.sanskritLabel}
                  </p>
                  <h3 className="text-card-h3 text-[var(--c-saffron)] mb-2.5">
                    {pillar.title}
                  </h3>
                  <p className="text-base text-[var(--c-ivory-dim)] m-0">{pillar.body}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
