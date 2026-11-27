import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COPY } from '../content/copy';
import { Button } from '../components/Button';
import { HeroFallback2D } from '../components/HeroFallback2D';
import {
  ArcherSvg,
  ChariotSvg,
  HeroArrowSvg,
  HeroSilhouettesSvg,
} from '../components/HeroSceneArt';
import { ChakraSvg } from '../components/MotifIcons';
import { scrollToTarget } from '../motion/lenis';
import { useReducedMotion } from '../motion/useReducedMotion';
import { useScrollProgress } from '../motion/useScrollProgress';
import { shouldEnableHero3D } from '../three/capabilities';

gsap.registerPlugin(ScrollTrigger);

const LazyHeroScene = lazy(() => import('../three/HeroScene'));
const ARROW_WIDTH = 74;
const ARROW_HEIGHT = 16;

interface ErrorBoundaryState {
  hasError: boolean;
}

class HeroSceneErrorBoundary extends Component<
  { children: ReactNode; onError?: () => void },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function useHeroViewportTier() {
  const getTier = () => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isDesktop: false };
    }
    const width = window.innerWidth;
    const finePointer =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: fine)').matches
        : true;
    return {
      isMobile: width < 640,
      isDesktop: width >= 1024 && finePointer,
    };
  };

  const [tier, setTier] = useState(getTier);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setTier(getTier());
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return tier;
}

interface FlightGeometry {
  startX: number;
  startY: number;
  pullX: number;
  pullY: number;
  endX: number;
  endY: number;
  angleDeg: number;
}

function measureFlightGeometry(
  sectionEl: HTMLElement,
  handEl: HTMLElement,
  ctaEl: HTMLElement,
): FlightGeometry {
  const heroRect = sectionEl.getBoundingClientRect();
  const handRect = handEl.getBoundingClientRect();
  const ctaRect = ctaEl.getBoundingClientRect();

  const sx = handRect.left + handRect.width * 0.5 - heroRect.left;
  const sy = handRect.top + handRect.height * 0.5 - heroRect.top;
  const ex = ctaRect.left - heroRect.left;
  const ey = ctaRect.top + ctaRect.height * 0.5 - heroRect.top;

  const angleRad = Math.atan2(ey - sy, ex - sx);
  const angleDeg = (angleRad * 180) / Math.PI;
  const pullDist = 14;

  return {
    startX: sx - ARROW_WIDTH,
    startY: sy - ARROW_HEIGHT / 2,
    pullX: sx - Math.cos(angleRad) * pullDist - ARROW_WIDTH,
    pullY: sy - Math.sin(angleRad) * pullDist - ARROW_HEIGHT / 2,
    endX: ex - ARROW_WIDTH,
    endY: ey - ARROW_HEIGHT / 2,
    angleDeg,
  };
}

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const chariotUnitRef = useRef<HTMLDivElement | null>(null);
  const chariotWheelRef = useRef<SVGGElement | null>(null);
  const bowstringRef = useRef<SVGGElement | null>(null);
  const handAnchorRef = useRef<HTMLSpanElement | null>(null);
  const ctaButtonRef = useRef<HTMLButtonElement | null>(null);
  const ctaPulseRef = useRef<HTMLDivElement | null>(null);
  const flareRingRef = useRef<HTMLSpanElement | null>(null);
  const arrowRef = useRef<HTMLDivElement | null>(null);
  const shotTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const hasAutoPlayedRef = useRef(false);

  const reducedMotion = useReducedMotion();
  const { isMobile, isDesktop } = useHeroViewportTier();
  const scrollProgress = useScrollProgress(sectionRef, {
    start: 'top top',
    end: 'bottom top',
    scrub: 0.75,
  });

  const [mount3D, setMount3D] = useState(false);
  const [is3DReady, setIs3DReady] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [shotState, setShotState] = useState<'idle' | 'drawing' | 'flying' | 'landed'>(
    reducedMotion ? 'landed' : 'idle',
  );
  const [replayCount, setReplayCount] = useState(0);

  // Defer 3D chunk fetch & WebGL setup strictly until after first paint commits
  useEffect(() => {
    if (!shouldEnableHero3D()) {
      return;
    }

    let cancelled = false;
    let observer: PerformanceObserver | null = null;
    let fallbackTimer: number | undefined;

    const triggerMount = () => {
      if (cancelled) return;
      cancelled = true;
      observer?.disconnect();
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
      }
      setMount3D(true);
    };

    if (typeof performance !== 'undefined' && performance.getEntriesByType('paint').length > 0) {
      fallbackTimer = window.setTimeout(triggerMount, 0);
    } else if (
      typeof PerformanceObserver !== 'undefined' &&
      PerformanceObserver.supportedEntryTypes?.includes('paint')
    ) {
      observer = new PerformanceObserver((list) => {
        if (list.getEntries().length > 0) {
          window.setTimeout(triggerMount, 0);
        }
      });
      observer.observe({ type: 'paint', buffered: true });
      fallbackTimer = window.setTimeout(triggerMount, 2000);
    } else {
      const rafId = requestAnimationFrame(() => {
        fallbackTimer = window.setTimeout(triggerMount, 80);
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(rafId);
        if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      };
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
      }
    };
  }, []);

  // Pause 3D render loop when hero is scrolled out of view (Section 5.4)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsHeroVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const positionArrowAtRest = useCallback(() => {
    const section = sectionRef.current;
    const hand = handAnchorRef.current;
    const cta = ctaButtonRef.current;
    const arrow = arrowRef.current;
    if (!section || !hand || !cta || !arrow) return;

    const geom = measureFlightGeometry(section, hand, cta);
    gsap.set(arrow, {
      x: geom.endX,
      y: geom.endY,
      rotation: geom.angleDeg,
      opacity: 1,
      transformOrigin: '100% 50%',
    });
  }, []);

  const playShotSequence = useCallback(() => {
    const section = sectionRef.current;
    const hand = handAnchorRef.current;
    const cta = ctaButtonRef.current;
    const arrow = arrowRef.current;
    const bowstring = bowstringRef.current;
    const pulseWrap = ctaPulseRef.current;
    const flareRing = flareRingRef.current;

    if (!section || !hand || !cta || !arrow || !bowstring) return;

    if (reducedMotion) {
      positionArrowAtRest();
      gsap.set(bowstring, { scaleX: 6, svgOrigin: '80 42' });
      if (flareRing) {
        gsap.set(flareRing, { opacity: 0.75, scale: 1 });
        window.setTimeout(() => {
          if (flareRingRef.current) {
            gsap.set(flareRingRef.current, { opacity: 0 });
          }
        }, 120);
      }
      setShotState('landed');
      return;
    }

    shotTimelineRef.current?.kill();

    const geom = measureFlightGeometry(section, hand, cta);

    gsap.set(bowstring, { scaleX: 1, svgOrigin: '80 42' });
    gsap.set(arrow, {
      x: geom.startX,
      y: geom.startY,
      rotation: geom.angleDeg,
      opacity: 0,
      transformOrigin: '100% 50%',
    });
    if (flareRing) {
      gsap.set(flareRing, { scale: 1, opacity: 0 });
    }
    if (pulseWrap) {
      gsap.set(pulseWrap, { scale: 1 });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setShotState('landed');
      },
    });

    tl.call(() => setShotState('drawing'))
      .to(bowstring, {
        scaleX: 6,
        duration: 0.6,
        ease: 'sine.inOut',
      })
      .to(
        arrow,
        {
          x: geom.pullX,
          y: geom.pullY,
          opacity: 1,
          duration: 0.6,
          ease: 'sine.inOut',
        },
        '<',
      )
      .call(() => setShotState('flying'))
      .to(bowstring, {
        scaleX: 1,
        duration: 0.14,
        ease: 'power2.out',
      })
      .to(
        arrow,
        {
          x: geom.endX,
          y: geom.endY,
          rotation: geom.angleDeg,
          duration: 0.9,
          ease: 'power2.out',
        },
        '<',
      );

    if (flareRing) {
      tl.fromTo(
        flareRing,
        { scale: 1, opacity: 0.9 },
        { scale: 1.16, opacity: 0, duration: 0.4, ease: 'power2.out' },
      );
    }

    if (pulseWrap) {
      tl.to(
        pulseWrap,
        {
          scale: 1.045,
          duration: 0.2,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
        },
        flareRing ? '<' : undefined,
      );
    }

    shotTimelineRef.current = tl;
  }, [positionArrowAtRest, reducedMotion]);

  // I-1: Play once after first paint (or snap immediately to final frame in reduced motion)
  useEffect(() => {
    if (reducedMotion) {
      if (bowstringRef.current) {
        gsap.set(bowstringRef.current, { scaleX: 6, svgOrigin: '80 42' });
      }
      positionArrowAtRest();
      setShotState('landed');
      return;
    }

    if (hasAutoPlayedRef.current) {
      return;
    }

    let rafId = 0;
    let timerId = 0;
    const ctx = gsap.context(() => {
      rafId = requestAnimationFrame(() => {
        timerId = window.setTimeout(() => {
          hasAutoPlayedRef.current = true;
          playShotSequence();
        }, 60);
      });
    }, sectionRef);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      shotTimelineRef.current?.kill();
      ctx.revert();
    };
  }, [playShotSequence, positionArrowAtRest, reducedMotion]);

  // Recalculate target coordinates on resize and orientation change
  useEffect(() => {
    const onViewportChange = () => {
      if (reducedMotion || shotState === 'landed') {
        positionArrowAtRest();
      }
    };
    window.addEventListener('resize', onViewportChange, { passive: true });
    window.addEventListener('orientationchange', onViewportChange);
    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('orientationchange', onViewportChange);
    };
  }, [positionArrowAtRest, reducedMotion, shotState]);

  // I-2: Chariot drifts left-to-right (~30% viewport) & wheel rotates tied to scroll distance
  useEffect(() => {
    const section = sectionRef.current;
    const unit = chariotUnitRef.current;
    const wheel = chariotWheelRef.current;
    if (!section || !unit || !wheel) return;

    if (reducedMotion) {
      gsap.set(unit, { x: 0 });
      gsap.set(wheel, { rotation: 0, svgOrigin: '64 86' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to(unit, {
        x: () => Math.round(window.innerWidth * 0.3),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      gsap.to(wheel, {
        rotation: 540,
        svgOrigin: '64 86',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  const handleReplayShot = () => {
    setReplayCount((c) => c + 1);
    playShotSequence();
  };

  const handleSceneReady = useCallback(() => {
    setIs3DReady(true);
  }, []);

  const handleSceneError = useCallback(() => {
    setMount3D(false);
    setIs3DReady(false);
  }, []);

  const clampedProgress = reducedMotion ? 0 : Math.min(Math.max(scrollProgress, 0), 1);
  const contentOpacity = reducedMotion ? 1 : Math.max(0, 1 - clampedProgress * 1.35);
  const contentTranslateY = reducedMotion ? 0 : -clampedProgress * 56;
  const silhouetteParallaxVh = reducedMotion ? 0 : -clampedProgress * 40;

  return (
    <section
      id="hero"
      ref={sectionRef}
      data-section-mode="dark"
      aria-labelledby="hero-heading"
      className="relative z-0 min-h-[100svh] flex flex-col items-center justify-center px-5 pt-24 pb-36 sm:pb-44 overflow-hidden bg-[linear-gradient(180deg,var(--c-night-0)_0%,var(--c-night-1)_70%,var(--c-forest)_100%)] border-b border-[rgba(212,175,55,0.4)]"
    >
      {/* Layer 1 & 2: Sky gradient + Phase 4 ambient 3D layer at 60% opacity (omitted if WebGL disabled) */}
      <div
        aria-hidden="true"
        data-hero-stage="true"
        className={[
          'pointer-events-none fixed inset-0 z-0 transition-opacity duration-200',
          isHeroVisible ? 'opacity-100 visible' : 'opacity-0 invisible',
        ].join(' ')}
      >
        <div className="absolute inset-0 opacity-60">
          <HeroFallback2D
            scrollProgress={clampedProgress}
            reducedMotion={reducedMotion}
            is3DReady={is3DReady}
          />

          {mount3D && (
            <div
              data-hero-layer="3d-canvas"
              data-hero-3d-ready={is3DReady ? 'true' : 'false'}
              className={[
                'pointer-events-none absolute inset-0 transition-opacity duration-500',
                is3DReady ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
            >
              <HeroSceneErrorBoundary onError={handleSceneError}>
                <Suspense fallback={null}>
                  <LazyHeroScene
                    scrollProgress={clampedProgress}
                    reducedMotion={reducedMotion}
                    isMobile={isMobile}
                    isDesktop={isDesktop}
                    isVisible={isHeroVisible}
                    onReady={handleSceneReady}
                  />
                </Suspense>
              </HeroSceneErrorBoundary>
            </div>
          )}
        </div>
      </div>

      {/* Layer 3: Gopuram & banyan silhouettes (0.4x scroll parallax) */}
      <div
        aria-hidden="true"
        data-hero-layer="silhouettes"
        className="pointer-events-none absolute inset-x-0 bottom-7 sm:bottom-9 z-[2] will-change-transform"
        style={{
          transform: `translate3d(0, ${silhouetteParallaxVh}vh, 0)`,
        }}
      >
        <HeroSilhouettesSvg className="w-full h-[140px] sm:h-[200px] md:h-[240px]" />
      </div>

      {/* Layer 4: Terracotta road strip */}
      <div
        aria-hidden="true"
        data-hero-layer="road"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 sm:h-11 z-[3] bg-[linear-gradient(180deg,rgba(181,101,43,0.42)_0%,rgba(124,66,26,0.92)_100%)] border-t border-[rgba(212,175,55,0.45)]"
      />

      {/* Layers 5 & 6: Chariot (drifts on scroll I-2) + standing Archer replay button */}
      <div
        ref={chariotUnitRef}
        data-hero-layer="chariot-unit"
        className="absolute left-2 sm:left-8 lg:left-[6%] bottom-3 sm:bottom-5 z-[5] will-change-transform"
      >
        <ChariotSvg
          wheelRef={chariotWheelRef}
          className="w-[164px] sm:w-[228px] md:w-[260px] h-auto pointer-events-none"
        />

        <button
          type="button"
          onClick={handleReplayShot}
          aria-label={COPY.hero.replayShotLabel}
          data-hero-layer="archer"
          data-shot-state={shotState}
          data-replay-count={replayCount}
          className="absolute left-[11%] bottom-[34%] w-[64px] h-[64px] sm:w-[88px] sm:h-[88px] md:w-[100px] md:h-[100px] min-w-[44px] min-h-[44px] rounded-xl bg-transparent p-0 cursor-pointer transition-transform duration-150 hover:scale-[1.03]"
        >
          <ArcherSvg
            bowstringRef={bowstringRef}
            drawn={reducedMotion}
            className="w-full h-full"
          />
          <span
            ref={handAnchorRef}
            data-archer-hand="true"
            aria-hidden="true"
            className="pointer-events-none absolute left-[72%] top-[38%] w-1 h-1"
          />
        </button>
      </div>

      {/* Layer 8: Hero text & target CTA */}
      <div
        className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center rounded-3xl px-4 py-4"
        style={{
          opacity: contentOpacity,
          transform: `translate3d(0, ${contentTranslateY}px, 0)`,
          background:
            'radial-gradient(ellipse at center, rgba(11,16,38,0.42) 0%, rgba(11,16,38,0) 74%)',
        }}
      >
        <div className="flex flex-col items-center">
          <h1 id="hero-heading" className="text-hero-title font-bold mb-5">
            {COPY.hero.title}
          </h1>

          <p className="font-[var(--font-landing-display)] text-2xl sm:text-3xl md:text-4xl text-[var(--c-ivory)] tracking-wide mb-3 max-w-2xl">
            {COPY.hero.tagline}
          </p>

          <p className="text-body-copy text-[var(--c-ivory-dim)] mb-9 max-w-xl">
            {COPY.hero.subline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div ref={ctaPulseRef} className="relative inline-flex">
              <span
                ref={flareRingRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[var(--c-saffron)] opacity-0"
              />
              <Button
                ref={ctaButtonRef}
                variant="primary"
                onClick={() => scrollToTarget('#login-gate')}
              >
                {COPY.hero.primaryCta}
              </Button>
            </div>
            <a
              href="#question"
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget('#question');
              }}
              className="min-h-[44px] px-4 inline-flex items-center justify-center rounded-xl text-base font-medium text-[var(--c-gold)] hover:text-[var(--c-ivory)] underline underline-offset-4 decoration-[rgba(212,175,55,0.5)] transition-colors"
            >
              {COPY.hero.secondaryCta}
            </a>
          </div>
        </div>
      </div>

      {/* Layer 7: Arrow sits above the text layer (z-20) and below the navbar (z-50) */}
      <div
        ref={arrowRef}
        aria-hidden="true"
        data-hero-layer="arrow"
        className="pointer-events-none absolute left-0 top-0 z-20 w-[74px] h-[16px] opacity-0"
        style={{ transformOrigin: '100% 50%' }}
      >
        <HeroArrowSvg className="w-full h-full drop-shadow-[0_0_8px_rgba(244,162,27,0.65)]" />
      </div>

      {/* Layer 9: Scroll cue */}
      <a
        href="#question"
        aria-label={COPY.hero.scrollCueLabel}
        onClick={(e) => {
          e.preventDefault();
          scrollToTarget('#question');
        }}
        style={{
          opacity: contentOpacity,
          transform: `translate3d(0, ${contentTranslateY * 0.5}px, 0)`,
        }}
        className="relative z-10 mt-10 sm:mt-14 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full text-[var(--c-gold)] hover:text-[var(--c-saffron)]"
      >
        <ChakraSvg className="w-8 h-8 animate-chakra-pulse" />
      </a>
    </section>
  );
}
