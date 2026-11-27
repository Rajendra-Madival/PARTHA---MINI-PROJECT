import { useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ResponsiveLayerImage } from '../content/scenes';

gsap.registerPlugin(ScrollTrigger);

export interface SceneBackdropProps {
  gradientClass: string;
  sceneId?: string;
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
  layers,
  parallax = { sky: 0.15, land: 0.35, fore: 0.7 },
  landShiftY = 0,
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

  // ScrollTrigger parallax via translate3d only + Scene 2 sun-sinking
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !layers || !shouldLoad) return;

    const skyEl = skyWrapRef.current;
    const landEl = landWrapRef.current;
    const foreEl = foreWrapRef.current;

    if (reducedMotion) {
      if (skyEl) gsap.set(skyEl, { yPercent: sunSink ? 4 : 0 });
      if (landEl) gsap.set(landEl, { yPercent: 0 });
      if (foreEl) gsap.set(foreEl, { yPercent: 0 });
      return;
    }

    const sectionEl = root.closest<HTMLElement>('[data-scene]') ?? root;
    const ctx = gsap.context(() => {
      const travelFactor = 22;

      if (skyEl) {
        if (sunSink) {
          // Starts lifted (-22%) so sun sits fully above sea horizon, sinks (+4%) behind horizon as visitor scrolls
          gsap.fromTo(
            skyEl,
            { yPercent: -22 },
            {
              yPercent: 4,
              ease: 'none',
              scrollTrigger: {
                trigger: sectionEl,
                start: 'top 90%',
                end: 'bottom 20%',
                scrub: 0.6,
              },
            },
          );
        } else {
          gsap.fromTo(
            skyEl,
            { yPercent: -parallax.sky * travelFactor * 0.5 },
            {
              yPercent: parallax.sky * travelFactor * 0.5,
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

      if (landEl) {
        gsap.fromTo(
          landEl,
          { yPercent: -parallax.land * travelFactor * 0.5 },
          {
            yPercent: parallax.land * travelFactor * 0.5,
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

      if (foreEl) {
        gsap.fromTo(
          foreEl,
          { yPercent: parallax.fore * travelFactor * 0.35 },
          {
            yPercent: -parallax.fore * travelFactor * 0.35,
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

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-scene-backdrop={sceneId}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${gradientClass}`}
    >
      {hasAnyLayer && shouldLoad && (
        <>
          {/* Sky layer (overscanned vertically so parallax & sun-sink never show gaps) */}
          {layers?.sky && (
            <div
              ref={skyWrapRef}
              data-backdrop-layer="sky"
              className="pointer-events-none absolute inset-x-0 will-change-transform"
              style={{
                top: sunSink ? '-22%' : `${skyShiftY - 8}%`,
                height: sunSink ? '148%' : '132%',
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

          {/* Scene 3 warm gold-orange glow strip just above 60% horizon, behind land */}
          {horizonGlow && (
            <div
              data-backdrop-layer="horizon-glow"
              className="pointer-events-none absolute inset-x-0"
              style={{
                top: '44%',
                height: '26%',
                background:
                  'linear-gradient(180deg, rgba(244,162,27,0) 0%, rgba(244,162,27,0.38) 52%, rgba(255,122,26,0.46) 72%, rgba(255,122,26,0) 100%)',
              }}
            />
          )}

          {/* Land layer normalized by landShiftY so horizon aligns at ~60% of scene height */}
          {layers?.land && (
            <div
              ref={landWrapRef}
              data-backdrop-layer="land"
              className="pointer-events-none absolute inset-x-0 will-change-transform"
              style={{
                top: `${landShiftY}%`,
                height: '116%',
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
                className={[
                  'w-full h-full object-cover',
                  sceneId === 'hero' ? 'object-[26%_center] sm:object-center' : 'object-center',
                ].join(' ')}
              />
            </div>
          )}
        </>
      )}

      {/* Props slot sits strictly between land and fore */}
      {children}

      {/* Foreground frame layer above props, pointer-events: none */}
      {hasAnyLayer && shouldLoad && layers?.fore && (
        <div
          ref={foreWrapRef}
          data-backdrop-layer="fore"
          className="pointer-events-none absolute inset-x-0 z-[8] will-change-transform"
          style={{
            top: '-8%',
            height: '122%',
          }}
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

      {/* Horizon alignment debug guide line at 60% (dev mode + ?debug=horizon only) */}
      {showHorizonDebug && import.meta.env.DEV && (
        <div
          data-horizon-debug-line="true"
          className="pointer-events-none absolute inset-x-0 z-50 border-t-2 border-dashed border-[#FF2E93]"
          style={{ top: '60%' }}
        >
          <span className="inline-block bg-[#FF2E93] text-white text-[11px] font-mono px-1.5 py-0.5">
            {sceneId} 60% horizon
          </span>
        </div>
      )}
    </div>
  );
}
