import type { CSSProperties } from 'react';
import { COPY } from '../content/copy';
import { Carousel } from '../components/Carousel';
import { useReducedMotion } from '../motion/useReducedMotion';

const DIYA_PARTICLES = Array.from({ length: 24 }, (_, idx) => ({
  id: idx,
  left: `${(idx * 37 + 9) % 92 + 4}%`,
  bottom: `${(idx * 19) % 45 + 4}%`,
  size: (idx % 3) + 3,
  duration: `${8 + (idx % 6)}s`,
  delay: `${-(idx % 7) * 1.2}s`,
  driftX: `${(idx % 2 === 0 ? 1 : -1) * (8 + (idx % 12))}px`,
}));

export function Testimonials() {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="stories"
      aria-labelledby="stories-heading"
      className="relative bg-[var(--c-night-0)] py-24 sm:py-32 px-5 overflow-hidden border-b border-[rgba(212,175,55,0.4)]"
    >
      {/* Sparse upward drifting diya particles (disabled under reduced motion) */}
      {!reducedMotion && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {DIYA_PARTICLES.map((p) => (
            <span
              key={p.id}
              className="diya-particle absolute rounded-full bg-[var(--c-saffron)] shadow-[0_0_8px_rgba(244,162,27,0.8)]"
              style={
                {
                  left: p.left,
                  bottom: p.bottom,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  '--drift-duration': p.duration,
                  '--drift-delay': p.delay,
                  '--drift-x': p.driftX,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 id="stories-heading" className="text-section-h2 text-[var(--c-ivory)]">
            {COPY.stories.heading}
          </h2>
        </div>

        <Carousel items={COPY.stories.items} />
      </div>
    </section>
  );
}
