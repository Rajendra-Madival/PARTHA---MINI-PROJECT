import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COPY } from '../content/copy';
import { useReducedMotion } from '../motion/useReducedMotion';
import { useScrollProgress } from '../motion/useScrollProgress';

gsap.registerPlugin(ScrollTrigger);

const DIYA_FOOTPATH_DOTS = Array.from({ length: 12 }, (_, idx) => {
  const t = idx / 11;
  return {
    id: idx,
    cx: 200 + Math.sin(t * Math.PI * 1.4) * (18 * (1 - t * 0.7)),
    cy: 290 - t * 235,
    r: 5.5 - t * 3.4,
    threshold: t * 0.85,
  };
});

export function Question() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const wordsContainerRef = useRef<HTMLHeadingElement | null>(null);
  const followUpRef = useRef<HTMLParagraphElement | null>(null);
  const reducedMotion = useReducedMotion();

  const progress = useScrollProgress(sectionRef, {
    start: 'top 75%',
    end: 'bottom 65%',
    scrub: 0.75,
  });

  const prefixWords = COPY.question.headingPrefix.trim().split(/\s+/);
  const allWords = [
    ...prefixWords.map((word) => ({ word, isAccent: false })),
    { word: COPY.question.headingAccent, isAccent: true },
  ];

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const wordsContainer = wordsContainerRef.current;
    const followUp = followUpRef.current;
    if (!sectionEl || !wordsContainer || !followUp) return;

    const wordNodes = wordsContainer.querySelectorAll<HTMLElement>('[data-word]');

    if (reducedMotion) {
      const ctx = gsap.context(() => {
        gsap.set(wordNodes, { opacity: 1, y: 0 });
        gsap.fromTo(
          [wordsContainer, followUp],
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.2,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionEl,
              start: 'top 80%',
              once: true,
            },
          },
        );
      }, sectionEl);
      return () => ctx.revert();
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top 72%',
          end: 'center 35%',
          scrub: 0.75,
        },
      });

      tl.fromTo(
        wordNodes,
        { opacity: 0.15, y: 8 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          ease: 'power1.inOut',
        },
      ).fromTo(
        followUp,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: 'power1.inOut',
        },
        '>0.08',
      );
    }, sectionEl);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      id="question"
      ref={sectionRef}
      aria-labelledby="question-heading"
      className="relative min-h-screen bg-[var(--c-night-0)] flex items-center justify-center px-5 py-24 overflow-hidden border-b border-[rgba(212,175,55,0.4)]"
    >
      {/* Footpath of small glowing diya dots receding toward a horizon */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 320"
        className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full max-w-2xl h-[320px] opacity-75"
      >
        <defs>
          <radialGradient id="diya-dot-glow">
            <stop offset="0%" stopColor="#F4A21B" stopOpacity="1" />
            <stop offset="55%" stopColor="#FF7A1A" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FF7A1A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M200 55 C 184 130, 218 210, 200 295"
          fill="none"
          stroke="#D4AF37"
          strokeOpacity="0.18"
          strokeWidth="1.2"
          strokeDasharray="4 6"
        />
        {DIYA_FOOTPATH_DOTS.map((dot) => {
          const lit = reducedMotion || progress >= dot.threshold;
          return (
            <g key={dot.id}>
              <circle
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r * 3.4}
                fill="url(#diya-dot-glow)"
                style={{
                  opacity: lit ? 0.85 : 0.08,
                  transition: reducedMotion ? 'none' : 'opacity 250ms ease-out',
                }}
              />
              <circle
                cx={dot.cx}
                cy={dot.cy}
                r={dot.r}
                fill={lit ? '#F4A21B' : '#D4AF37'}
                fillOpacity={lit ? 1 : 0.22}
              />
            </g>
          );
        })}
      </svg>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2
          id="question-heading"
          ref={wordsContainerRef}
          className="text-section-h2 text-[var(--c-ivory)] flex flex-wrap justify-center gap-x-[0.3em] gap-y-2"
        >
          {allWords.map((item, index) => (
            <span
              key={`${item.word}-${index}`}
              data-word
              className={item.isAccent ? 'text-[var(--c-saffron)]' : 'text-[var(--c-ivory)]'}
            >
              {item.word}
            </span>
          ))}
        </h2>

        <p
          ref={followUpRef}
          className="mt-8 mx-auto text-body-copy text-lg sm:text-xl text-[var(--c-ivory-dim)] max-w-2xl"
        >
          {COPY.question.followUp}
        </p>
      </div>
    </section>
  );
}
