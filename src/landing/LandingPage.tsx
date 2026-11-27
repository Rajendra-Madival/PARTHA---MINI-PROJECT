import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
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
import { GateArtworkStage, SceneProps } from './components/SceneProps';
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
  const gateScene = COPY.waypoints[4];
  const gateArt = SCENE_ARTWORKS.gate;
  const storyWaypoints = COPY.waypoints.slice(0, 4);

  return (
    <div className="partha-landing-v3">
      <a href="#main-content" className="skip-link">
        {COPY.brand.skipToContent}
      </a>

      <Navbar />

      <div ref={scrollContainerRef} className="relative w-full overflow-x-clip">
        {/* Path layer sits at z-20: strictly above land+props+fore (z-1..6) and strictly below HUD (z-30) */}
        <ArrowsPathOverlay
          containerRef={scrollContainerRef}
          reducedMotion={reducedMotion}
          onActiveStopsChange={setLitStops}
        />

        <main id="main-content" tabIndex={-1}>
          {/* Scene 0: Hero (light) - centered header in sky above Rama standing on left hilltop */}
          <section
            id="scene-hero"
            data-scene="hero"
            data-section-mode={COPY.hero.mode}
            aria-labelledby="hero-heading"
            className="relative v3-scene-shell flex flex-col justify-start px-5 pt-[70px] sm:pt-24 pb-16"
          >
            <SceneBackdrop
              sceneId="hero"
              layerZIndex={1}
              gradientClass={COPY.hero.backdropClass}
              focusXPercent={heroArt.focusXPercent}
              layers={heroArt.layers}
              parallax={heroArt.parallax}
              landShiftY={heroArt.landShiftY}
              landHeightPercent={heroArt.landHeightPercent}
              skyShiftY={heroArt.skyShiftY}
              eager
              reducedMotion={reducedMotion}
              showHorizonDebug={showHorizonDebug}
            >
              <SceneProps config={heroArt} eager />
            </SceneBackdrop>

            {/* Arrow origin sits inside Hero's 16:9 art box right near Rama's outstretched bow */}
            <div
              data-scene-hud="hero"
              style={{ '--art-focus-x': String(heroArt.focusXPercent) } as CSSProperties}
              className="v3-art-box pointer-events-none !overflow-visible z-30"
            >
              <div
                aria-hidden="true"
                data-arrow-origin="true"
                className="pointer-events-none absolute left-[35.5%] top-[47%] -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[var(--c-saffron)] ring-4 ring-[rgba(244,162,27,0.32)] shadow-[0_0_16px_rgba(244,162,27,0.65)]"
              />
            </div>

            <div className="relative z-30 max-w-3xl mx-auto text-center flex flex-col items-center rounded-3xl px-4 sm:px-5 py-2.5 sm:py-4 bg-[radial-gradient(ellipse_at_center,rgba(250,247,240,0.78)_0%,rgba(250,247,240,0.42)_55%,rgba(250,247,240,0)_85%)]">
              <h1 id="hero-heading" className="v3-hero-title font-bold mb-1.5 sm:mb-3 max-sm:!text-[3.1rem]">
                {COPY.hero.title}
              </h1>

              <p className="font-[var(--font-landing-display)] text-xl sm:text-3xl md:text-4xl text-[var(--c-forest-900)] font-semibold mb-1 sm:mb-2 max-w-2xl leading-tight">
                {COPY.hero.tagline}
              </p>

              <p className="text-sm sm:text-lg text-[var(--c-ink)] font-medium mb-3.5 sm:mb-6 max-w-xl">
                {COPY.hero.subline}
              </p>

              <button
                type="button"
                onClick={handleHeroFollow}
                className="v3-btn-primary min-h-[44px] px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base cursor-pointer transition-transform duration-150 active:scale-[0.98]"
              >
                {COPY.hero.cta}
              </button>
            </div>
          </section>

          {/* Scenes 1 to 4: Ashram, Bridge, Kurukshetra, Dawn Lake inside 16:9 Art Boxes with 12vh blends */}
          {storyWaypoints.map((scene, idx) => {
            const isLit = reducedMotion || Boolean(litStops[idx]);
            const isExpanded = expandedStopId === scene.id;
            const art = SCENE_ARTWORKS[scene.id];
            const layerZIndex = idx + 2; // 2, 3, 4, 5

            const wp = art.waypoint ?? { xPercent: 50, yPercent: 50 };
            const cardPos = art.card ?? { xPercent: 16, yPercent: 22 };

            return (
              <section
                key={scene.id}
                id={`scene-${scene.id}`}
                data-scene={scene.id}
                data-section-mode={scene.mode}
                aria-labelledby={`heading-${scene.id}`}
                className="relative v3-scene-shell-blended"
              >
                <SceneBackdrop
                  sceneId={scene.id}
                  layerZIndex={layerZIndex}
                  blended
                  focusXPercent={art.focusXPercent}
                  gradientClass={scene.backdropClass}
                  layers={art.layers}
                  parallax={art.parallax}
                  landShiftY={art.landShiftY}
                  landHeightPercent={art.landHeightPercent}
                  skyShiftY={art.skyShiftY}
                  sunSink={art.sunSink}
                  horizonGlow={art.horizonGlow}
                  reducedMotion={reducedMotion}
                  showHorizonDebug={showHorizonDebug}
                >
                  <SceneProps config={art} />
                </SceneBackdrop>

                {/* Waypoint ring lives inside shared 16:9 box coordinates */}
                <div
                  data-scene-hud={scene.id}
                  style={{ '--art-focus-x': String(art.focusXPercent) } as CSSProperties}
                  className="v3-art-box pointer-events-none !overflow-visible z-30"
                >
                  <button
                    type="button"
                    data-waypoint-stop={scene.stopNumber}
                    data-lit={isLit ? 'true' : 'false'}
                    aria-label={scene.waypointLabel}
                    onClick={() => handleWaypointSelect(scene)}
                    style={{
                      left: `${wp.xPercent}%`,
                      top: `${wp.yPercent}%`,
                    }}
                    className={[
                      'pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-base border-2 transition-all duration-200 cursor-pointer',
                      isLit
                        ? 'bg-[var(--c-saffron)] border-[#FFF6E3] text-[var(--c-night-0)] shadow-[0_0_24px_rgba(244,162,27,0.85)]'
                        : 'bg-[rgba(11,16,38,0.68)] border-[var(--c-gold)] text-[#FFF6E3] shadow-[0_0_14px_rgba(212,175,55,0.48)] hover:border-[var(--c-saffron)]',
                    ].join(' ')}
                  >
                    {scene.stopNumber}
                  </button>
                </div>

                {/* Desktop: placed in empty sky box %. Mobile <768px: centered safely in upper sky */}
                <div
                  className={[
                    'pointer-events-none absolute md:inset-x-0 md:bottom-0 md:aspect-[16/9] max-md:inset-0',
                    isExpanded ? 'z-40' : 'z-30',
                  ].join(' ')}
                >
                  <div
                    style={
                      {
                        '--card-x': `${cardPos.xPercent}%`,
                        '--card-y': `${cardPos.yPercent}%`,
                      } as CSSProperties
                    }
                    className="pointer-events-auto absolute max-md:left-1/2 max-md:-translate-x-1/2 max-md:top-[calc(12vh+72px)] md:left-[var(--card-x)] md:top-[var(--card-y)]"
                  >
                    <StepCard
                      scene={scene}
                      expanded={isExpanded}
                      onToggle={handleToggleCard}
                      onOpenAuth={onOpenAuth}
                      onJoinAlumni={() => onOpenAuth?.('register')}
                    />
                  </div>
                </div>
              </section>
            );
          })}

          {/* Scene 5: The Gate - entire gate (arch top to bottom steps) visible between navbar & footer */}
          <section
            id={`scene-${gateScene.id}`}
            data-scene={gateScene.id}
            data-section-mode={gateScene.mode}
            aria-labelledby={`heading-${gateScene.id}`}
            className="relative -mt-[12vh] h-[calc(112vh-38px)] min-h-[calc(112vh-38px)] flex flex-col justify-end overflow-hidden"
          >
            {/* Sky layer blends softly from Dawn Lake over the top 12vh */}
            <SceneBackdrop
              sceneId={gateScene.id}
              layerZIndex={6}
              blended
              focusXPercent={gateArt.focusXPercent}
              gradientClass={gateScene.backdropClass}
              layers={gateArt.layers}
              parallax={gateArt.parallax}
              landShiftY={gateArt.landShiftY}
              reducedMotion={reducedMotion}
            />

            {/* Bounded stage strictly below 12vh blend & 64px fixed navbar down to footer (NO z-index so HUD z-30 stays above path z-20) */}
            <div className="relative w-full h-full flex flex-col items-center justify-end pt-[calc(12vh+68px)] pointer-events-none overflow-hidden">
              {/* Compact Gate card in the open golden sky strictly above Ring 5 & gate arch */}
              <div className="relative z-30 w-full flex flex-col items-center px-4 shrink-0 pointer-events-auto">
                <StepCard
                  scene={gateScene}
                  expanded={expandedStopId === gateScene.id}
                  onToggle={handleToggleCard}
                  onOpenAuth={onOpenAuth}
                />

                {/* 28px gold waypoint 5 sitting right above the arch peak */}
                <button
                  type="button"
                  data-waypoint-stop={gateScene.stopNumber}
                  data-lit={reducedMotion || Boolean(litStops[4]) ? 'true' : 'false'}
                  aria-label={gateScene.waypointLabel}
                  onClick={() => handleWaypointSelect(gateScene)}
                  className={[
                    'mt-1.5 mb-2 relative z-30 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-200 cursor-pointer',
                    reducedMotion || Boolean(litStops[4])
                      ? 'bg-[var(--c-saffron)] border-[#FFF6E3] text-[var(--c-night-0)] shadow-[0_0_20px_rgba(244,162,27,0.85)]'
                      : 'bg-[rgba(255,254,250,0.9)] border-[var(--c-gold)] text-[var(--c-forest-900)] shadow-[0_0_14px_rgba(212,175,55,0.55)] hover:border-[var(--c-saffron)]',
                  ].join(' ')}
                >
                  {gateScene.stopNumber}
                </button>
              </div>

              {/* Flex-1 stage on desktop; explicit vw aspect height on mobile so lazy observer & image render cleanly */}
              <div className="relative z-[7] md:flex-1 md:min-h-0 max-md:h-[calc(146vw*1072/1920)] max-md:max-h-[65vh] w-full flex items-end justify-center">
                <GateArtworkStage config={gateArt} />
              </div>
            </div>
          </section>
        </main>

        <footer
          data-scene="footer"
          data-section-mode="light"
          className="relative z-30 border-t border-[rgba(20,56,42,0.16)] bg-[var(--c-brand-white)] py-3 px-5 text-center"
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
