import { Fragment, useEffect, useRef, useState } from 'react';
import type { SceneArtworkConfig } from '../content/scenes';

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

  const isLotusBloomed = arrived || reducedMotion;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      data-scene-props={config.id}
      className="pointer-events-none absolute inset-0 z-[4]"
    >
      {shouldLoad &&
        config.props.map((prop) => {
          const isRama = prop.id === 'rama-ready';
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

              <img
                data-prop={prop.id}
                data-rama-pose={isRama ? ramaPose : undefined}
                src={resolvedSrc}
                width={prop.width}
                height={prop.height}
                alt=""
                loading="eager"
                decoding={prop.eager || eager ? 'sync' : 'async'}
                fetchPriority={prop.eager || eager ? 'high' : undefined}
                className={[
                  'pointer-events-none absolute select-none',
                  isLotus ? 'transition-opacity duration-700 ease-out' : '',
                  isLotus && isLotusBloomed ? 'opacity-0' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={propStyle}
              />

              {/* Dawn Lake opened lotus crossfade in identical 641x1000 union box */}
              {isLotus && prop.preloadExtraSrc && (
                <img
                  data-prop="lotus-open"
                  data-lotus-bloomed={isLotusBloomed ? 'true' : 'false'}
                  src={prop.preloadExtraSrc}
                  width={prop.width}
                  height={prop.height}
                  alt=""
                  loading="eager"
                  decoding="async"
                  className={[
                    'pointer-events-none absolute select-none transition-opacity duration-700 ease-out',
                    isLotusBloomed ? 'opacity-100' : 'opacity-0',
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
      { rootMargin: '120% 0px' },
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
      className="pointer-events-none relative w-full h-full flex items-end justify-center overflow-visible"
    >
      {shouldLoad && (
        <div
          data-gate-zoom-stage="true"
          className="pointer-events-none absolute inset-0 flex items-end justify-center overflow-visible"
        >
          {/* Left stretched wall extension (slices outer ~12px clean flat wall course) */}
          <div
            data-gate-wall-ext="true"
            className="pointer-events-none absolute left-0 right-1/2 bottom-0 h-full overflow-hidden"
          >
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
          <div
            data-gate-wall-ext="true"
            className="pointer-events-none absolute left-1/2 right-0 bottom-0 h-full overflow-hidden"
          >
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

          {/* Centered Gate artwork zooming smoothly into the doorway center (50% 65%) */}
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
          </div>
        </div>
      )}
    </div>
  );
}
