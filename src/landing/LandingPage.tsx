import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/noto-serif-devanagari/400.css';
import '@fontsource/noto-serif-devanagari/600.css';
import './styles/globals.css';
import { COPY, type StoryWaypointScene } from './content/copy';
import { HERO_IDLE_PRELOAD, SCENE_ARTWORKS } from './content/scenes';
import { initScrollEngine, scrollToTarget } from './motion/lenis';
import { useReducedMotion } from './motion/useReducedMotion';
import { ArrowsPathOverlay } from './components/ArrowsPathOverlay';
import { Navbar } from './components/Navbar';
import { SceneBackdrop } from './components/SceneBackdrop';
import { SceneProps } from './components/SceneProps';
import { StepCard } from './components/StepCard';

export interface LandingPageProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export function LandingPage({ onOpenAuth }: LandingPageProps = {}) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();

  const [litStops, setLitStops] = useState<boolean[]>(() =>
    COPY.waypoints.map(() => reducedMotion),
  );
  const [expandedStopId, setExpandedStopId] = useState<StoryWaypointScene['id'] | null>(null);

  const showHorizonDebug = useMemo(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === 'horizon';
  }, []);

  useEffect(() => {
    return initScrollEngine(reducedMotion);
  }, [reducedMotion]);

  // Preload rama-draw on idle after first paint for V3-3 readiness
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const preloadDraw = () => {
      const img = new Image();
      img.decoding = 'async';
      img.src = HERO_IDLE_PRELOAD;
    };
    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(preloadDraw, { timeout: 2000 });
      return () => win.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(preloadDraw, 600);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedStopId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleToggleCard = useCallback((id: StoryWaypointScene['id']) => {
    setExpandedStopId((prev) => (prev === id ? null : id));
  }, []);

  const handleWaypointSelect = useCallback((scene: StoryWaypointScene) => {
    scrollToTarget(`#scene-${scene.id}`, { duration: 1.4 });
    setExpandedStopId(scene.id);
  }, []);

  const handleHeroFollow = useCallback(() => {
    scrollToTarget(`#scene-${COPY.waypoints[0].id}`, { duration: 1.4 });
  }, []);

  const heroArt = SCENE_ARTWORKS.hero;

  return (
    <div className="partha-landing-v3">
      <a href="#main-content" className="skip-link">
        {COPY.brand.skipToContent}
      </a>

      <Navbar />

      <div ref={scrollContainerRef} className="relative w-full">
        <ArrowsPathOverlay
          containerRef={scrollContainerRef}
          reducedMotion={reducedMotion}
          onActiveStopsChange={setLitStops}
        />

        <main id="main-content" tabIndex={-1}>
          {/* Scene 0: Hero (light) - centered header in top ~35% above Rama */}
          <section
            id="scene-hero"
            data-scene="hero"
            data-section-mode={COPY.hero.mode}
            aria-labelledby="hero-heading"
            className="relative min-h-[120vh] flex flex-col justify-start px-5 pt-20 sm:pt-24 pb-20 overflow-hidden"
          >
            <SceneBackdrop
              sceneId="hero"
              gradientClass={COPY.hero.backdropClass}
              layers={heroArt.layers}
              parallax={heroArt.parallax}
              landShiftY={heroArt.landShiftY}
              skyShiftY={heroArt.skyShiftY}
              eager
              reducedMotion={reducedMotion}
              showHorizonDebug={showHorizonDebug}
            >
              <SceneProps config={heroArt} eager />
            </SceneBackdrop>

            {/* Arrow origin marker in upper-left on desktop; aligned on rail on mobile */}
            <div
              aria-hidden="true"
              data-arrow-origin="true"
              className="pointer-events-none absolute left-[28px] -translate-x-1/2 md:left-[12%] top-[18%] z-30 w-3 h-3 rounded-full bg-[var(--c-saffron)] ring-4 ring-[rgba(244,162,27,0.28)]"
            />

            <div className="relative z-30 max-w-3xl mx-auto text-center flex flex-col items-center pl-10 md:pl-0 rounded-3xl px-5 py-4 bg-[radial-gradient(ellipse_at_center,rgba(250,247,240,0.78)_0%,rgba(250,247,240,0.42)_55%,rgba(250,247,240,0)_85%)]">
              <h1 id="hero-heading" className="v3-hero-title font-bold mb-4">
                {COPY.hero.title}
              </h1>

              <p className="font-[var(--font-landing-display)] text-2xl sm:text-3xl md:text-4xl text-[var(--c-forest-900)] font-semibold mb-2.5 max-w-2xl">
                {COPY.hero.tagline}
              </p>

              <p className="text-base sm:text-lg text-[var(--c-ink)] font-medium mb-7 max-w-xl">
                {COPY.hero.subline}
              </p>

              <button
                type="button"
                onClick={handleHeroFollow}
                className="v3-btn-primary min-h-[44px] px-7 py-3 rounded-xl text-base cursor-pointer transition-transform duration-150 active:scale-[0.98]"
              >
                {COPY.hero.cta}
              </button>
            </div>
          </section>

          {/* Scenes 1 to 5: Five waypoints + expandable step cards */}
          {COPY.waypoints.map((scene, idx) => {
            const isLit = reducedMotion || Boolean(litStops[idx]);
            const isExpanded = expandedStopId === scene.id;
            const isDark = scene.mode === 'dark';
            const art = SCENE_ARTWORKS[scene.id];

            const waypointDesktopClass =
              scene.side === 'right'
                ? 'md:left-[70%] md:-translate-x-1/2'
                : scene.side === 'left'
                  ? 'md:left-[30%] md:-translate-x-1/2'
                  : 'md:left-[50%] md:-translate-x-1/2';

            // Keep cards in the sky/upper region opposite the props so props stay clear
            const cardDesktopClass =
              scene.side === 'right'
                ? 'md:mr-auto md:ml-[7%] md:max-w-md md:self-start md:mt-16'
                : scene.side === 'left'
                  ? 'md:ml-auto md:mr-[7%] md:max-w-md md:self-start md:mt-16'
                  : 'md:mx-auto md:max-w-xl md:self-start md:mt-24';

            return (
              <section
                key={scene.id}
                id={`scene-${scene.id}`}
                data-scene={scene.id}
                data-section-mode={scene.mode}
                aria-labelledby={`heading-${scene.id}`}
                className="relative min-h-[120vh] flex items-start sm:items-center py-24 sm:py-28 px-5 overflow-hidden"
              >
                <SceneBackdrop
                  sceneId={scene.id}
                  gradientClass={scene.backdropClass}
                  layers={art.layers}
                  parallax={art.parallax}
                  landShiftY={art.landShiftY}
                  skyShiftY={art.skyShiftY}
                  sunSink={art.sunSink}
                  horizonGlow={art.horizonGlow}
                  reducedMotion={reducedMotion}
                  showHorizonDebug={showHorizonDebug}
                >
                  <SceneProps config={art} />
                </SceneBackdrop>

                {/* Interactive waypoint button on the path */}
                <button
                  type="button"
                  data-waypoint-stop={scene.stopNumber}
                  data-lit={isLit ? 'true' : 'false'}
                  aria-label={scene.waypointLabel}
                  onClick={() => handleWaypointSelect(scene)}
                  className={[
                    'absolute z-30 w-12 h-12 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-base border-2 transition-colors duration-200 cursor-pointer',
                    'left-[28px] -translate-x-1/2',
                    scene.side === 'center' ? 'top-20 md:top-24' : 'top-[40%] -translate-y-1/2',
                    waypointDesktopClass,
                    isLit
                      ? 'bg-[var(--c-saffron)] border-[var(--c-forest-900)] text-[var(--c-night-0)] shadow-[0_0_24px_rgba(244,162,27,0.65)]'
                      : isDark
                        ? 'bg-[var(--c-night-0)] border-[var(--c-gold)] text-[var(--c-ivory)] hover:border-[var(--c-saffron)]'
                        : 'bg-[#FFFEFA] border-[var(--c-forest-900)] text-[var(--c-forest-900)] hover:bg-[var(--c-brand-green)]',
                  ].join(' ')}
                >
                  {scene.stopNumber}
                </button>

                {/* Card positioned right of mobile vertical line, or alternating opposite waypoint/props on desktop */}
                <div className={`relative z-30 w-full pl-12 md:pl-0 ${cardDesktopClass}`}>
                  <StepCard
                    scene={scene}
                    expanded={isExpanded}
                    onToggle={handleToggleCard}
                    onOpenAuth={onOpenAuth}
                    onJoinAlumni={() => onOpenAuth?.('register')}
                  />
                </div>
              </section>
            );
          })}
        </main>

        <footer
          data-scene="footer"
          data-section-mode="light"
          className="relative z-30 border-t border-[rgba(20,56,42,0.16)] bg-[var(--c-brand-white)] py-8 px-5 text-center"
        >
          <p className="text-xs font-medium text-[var(--c-ink-soft)] m-0">
            {COPY.footer.creditLine}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default LandingPage;
