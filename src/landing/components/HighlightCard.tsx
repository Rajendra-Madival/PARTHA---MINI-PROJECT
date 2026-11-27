import { useId, useRef, useState, type PointerEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { COPY, type HighlightItem } from '../content/copy';
import { useReducedMotion } from '../motion/useReducedMotion';
import { MotifIcon } from './MotifIcons';

interface HighlightCardProps {
  item: HighlightItem;
}

export function HighlightCard({ item }: HighlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, hovered: false });
  const cardRef = useRef<HTMLElement | null>(null);
  const detailsId = useId();
  const reducedMotion = useReducedMotion();

  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reducedMotion || e.pointerType !== 'mouse') return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-py * 8).toFixed(2)),
      ry: Number((px * 8).toFixed(2)),
      hovered: true,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, hovered: false });
  };

  return (
    <article
      ref={cardRef}
      data-direction={item.direction}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: reducedMotion
          ? undefined
          : `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: tilt.hovered
          ? 'transform 140ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out'
          : 'transform 400ms ease-out, border-color 400ms ease-out, box-shadow 400ms ease-out',
      }}
      className={[
        'highlight-card gold-leaf-frame rounded-2xl p-6 sm:p-7 flex flex-col justify-between',
        tilt.hovered && !reducedMotion
          ? 'shadow-[0_14px_34px_rgba(20,56,42,0.12),0_0_24px_rgba(212,175,55,0.28)]'
          : 'shadow-[0_8px_24px_rgba(20,56,42,0.06)]',
      ].join(' ')}
    >
      <div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-[var(--c-brand-green)] border border-[rgba(20,56,42,0.24)] text-[var(--c-forest-900)]"
          style={{
            transform: tilt.hovered && !reducedMotion ? 'rotate(6deg)' : 'rotate(0deg)',
            transition: tilt.hovered ? 'transform 200ms ease-out' : 'transform 400ms ease-out',
          }}
        >
          <MotifIcon name={item.icon} className="w-7 h-7" />
        </div>

        <h3 className="text-card-h3 text-[var(--c-forest-900)] font-semibold mb-2.5">{item.title}</h3>
        <p className="text-base text-[var(--c-ink)] leading-relaxed m-0">
          {item.description}
        </p>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id={detailsId}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: reducedMotion ? 0.18 : 0.28, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <ul className="mt-4 pt-4 border-t border-[rgba(20,56,42,0.18)] space-y-2 text-sm text-[var(--c-ink)] list-none p-0 m-0">
                {item.details.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--c-terracotta)] shrink-0"
                      aria-hidden="true"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 pt-2">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex items-center gap-2 min-h-[44px] px-3 -ml-3 rounded-lg text-sm font-semibold text-[var(--c-forest-900)] hover:text-[var(--c-forest)] hover:bg-[rgba(20,56,42,0.08)] transition-colors duration-200 cursor-pointer"
        >
          <span>{expanded ? COPY.highlights.showLess : COPY.highlights.learnMore}</span>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            aria-hidden="true"
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </article>
  );
}
