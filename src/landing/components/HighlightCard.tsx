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
        'highlight-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between',
        'bg-[var(--c-night-2)] border',
        tilt.hovered && !reducedMotion
          ? 'border-[var(--c-gold)] shadow-[0_0_28px_rgba(212,175,55,0.24)]'
          : 'border-[rgba(212,175,55,0.32)]',
      ].join(' ')}
    >
      <div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-[rgba(11,16,38,0.65)] border border-[rgba(212,175,55,0.35)] text-[var(--c-gold)]"
          style={{
            transform: tilt.hovered && !reducedMotion ? 'rotate(6deg)' : 'rotate(0deg)',
            transition: tilt.hovered ? 'transform 200ms ease-out' : 'transform 400ms ease-out',
          }}
        >
          <MotifIcon name={item.icon} className="w-7 h-7" />
        </div>

        <h3 className="text-card-h3 text-[var(--c-gold)] mb-2.5">{item.title}</h3>
        <p className="text-base text-[var(--c-ivory-dim)] leading-relaxed m-0">
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
              <ul className="mt-4 pt-4 border-t border-[rgba(212,175,55,0.28)] space-y-2 text-sm text-[var(--c-ivory)] list-none p-0 m-0">
                {item.details.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--c-saffron)] shrink-0"
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
          className="inline-flex items-center gap-2 min-h-[44px] px-3 -ml-3 rounded-lg text-sm font-medium text-[var(--c-saffron)] hover:text-[var(--c-ivory)] hover:bg-[rgba(244,162,27,0.12)] transition-colors duration-200 cursor-pointer"
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
