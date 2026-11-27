import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COPY } from '../content/copy';
import { HighlightCard } from '../components/HighlightCard';
import { useReducedMotion } from '../motion/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export function Highlights() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = Array.from(section.querySelectorAll<HTMLElement>('.highlight-card'));
    if (cards.length === 0) return;

    if (reducedMotion) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          cards,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.2,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              once: true,
            },
          },
        );
      }, section);
      return () => ctx.revert();
    }

    // Group into rows of 3 so at most 3 cards animate simultaneously (Section 5.2)
    const ctx = gsap.context(() => {
      for (let startIdx = 0; startIdx < cards.length; startIdx += 3) {
        const row = cards.slice(startIdx, startIdx + 3);
        const rowTrigger = row[0];
        if (!rowTrigger) continue;

        row.forEach((card, colIdx) => {
          const direction = card.dataset.direction;
          const fromVars: gsap.TweenVars = { opacity: 0 };
          if (direction === 'left') fromVars.x = -60;
          else if (direction === 'right') fromVars.x = 60;
          else fromVars.y = 60;

          gsap.fromTo(card, fromVars, {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.9,
            delay: colIdx * 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              once: true,
            },
          });
        });
      }
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      id="highlights"
      ref={sectionRef}
      aria-labelledby="highlights-heading"
      className="bg-[var(--c-night-0)] py-24 sm:py-32 px-5 overflow-x-clip border-b border-[rgba(212,175,55,0.4)]"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 id="highlights-heading" className="text-section-h2 text-[var(--c-ivory)] mb-3">
            {COPY.highlights.heading}
          </h2>
          <p className="text-body-copy text-[var(--c-ivory-dim)] mx-auto">
            {COPY.highlights.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {COPY.highlights.items.map((item) => (
            <HighlightCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
