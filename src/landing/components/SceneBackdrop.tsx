import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ResponsiveLayerImage } from '../content/scenes';

gsap.registerPlugin(ScrollTrigger);

export interface SceneBackdropProps {
  gradientClass: string;
  sceneId?: string;
  layerZIndex?: number;
  blended?: boolean;
  focusXPercent?: number;
  layers?: {
    sky?: ResponsiveLayerImage;
    land?: ResponsiveLayerImage;
    fore?: ResponsiveLayerImage;
  };
  parallax?: {
    sky: number;
    land: number;
    fore: number;
  };
  landShiftY?: number;
  landHeightPercent?: number;
  skyShiftY?: number;
  sunSink?: boolean;
  horizonGlow?: boolean;
  eager?: boolean;
  reducedMotion?: boolean;
  showHorizonDebug?: boolean;
  children?: ReactNode;
}

export function SceneBackdrop({
  gradientClass,
  sceneId = 'scene',
  layerZIndex = 1,
  blended = false,
  focusXPercent = 50,
  layers,
  parallax = { sky: 0.015, land: 0.035, fore: 0.04 },
  landShiftY = 0,
  landHeightPercent = 100,
  skyShiftY = 0,
  sunSink = false,
  horizonGlow = false,
  eager = false,
  reducedMotion = false,
  showHorizonDebug = false,
  children,
}: SceneBackdropProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const skyWrapRef = useRef<HTMLDivElement | null>(null);
  const starsRef = useRef<HTMLDivElement | null>(null);
  const landWrapRef = useRef<HTMLDivElement | null>(null);
  const foreWrapRef = useRef<HTMLDivElement | null>(null);

  const [shouldLoad, setShouldLoad] = useState(Boolean(eager));

  // Lazy-load non-hero scene layers ~1 viewport before entering screen
  useEffect(() => {
    if (eager) {
      setShouldLoad(true);
      return;
    }
    const el = rootRef.current;
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

  // Tiny ScrollTrigger parallax (<= 4% of box height total) + Scene 2 sun-sinking.
  // Land and props live together inside landWrapRef so they move identically on scroll.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !layers || !shouldLoad) return;

    const skyEl = skyWrapRef.current;
    const starsEl = starsRef.current;
    const landEl = landWrapRef.current;
    const foreEl = foreWrapRef.current;

    if (reducedMotion) {
      if (skyEl) gsap.set(skyEl, { yPercent: sunSink ? 18 : 0 });
      if (starsEl) gsap.set(starsEl, { opacity: 0.55 });
      if (landEl) gsap.set(landEl, { yPercent: 0 });
      if (foreEl) gsap.set(foreEl, { yPercent: 0 });
      return;
    }

    const sectionEl = root.closest<HTMLElement>('[data-scene]') ?? root;
    const ctx = gsap.context(() => {
      if (skyEl) {
        if (sunSink) {
          // Scene 2: sun sits cleanly above sea line (-14%) on enter and sinks behind sea line (+18%) on exit
          gsap.fromTo(
            skyEl,
            { yPercent: -14 },
            {
              yPercent: 18,
              ease: 'none',
              scrollTrigger: {
                trigger: sectionEl,
                start: 'top 90%',
                end: 'bottom 20%',
                scrub: 0.6,
              },
            },
          );
          if (starsEl) {
            gsap.fromTo(
              starsEl,
              { opacity: 0.14 },
              {
                opacity: 0.85,
                ease: 'none',
                scrollTrigger: {
                  trigger: sectionEl,
                  start: 'top 90%',
                  end: 'bottom 20%',
                  scrub: 0.6,
                },
              },
            );
          }
        } else {
          const halfSky = Math.min(2, (parallax.sky * 100) / 2);
          if (halfSky > 0) {
            gsap.fromTo(
              skyEl,
              { yPercent: -halfSky },
              {
                yPercent: halfSky,
                ease: 'none',
                scrollTrigger: {
                  trigger: sectionEl,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 0.6,
                },
              },
            );
          }
        }
      }

      const halfLand = Math.min(2, (parallax.land * 100) / 2);
      if (landEl && halfLand > 0) {
        gsap.fromTo(
          landEl,
          { yPercent: -halfLand },
          {
            yPercent: halfLand,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionEl,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.6,
            },
          },
        );
      }

      const halfFore = Math.min(2, (parallax.fore * 100) / 2);
      if (foreEl && halfFore > 0) {
        gsap.fromTo(
          foreEl,
          { yPercent: halfFore },
          {
            yPercent: -halfFore,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionEl,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.6,
            },
          },
        );
      }
    }, root);

    return () => ctx.revert();
  }, [layers, parallax.fore, parallax.land, parallax.sky, reducedMotion, shouldLoad, sunSink]);

  const hasAnyLayer = Boolean(layers?.sky || layers?.land || layers?.fore);
  const artBoxStyle = { '--art-focus-x': String(focusXPercent) } as CSSProperties;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-scene-backdrop={sceneId}
      data-scene-canvas="true"
      style={{ zIndex: layerZIndex }}
      className={[
        'pointer-events-none absolute inset-0 overflow-hidden',
        gradientClass,
        blended ? 'v3-scene-blend-mask' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Full-section sky backdrop for non-sunSink scenes so tall desktop ratios stay seamless */}
      {hasAnyLayer && shouldLoad && layers?.sky && !sunSink && (
        <div
          ref={skyWrapRef}
          data-backdrop-layer="sky"
          className="pointer-events-none absolute inset-x-0 z-[1] will-change-transform"
          style={{
            top: `${skyShiftY - 4}%`,
            height: `${112 - Math.min(0, skyShiftY)}%`,
          }}
        >
          <img
            src={layers.sky.src}
            srcSet={layers.sky.srcSet}
            sizes={layers.sky.sizes}
            width={layers.sky.width}
            height={layers.sky.height}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding={eager ? 'sync' : 'async'}
            fetchPriority={eager ? 'high' : undefined}
            className="w-full h-full object-cover object-center"
          />
        </div>
      )}

      {/* Single shared 16:9 art box holding sky-synced features, horizon, land+props, and fore */}
      <div
        data-art-box={sceneId}
        style={artBoxStyle}
        className="v3-art-box pointer-events-none z-[2]"
      >
        {/* Scene 2 sun-sinking sky lives strictly inside the 16:9 art box so sun relates cleanly to 60% sea line */}
        {hasAnyLayer && shouldLoad && layers?.sky && sunSink && (
          <div
            ref={skyWrapRef}
            data-backdrop-layer="sky"
            className="pointer-events-none absolute inset-x-0 z-[1] will-change-transform"
            style={{
              top: '-26%',
              height: '152%',
            }}
          >
            <img
              src={layers.sky.src}
              srcSet={layers.sky.srcSet}
              sizes={layers.sky.sizes}
              width={layers.sky.width}
              height={layers.sky.height}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-center"
            />
          </div>
        )}

        {/* Scene 2 dusk stars brightening subtly as the sun sinks behind the sea */}
        {sunSink && (
          <div
            ref={starsRef}
            data-bridge-stars="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[48%] z-[2] opacity-20"
            style={{
              backgroundImage: [
                'radial-gradient(1.5px 1.5px at 16% 24%, rgba(255,246,227,0.95) 0%, transparent 100%)',
                'radial-gradient(1.5px 1.5px at 29% 16%, rgba(255,246,227,0.85) 0%, transparent 100%)',
                'radial-gradient(2px 2px at 41% 31%, rgba(255,209,102,0.9) 0%, transparent 100%)',
                'radial-gradient(1.5px 1.5px at 58% 19%, rgba(255,246,227,0.9) 0%, transparent 100%)',
                'radial-gradient(2px 2px at 73% 28%, rgba(255,209,102,0.85) 0%, transparent 100%)',
                'radial-gradient(1.5px 1.5px at 84% 18%, rgba(255,246,227,0.9) 0%, transparent 100%)',
                'radial-gradient(1px 1px at 66% 37%, rgba(255,246,227,0.75) 0%, transparent 100%)',
              ].join(','),
            }}
          />
        )}

        {/* Scene 3 warm gold-orange glow band above the 60% horizon, behind land */}
        {horizonGlow && (
          <div
            data-backdrop-layer="horizon-glow"
            className="pointer-events-none absolute inset-x-0 z-[2]"
            style={{
              top: '44%',
              height: '26%',
              background:
                'linear-gradient(180deg, rgba(244,162,27,0) 0%, rgba(244,162,27,0.38) 52%, rgba(255,122,26,0.46) 72%, rgba(255,122,26,0) 100%)',
            }}
          />
        )}

        {/* Land + Props move together inside ONE shared group so props stay locked to their ground */}
        {((hasAnyLayer && shouldLoad && layers?.land) || children) && (
          <div
            ref={landWrapRef}
            data-backdrop-layer="land-group"
            className="pointer-events-none absolute inset-0 z-[3] will-change-transform"
          >
            {hasAnyLayer && shouldLoad && layers?.land && (
              <div
                data-backdrop-layer="land"
                className="pointer-events-none absolute inset-x-0"
                style={{
                  top: `${landShiftY}%`,
                  height: `${landHeightPercent}%`,
                }}
              >
                <img
                  src={layers.land.src}
                  srcSet={layers.land.srcSet}
                  sizes={layers.land.sizes}
                  width={layers.land.width}
                  height={layers.land.height}
                  alt=""
                  loading={eager ? 'eager' : 'lazy'}
                  decoding={eager ? 'sync' : 'async'}
                  fetchPriority={eager ? 'high' : undefined}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            )}

            {/* SceneProps placed in % of this identical 16:9 art box */}
            {children}
          </div>
        )}

        {/* Foreground frame layer above props, clipped tightly inside this box */}
        {hasAnyLayer && shouldLoad && layers?.fore && (
          <div
            ref={foreWrapRef}
            data-backdrop-layer="fore"
            className="pointer-events-none absolute inset-x-0 top-0 h-[103%] z-[6] will-change-transform"
          >
            <img
              src={layers.fore.src}
              srcSet={layers.fore.srcSet}
              sizes={layers.fore.sizes}
              width={layers.fore.width}
              height={layers.fore.height}
              alt=""
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              className="w-full h-full object-cover object-bottom"
            />
          </div>
        )}

        {/* Horizon alignment debug guide line (dev mode + ?debug=horizon only) */}
        {showHorizonDebug && import.meta.env.DEV && (
          <div
            data-horizon-debug-line="true"
            className="pointer-events-none absolute inset-x-0 z-50 border-t-2 border-dashed border-[#FF2E93]"
            style={{ top: sceneId === 'dawn-lake' ? '45%' : '60%' }}
          >
            <span className="inline-block bg-[#FF2E93] text-white text-[11px] font-mono px-1.5 py-0.5">
              {sceneId} {sceneId === 'dawn-lake' ? '45%' : '60%'} horizon
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
