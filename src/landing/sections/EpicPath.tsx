import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COPY } from '../content/copy';
import { ChakraSvg, RathaSvg } from '../components/MotifIcons';
import { KalamkariVineTile, MandalaMedallionSvg } from '../components/Patterns';
import { useReducedMotion } from '../motion/useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

const ROAD_PATH_D = 'M 30 65 Q 200 18, 360 62 T 690 58 T 1010 60 L 1170 54';
const FALLBACK_PATH_LENGTH = 1170;

export function EpicPath() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const verticalRef = useRef<HTMLOListElement | null>(null);
  const roadPathRef = useRef<SVGPathElement | null>(null);
  const reducedMotion = useReducedMotion();

  const [usePinnedHorizontal, setUsePinnedHorizontal] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathLengthRef = useRef(FALLBACK_PATH_LENGTH);
  const [chariotPos, setChariotPos] = useState({ leftPct: 3, topPct: 56 });

  useEffect(() => {
    const checkMode = () => {
      const canPin =
        window.innerWidth >= 640 && window.innerHeight >= 700 && !reducedMotion;
      setUsePinnedHorizontal(canPin);
    };
    checkMode();
    window.addEventListener('resize', checkMode);
    return () => window.removeEventListener('resize', checkMode);
  }, [reducedMotion]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (reducedMotion) {
      setProgress(1);
      return;
    }

    if (usePinnedHorizontal) {
      const track = trackRef.current;
      if (!track) return;

      const pathElInit = roadPathRef.current;
      if (pathElInit && typeof pathElInit.getTotalLength === 'function') {
        const len = pathElInit.getTotalLength();
        if (len > 0) pathLengthRef.current = len;
      }

      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 2)}`,
          pin: true,
          scrub: 0.75,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            setProgress(p);
            const maxShift = Math.max(0, track.scrollWidth - track.parentElement!.clientWidth);
            gsap.set(track, { x: -maxShift * p });

            const pathEl = roadPathRef.current;
            const totalLen = pathLengthRef.current;
            if (pathEl && typeof pathEl.getPointAtLength === 'function') {
              const pt = pathEl.getPointAtLength(totalLen * p);
              setChariotPos({
                leftPct: Math.min(94, Math.max(2, (pt.x / 1200) * 100)),
                topPct: (pt.y / 110) * 100,
              });
            } else {
              setChariotPos({
                leftPct: Math.min(94, Math.max(2, 2 + p * 92)),
                topPct: 55,
              });
            }
          },
        });
      }, section);

      return () => ctx.revert();
    }

    const vertEl = verticalRef.current;
    if (!vertEl) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: vertEl,
        start: 'top 65%',
        end: 'bottom 55%',
        scrub: 0.7,
        onUpdate: (self) => {
          setProgress(self.progress);
        },
      });
    }, section);

    return () => ctx.revert();
  }, [usePinnedHorizontal, reducedMotion]);

  const pathLength = pathLengthRef.current;
  const dashOffset = pathLength * (1 - progress);

  return (
    <section
      id="epic-path"
      ref={sectionRef}
      data-section-mode="dark"
      aria-labelledby="epic-path-heading"
      className="relative bg-[var(--c-night-1)] py-24 sm:py-28 px-5 overflow-hidden border-b border-[rgba(212,175,55,0.4)]"
    >
      <KalamkariVineTile opacity={0.06} className="text-[var(--c-gold)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 text-[var(--c-gold)]"
      >
        <MandalaMedallionSvg className="w-[540px] max-w-[90vw] h-auto" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <h2 id="epic-path-heading" className="text-section-h2 text-[var(--c-ivory)]">
            {COPY.epicPath.heading}
          </h2>
        </div>

        {usePinnedHorizontal ? (
          <div className="relative overflow-hidden py-4">
            <div ref={trackRef} className="relative w-[1320px] pt-6 pb-4">
              {/* Winding road SVG that draws with stroke-dashoffset */}
              <div className="relative h-28 mb-6">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 1200 110"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  <path
                    d={ROAD_PATH_D}
                    fill="none"
                    stroke="#B5652B"
                    strokeOpacity="0.6"
                    strokeWidth="2.5"
                    strokeDasharray="6 8"
                  />
                  <path
                    ref={roadPathRef}
                    d={ROAD_PATH_D}
                    fill="none"
                    stroke="#F4A21B"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={pathLength}
                    strokeDashoffset={dashOffset}
                  />
                </svg>

                {/* Gold chariot traveling along the winding road */}
                <div
                  aria-hidden="true"
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-[var(--c-gold)] drop-shadow-[0_0_12px_rgba(244,162,27,0.5)]"
                  style={{
                    left: `${chariotPos.leftPct}%`,
                    top: `${chariotPos.topPct}%`,
                  }}
                >
                  <RathaSvg className="w-16 h-12" />
                </div>
              </div>

              {/* Four milestones crossing thresholds 0.20, 0.45, 0.70, 0.90 */}
              <ol className="grid grid-cols-4 gap-6 list-none m-0 p-0">
                {COPY.epicPath.milestones.map((milestone) => {
                  const active = progress >= milestone.threshold;
                  return (
                    <li
                      key={milestone.step}
                      className="rounded-2xl p-6 bg-[rgba(11,16,38,0.78)] border transition-all duration-300"
                      style={{
                        borderColor: active
                          ? 'rgba(244,162,27,0.75)'
                          : 'rgba(212,175,55,0.22)',
                        opacity: active ? 1 : 0.35,
                        transform: active ? 'translateY(0)' : 'translateY(14px)',
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="relative inline-flex items-center justify-center w-11 h-11 text-[var(--c-gold)] shrink-0">
                          <ChakraSvg className="w-11 h-11 opacity-75" />
                          <span className="absolute text-xs font-bold text-[var(--c-ivory)]">
                            {milestone.step}
                          </span>
                        </span>
                        <div>
                          <p className="text-meta uppercase tracking-wider text-[var(--c-gold)] m-0">
                            {COPY.epicPath.stepPrefix} {milestone.step}
                          </p>
                          <h3 className="text-card-h3 text-[var(--c-saffron)]">
                            {milestone.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-[var(--c-ivory-dim)] m-0">
                        {milestone.description}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        ) : (
          /* Vertical timeline for mobile, short viewports (<700px height), or reduced motion */
          <ol
            ref={verticalRef}
            className="relative max-w-2xl mx-auto list-none m-0 p-0 pl-12 space-y-8"
          >
            <div
              aria-hidden="true"
              className="absolute left-5 top-3 bottom-3 w-0.5 bg-[rgba(181,101,43,0.45)]"
            />
            <div
              aria-hidden="true"
              className="absolute left-5 top-3 w-0.5 bg-[var(--c-saffron)]"
              style={{
                height: `calc(${Math.min(100, progress * 100)}% - 12px)`,
              }}
            />
            <div
              aria-hidden="true"
              className="absolute -left-1 -translate-y-1/2 text-[var(--c-gold)]"
              style={{
                top: `${Math.max(4, Math.min(96, progress * 100))}%`,
              }}
            >
              <RathaSvg className="w-12 h-9" />
            </div>

            {COPY.epicPath.milestones.map((milestone) => {
              const active = reducedMotion || progress >= milestone.threshold - 0.14;
              return (
                <li
                  key={milestone.step}
                  className={[
                    'relative rounded-2xl p-6 bg-[rgba(11,16,38,0.75)] border',
                    reducedMotion ? 'transition-opacity duration-200' : 'transition-all duration-300',
                  ].join(' ')}
                  style={{
                    borderColor: active
                      ? 'rgba(244,162,27,0.7)'
                      : 'rgba(212,175,55,0.22)',
                    opacity: active ? 1 : 0.4,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-12 top-6 inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--c-night-0)] text-[var(--c-gold)]"
                  >
                    <ChakraSvg className="w-10 h-10 opacity-80" />
                    <span className="absolute text-xs font-bold text-[var(--c-ivory)]">
                      {milestone.step}
                    </span>
                  </span>

                  <p className="text-meta uppercase tracking-wider text-[var(--c-gold)] mb-1 m-0">
                    {COPY.epicPath.stepPrefix} {milestone.step}
                  </p>
                  <h3 className="text-card-h3 text-[var(--c-saffron)] mb-2">
                    {milestone.title}
                  </h3>
                  <p className="text-base text-[var(--c-ivory-dim)] m-0">
                    {milestone.description}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
