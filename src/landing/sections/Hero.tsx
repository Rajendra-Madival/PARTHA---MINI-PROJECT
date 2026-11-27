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
import { COPY } from '../content/copy';
import { Button } from '../components/Button';
import { HeroFallback2D } from '../components/HeroFallback2D';
import { ChakraSvg } from '../components/MotifIcons';
import { scrollToTarget } from '../motion/lenis';
import { useReducedMotion } from '../motion/useReducedMotion';
import { useScrollProgress } from '../motion/useScrollProgress';
import { shouldEnableHero3D } from '../three/capabilities';

const LazyHeroScene = lazy(() => import('../three/HeroScene'));

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

export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
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

  const handleSceneReady = useCallback(() => {
    setIs3DReady(true);
  }, []);

  const handleSceneError = useCallback(() => {
    setMount3D(false);
    setIs3DReady(false);
  }, []);

  // Title fades and shifts upward as scroll progress runs 0 -> 1 (Section 6.1)
  const clampedProgress = reducedMotion ? 0 : Math.min(Math.max(scrollProgress, 0), 1);
  const contentOpacity = reducedMotion ? 1 : Math.max(0, 1 - clampedProgress * 1.35);
  const contentTranslateY = reducedMotion ? 0 : -clampedProgress * 56;

  return (
    <section
      id="hero"
      ref={sectionRef}
      aria-labelledby="hero-heading"
      className="relative z-0 min-h-[100svh] flex flex-col items-center justify-center px-5 pt-24 pb-14 overflow-hidden bg-[var(--c-night-0)] border-b border-[rgba(212,175,55,0.4)]"
    >
      {/* Fixed visual stage behind content (Section 6.1) */}
      <div
        aria-hidden="true"
        data-hero-stage="true"
        className={[
          'pointer-events-none fixed inset-0 z-0 transition-opacity duration-200',
          isHeroVisible ? 'opacity-100 visible' : 'opacity-0 invisible',
        ].join(' ')}
      >
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

      {/* Subtle dark radial vignette behind hero copy for guaranteed WCAG contrast */}
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

          <p className="font-[var(--font-display)] text-xl sm:text-2xl md:text-3xl text-[var(--c-ivory)] tracking-wide mb-3 max-w-2xl">
            {COPY.hero.tagline}
          </p>

          <p className="text-body-copy text-[var(--c-ivory-dim)] mb-9 max-w-xl">
            {COPY.hero.subline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="primary" onClick={() => scrollToTarget('#login-gate')}>
              {COPY.hero.primaryCta}
            </Button>
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
        className="relative z-10 mt-12 sm:mt-16 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full text-[var(--c-gold)] hover:text-[var(--c-saffron)]"
      >
        <ChakraSvg className="w-8 h-8 animate-chakra-pulse" />
      </a>
    </section>
  );
}
