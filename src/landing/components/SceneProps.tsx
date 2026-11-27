import { Fragment, useEffect, useRef, useState } from 'react';
import type { SceneArtworkConfig } from '../content/scenes';

export const KURUKSHETRA_TORCHES = [
  { label: 'Internships', xPercent: 9, yPercent: 52 },
  { label: 'Jobs', xPercent: 17.5, yPercent: 48 },
  { label: 'Projects', xPercent: 26, yPercent: 52 },
] as const;

export function SceneProps({
  config,
  eager = false,
  arrived = false,
  reducedMotion = false,
  ramaPose = 'ready',
}: {
  config: SceneArtworkConfig;
  eager?: boolean;
  arrived?: boolean;
  reducedMotion?: boolean;
  ramaPose?: 'ready' | 'draw';
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(Boolean(eager));

  useEffect(() => {
    if (eager) {
      setShouldLoad(true);
      return;
    }
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  // Lazy preload secondary swap assets (lotus-open) when scene comes near viewport
  useEffect(() => {
    if (!shouldLoad) return;
    for (const prop of config.props) {
      if (prop.preloadExtraSrc) {
        const img = new Image();
        img.decoding = 'async';
        img.src = prop.preloadExtraSrc;
      }
    }
  }, [config.props, shouldLoad]);

  if (config.gate) {
    return <GateArtworkStage config={config} eager={eager} reducedMotion={reducedMotion} />;
  }

  const isSceneReady = arrived || reducedMotion;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      data-scene-props={config.id}
      className="pointer-events-none absolute inset-0 z-[4]"
    >
      {/* Kurukshetra: three lit torches on the left (desktop 16:9 art box; mobile renders in HUD stack) */}
      {config.id === 'kurukshetra' && shouldLoad && (
        <div
          data-kurukshetra-torches="desktop"
          className="max-md:hidden pointer-events-none absolute inset-0"
        >
          {KURUKSHETRA_TORCHES.map((torch) => (
            <div
              key={torch.label}
              style={{ left: `${torch.xPercent}%`, top: `${torch.yPercent}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
            >
              {/* Torch flame + warm radial glow */}
              <div className="relative flex flex-col items-center">
                <div
                  className={[
                    'w-6 h-8 rounded-full blur-[5px] transition-opacity duration-700',
                    isSceneReady ? 'opacity-90' : 'opacity-45',
                  ].join(' ')}
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255,246,227,0.95) 0%, rgba(244,162,27,0.85) 45%, rgba(255,122,26,0) 78%)',
                  }}
                />
                <div
                  className="-mt-6 w-2.5 h-5 rounded-full bg-gradient-to-t from-[#FF7A1A] via-[#F4A21B] to-[#FFF6E3] shadow-[0_0_12px_rgba(244,162,27,0.9)]"
                />
                <div className="w-1.5 h-5 rounded-b bg-gradient-to-b from-[#6B3E1E] to-[#2B1709] border border-[rgba(212,175,55,0.45)]" />
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[rgba(11,16,38,0.84)] border border-[rgba(212,175,55,0.45)] text-[11px] font-semibold tracking-wide text-[#FFF6E3] shadow-sm whitespace-nowrap">
                {torch.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {shouldLoad &&
        config.props.map((prop) => {
          const isRama = prop.id === 'rama-ready';
          const isSage = prop.id === 'sage';
          const isDiya = prop.id === 'diya';
          const isConch = prop.id === 'conch';
          const isChariot = prop.id === 'chariot';
          const isLotus = prop.id === 'lotus-bud';

          const resolvedSrc =
            isRama && ramaPose === 'draw' ? '/landing/art/rama-draw.webp' : prop.src;

          const propStyle = {
            left: `${prop.xPercent}%`,
            top: `${prop.yPercent}%`,
            transform: 'translate(-50%, -100%)',
            width: prop.widthPercent !== undefined ? `${prop.widthPercent}%` : 'auto',
            height: prop.heightPercent !== undefined ? `${prop.heightPercent}%` : 'auto',
            aspectRatio: `${prop.width} / ${prop.height}`,
          };

          return (
            <Fragment key={prop.id}>
              {prop.waterBase && (
                <>
                  {/* Soft elliptical water shadow under lotus stem base */}
                  <div
                    aria-hidden="true"
                    data-water-shadow={prop.id}
                    className="pointer-events-none absolute rounded-full blur-[2px]"
                    style={{
                      left: `${prop.xPercent}%`,
                      top: `${prop.yPercent}%`,
                      width: '8%',
                      height: '1.8%',
                      transform: 'translate(-50%, -50%)',
                      background:
                        'radial-gradient(ellipse at center, rgba(20,56,42,0.34) 0%, rgba(20,56,42,0) 75%)',
                    }}
                  />
                  {/* Soft inner water ripple ellipse where stem meets lake */}
                  <div
                    aria-hidden="true"
                    data-water-ripple={prop.id}
                    className="pointer-events-none absolute rounded-full border border-[rgba(255,246,227,0.48)]"
                    style={{
                      left: `${prop.xPercent}%`,
                      top: `${prop.yPercent}%`,
                      width: '10%',
                      height: '2.2%',
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 8px rgba(255,246,227,0.28)',
                    }}
                  />
                  {/* Outer faint water ripple ring */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute rounded-full border border-[rgba(255,246,227,0.26)]"
                    style={{
                      left: `${prop.xPercent}%`,
                      top: `${prop.yPercent}%`,
                      width: '15%',
                      height: '3.2%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </>
              )}

              {/* Ashram diya warm self-lighting flame aura */}
              {isDiya && (
                <div
                  aria-hidden="true"
                  data-diya-flame="ashram"
                  data-lit={isSceneReady ? 'true' : 'false'}
                  className={[
                    'pointer-events-none absolute rounded-full transition-all duration-700',
                    isSceneReady ? 'opacity-100 scale-100' : 'opacity-20 scale-50',
                    isSceneReady && !reducedMotion ? 'v3-diya-flame' : '',
                  ].join(' ')}
                  style={{
                    left: `${prop.xPercent}%`,
                    top: `${prop.yPercent - 2.1}%`,
                    width: '4.5%',
                    aspectRatio: '1 / 1',
                    transform: 'translate(-50%, -100%)',
                    background:
                      'radial-gradient(circle, rgba(255,246,227,0.98) 0%, rgba(244,162,27,0.85) 38%, rgba(255,122,26,0) 76%)',
                    filter: 'blur(2px)',
                  }}
                />
              )}

              {/* Dawn Lake floating upvote scrolls rising from the water on arrival */}
              {isLotus && arrived && !reducedMotion && (
                <div data-dawn-scrolls="true" className="pointer-events-none absolute inset-0">
                  {[
                    { left: '41%', top: '72%', delay: '0s' },
                    { left: '54%', top: '70%', delay: '0.9s' },
                    { left: '46%', top: '67%', delay: '1.8s' },
                  ].map((s, idx) => (
                    <div
                      key={idx}
                      style={{ left: s.left, top: s.top, animationDelay: s.delay }}
                      className="v3-scroll-float pointer-events-none absolute -translate-x-1/2 px-2 py-1 rounded-md border border-[rgba(212,175,55,0.65)] bg-[rgba(255,246,227,0.92)] shadow-[0_0_14px_rgba(244,162,27,0.55)] flex items-center gap-1"
                    >
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--c-saffron)]" />
                      <span className="block w-4 h-0.5 rounded bg-[var(--c-bronze)] opacity-75" />
                    </div>
                  ))}
                </div>
              )}

              {/* Main prop image (for lotus, crossfades smoothly into lotus-open on arrival) */}
              <img
                data-prop={prop.id}
                data-rama-pose={isRama ? ramaPose : undefined}
                data-conch-pulsed={isConch ? (isSceneReady ? 'true' : 'false') : undefined}
                src={resolvedSrc}
                width={prop.width}
                height={prop.height}
                alt=""
                loading="eager"
                decoding={prop.eager || eager ? 'sync' : 'async'}
                fetchPriority={prop.eager || eager ? 'high' : undefined}
                className={[
                  'pointer-events-none absolute select-none transition-all duration-700 ease-out',
                  isSage && !isSceneReady ? 'opacity-0 translate-y-3' : '',
                  isSage && isSceneReady ? 'opacity-100 translate-y-0' : '',
                  isChariot && !isSceneReady ? 'opacity-0' : '',
                  isChariot && isSceneReady ? 'opacity-100 delay-200' : '',
                  isChariot && !reducedMotion ? 'v3-chariot-sway' : '',
                  isConch && arrived && !reducedMotion ? 'v3-conch-pulse' : '',
                  isLotus && isSceneReady ? 'opacity-0' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={propStyle}
              />

              {/* Dawn Lake opened lotus crossfade in identical 641x1000 union box */}
              {isLotus && prop.preloadExtraSrc && (
                <img
                  data-prop="lotus-open"
                  data-lotus-bloomed={isSceneReady ? 'true' : 'false'}
                  src={prop.preloadExtraSrc}
                  width={prop.width}
                  height={prop.height}
                  alt=""
                  loading="eager"
                  decoding="async"
                  className={[
                    'pointer-events-none absolute select-none transition-opacity duration-700 ease-out',
                    isSceneReady ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                  style={propStyle}
                />
              )}
            </Fragment>
          );
        })}
    </div>
  );
}

/** Dedicated Scene 5 Gate renderer fitting height cleanly with stretched left/right wall extensions */
export function GateArtworkStage({
  config,
  eager = false,
  reducedMotion = false,
}: {
  config: SceneArtworkConfig;
  eager?: boolean;
  reducedMotion?: boolean;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(Boolean(eager));

  useEffect(() => {
    if (eager) {
      setShouldLoad(true);
      return;
    }
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  if (!config.gate) return null;

  return (
    <div
      ref={stageRef}
      aria-hidden="true"
      data-scene-props={config.id}
      className="pointer-events-none relative w-full h-full flex items-end justify-center overflow-hidden"
    >
      {shouldLoad && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-hidden">
          {/* Left stretched wall extension (slices outer ~12px clean flat wall course) */}
          <div className="pointer-events-none absolute left-0 right-1/2 bottom-0 h-full overflow-hidden">
            <img
              src={config.gate.closed.src}
              width={config.gate.closed.width}
              height={config.gate.closed.height}
              alt=""
              loading="eager"
              decoding="async"
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                height: '100%',
                width: '15000%',
                maxWidth: 'none',
                objectFit: 'fill',
              }}
            />
          </div>

          {/* Right stretched wall extension (slices outer ~12px clean flat wall course) */}
          <div className="pointer-events-none absolute left-1/2 right-0 bottom-0 h-full overflow-hidden">
            <img
              src={config.gate.closed.src}
              width={config.gate.closed.width}
              height={config.gate.closed.height}
              alt=""
              loading="eager"
              decoding="async"
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                height: '100%',
                width: '15000%',
                maxWidth: 'none',
                objectFit: 'fill',
              }}
            />
          </div>

          {/* Centered Gate artwork: strictly height-constrained inside container on desktop, center 146vw span on mobile */}
          <div
            data-gate-wrapper="true"
            className="pointer-events-none relative shrink-0 h-full max-md:w-[146vw] max-md:h-auto max-md:max-h-full"
            style={{
              transformOrigin: '50% 65%',
              aspectRatio: `${config.gate.closed.width} / ${config.gate.closed.height}`,
            }}
          >
            <img
              data-gate-layer="closed"
              src={config.gate.closed.src}
              srcSet={config.gate.closed.srcSet}
              sizes={config.gate.closed.sizes}
              width={config.gate.closed.width}
              height={config.gate.closed.height}
              alt=""
              loading="eager"
              decoding="async"
              style={reducedMotion ? { opacity: 0 } : undefined}
              className="w-full h-full object-contain object-bottom"
            />
            <img
              data-gate-layer="open"
              src={config.gate.open.src}
              srcSet={config.gate.open.srcSet}
              sizes={config.gate.open.sizes}
              width={config.gate.open.width}
              height={config.gate.open.height}
              alt=""
              loading="eager"
              decoding="async"
              style={reducedMotion ? { opacity: 1 } : undefined}
              className="absolute inset-0 w-full h-full object-contain object-bottom opacity-0"
            />
            {/* Warm white-gold doorway radiance flash during Gate open & zoom */}
            <div
              data-gate-flash="true"
              className="pointer-events-none absolute inset-0 opacity-0"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 62%, rgba(255,254,250,0.95) 0%, rgba(255,232,163,0.75) 26%, rgba(244,162,27,0) 64%)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
