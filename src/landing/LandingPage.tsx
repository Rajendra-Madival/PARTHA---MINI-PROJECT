import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
import { HeroBowOverlay } from './components/HeroBowController';
import { MouseTrailCanvas } from './components/MouseTrailCanvas';
import { Navbar } from './components/Navbar';
import { SceneBackdrop } from './components/SceneBackdrop';
import { GateArtworkStage, KURUKSHETRA_TORCHES, SceneProps } from './components/SceneProps';
import { StepCard } from './components/StepCard';

gsap.registerPlugin(ScrollTrigger);

export interface LandingPageProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export function LandingPage({ onOpenAuth }: LandingPageProps = {}) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const gateSectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  const [litStops, setLitStops] = useState<boolean[]>(() =>
    COPY.waypoints.map(() => reducedMotion),
  );
  const [arrivedScenes, setArrivedScenes] = useState<Record<string, boolean>>(() => {
    if (!reducedMotion) return {};
    return Object.fromEntries(COPY.waypoints.map((w) => [w.id, true]));
  });
  const [expandedStopId, setExpandedStopId] = useState<StoryWaypointScene['id'] | null>(null);

  const [ramaPose, setRamaPose] = useState<'ready' | 'draw'>('ready');
  const [hasHeroShot, setHasHeroShot] = useState<boolean>(reducedMotion);
  const [pathArrowVisible, setPathArrowVisible] = useState<boolean>(reducedMotion);

  const showHorizonDebug = useMemo(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === 'horizon';
  }, []);

  useEffect(() => {
    return initScrollEngine(reducedMotion);
  }, [reducedMotion]);

  // Preload rama-draw on idle after first paint for bow interaction readiness
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

  // Scene 5 (The Gate) pinned zoom: doors open, zoom toward doorway with white-gold flash, highlight login card
  useEffect(() => {
    const gateEl = gateSectionRef.current;
    if (!gateEl || reducedMotion) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        id: 'gate-pinned-zoom',
        trigger: gateEl,
        start: 'top top',
        end: '+=125%',
        pin: true,
        pinSpacing: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = Math.min(Math.max(self.progress, 0), 1);
          const doorP = Math.min(1, p / 0.52);
          const zoomP = Math.min(1, Math.max(0, (p - 0.14) / 0.86));
          const flashP =
            p < 0.58 ? (p / 0.58) * 0.78 : Math.max(0.2, 0.78 - ((p - 0.58) / 0.42) * 0.58);

          const closedEl = gateEl.querySelector<HTMLElement>('[data-gate-layer="closed"]');
          const openEl = gateEl.querySelector<HTMLElement>('[data-gate-layer="open"]');
          const wrapperEl = gateEl.querySelector<HTMLElement>('[data-gate-wrapper="true"]');
          const flashEl = gateEl.querySelector<HTMLElement>('[data-gate-flash="true"]');
          const cardWrapEl = gateEl.querySelector<HTMLElement>('[data-gate-card-wrap="true"]');

          if (closedEl) closedEl.style.opacity = String(1 - doorP);
          if (openEl) openEl.style.opacity = String(doorP);
          if (wrapperEl) {
            wrapperEl.style.transform = `scale(${(1 + zoomP * 0.22).toFixed(4)})`;
          }
          if (flashEl) {
            flashEl.style.opacity = String(flashP.toFixed(3));
          }
          if (cardWrapEl) {
            const cardScale = 0.96 + zoomP * 0.04;
            cardWrapEl.style.transform = `scale(${cardScale.toFixed(4)})`;
          }
        },
      });
    }, gateEl);

    return () => ctx.revert();
  }, [reducedMotion]);

  const handleLitStopsChange = useCallback((nextLit: boolean[]) => {
    setLitStops(nextLit);
    setArrivedScenes((prev) => {
      let changed = false;
      const updated = { ...prev };
      COPY.waypoints.forEach((wp, idx) => {
        if (nextLit[idx] && !updated[wp.id]) {
          updated[wp.id] = true;
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, []);

  const handleActiveSceneChange = useCallback((activeSceneId: StoryWaypointScene['id'] | null) => {
    setExpandedStopId(activeSceneId);
    if (activeSceneId) {
      setArrivedScenes((prev) =>
        prev[activeSceneId] ? prev : { ...prev, [activeSceneId]: true },
      );
    }
  }, []);

  const handleToggleCard = useCallback((id: StoryWaypointScene['id']) => {
    setExpandedStopId((prev) => (prev === id ? null : id));
  }, []);

  const handleWaypointSelect = useCallback((scene: StoryWaypointScene) => {
    scrollToTarget(`#scene-${scene.id}`, { duration: 1.4 });
    setArrivedScenes((prev) => (prev[scene.id] ? prev : { ...prev, [scene.id]: true }));
    setExpandedStopId(scene.id);
  }, []);

  const handleHeroFollow = useCallback(() => {
    scrollToTarget(`#scene-${COPY.waypoints[0].id}`, { duration: 1.4 });
  }, []);

  const handleHeroShotStart = useCallback((triggeredByScroll: boolean) => {
    setHasHeroShot(true);
    if (triggeredByScroll) {
      setPathArrowVisible(true);
    }
  }, []);

  const handleHeroShotComplete = useCallback(() => {
    setHasHeroShot(true);
    setPathArrowVisible(true);
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
      <MouseTrailCanvas reducedMotion={reducedMotion} />

      <div ref={scrollContainerRef} className="relative w-full overflow-x-clip">
        {/* Path layer sits at z-20: strictly above land+props+fore (z-1..6) and strictly below HUD (z-30) */}
        <ArrowsPathOverlay
          containerRef={scrollContainerRef}
          reducedMotion={reducedMotion}
          arrowVisible={pathArrowVisible}
          onActiveStopsChange={handleLitStopsChange}
          onActiveSceneChange={handleActiveSceneChange}
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
              <SceneProps
                config={heroArt}
                eager
                reducedMotion={reducedMotion}
                ramaPose={ramaPose}
              />
            </SceneBackdrop>

            {/* Bow interaction & arrow origin inside Hero's 16:9 art box near Rama's outstretched bow */}
            <div
              data-scene-hud="hero"
              style={{ '--art-focus-x': String(heroArt.focusXPercent) } as CSSProperties}
              className="v3-art-box pointer-events-none !overflow-visible z-30"
            >
              <HeroBowOverlay
                reducedMotion={reducedMotion}
                hasShot={hasHeroShot}
                onRamaPoseChange={setRamaPose}
                onShotStart={handleHeroShotStart}
                onShotComplete={handleHeroShotComplete}
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
            const isArrived = reducedMotion || Boolean(arrivedScenes[scene.id]);
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
                  <SceneProps
                    config={art}
                    arrived={isArrived}
                    reducedMotion={reducedMotion}
                  />
                </SceneBackdrop>

                {/* Waypoint ring: desktop uses shared 16:9 box %; mobile pins to straight left rail (x = 28px) */}
                <div
                  data-scene-hud={scene.id}
                  className="pointer-events-none absolute z-30 md:inset-x-0 md:bottom-0 md:aspect-[16/9] max-md:inset-0"
                >
                  {/* Scene 1 Ashram arrival golden sparkle around Ring 1 */}
                  {scene.id === 'ashram' && isArrived && !reducedMotion && (
                    <div
                      aria-hidden="true"
                      data-arrival-sparkle="ashram"
                      style={{ left: `${wp.xPercent}%`, top: `${wp.yPercent}%` }}
                      className="v3-sparkle-ring pointer-events-none absolute max-md:!left-[28px] max-md:!top-[calc(12vh+96px)] w-14 h-14 rounded-full border-2 border-[#FFF6E3] bg-[radial-gradient(circle,rgba(244,162,27,0.65)_0%,rgba(244,162,27,0)_72%)]"
                    />
                  )}

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
                      'pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 max-md:!left-[28px] max-md:!top-[calc(12vh+96px)] w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-base border-2 transition-all duration-200 cursor-pointer',
                      isLit
                        ? 'bg-[var(--c-saffron)] border-[#FFF6E3] text-[var(--c-night-0)] shadow-[0_0_24px_rgba(244,162,27,0.85)]'
                        : 'bg-[rgba(11,16,38,0.68)] border-[var(--c-gold)] text-[#FFF6E3] shadow-[0_0_14px_rgba(212,175,55,0.48)] hover:border-[var(--c-saffron)]',
                    ].join(' ')}
                  >
                    {scene.stopNumber}
                  </button>

                  {/* Scene 4 Dawn Lake: glowing diya button on the lake -> opens standard sign-up */}
                  {scene.id === 'dawn-lake' && (
                    <button
                      type="button"
                      data-alumni-diya="true"
                      onClick={() => onOpenAuth?.('register')}
                      className="pointer-events-auto absolute md:left-[72%] md:top-[76%] md:-translate-x-1/2 md:-translate-y-1/2 max-md:right-4 max-md:bottom-6 min-h-[44px] min-w-[44px] flex flex-col items-center gap-1 rounded-2xl px-2.5 py-1.5 bg-[rgba(255,254,250,0.86)] border border-[rgba(20,56,42,0.28)] shadow-[0_0_24px_rgba(244,162,27,0.48)] hover:bg-[var(--c-brand-green)] hover:border-[var(--c-forest-900)] transition-all duration-200 cursor-pointer"
                    >
                      <span className="relative inline-flex items-center justify-center">
                        <span
                          aria-hidden="true"
                          className="absolute -top-2 w-7 h-7 rounded-full blur-[4px] bg-[radial-gradient(circle,rgba(255,246,227,0.95)_0%,rgba(244,162,27,0.85)_45%,rgba(255,122,26,0)_76%)]"
                        />
                        <img
                          src="/landing/art/diya.webp"
                          alt=""
                          width={640}
                          height={401}
                          loading="lazy"
                          decoding="async"
                          className="relative w-10 h-6 object-contain"
                        />
                      </span>
                      <span className="text-[11px] font-semibold tracking-wide text-[var(--c-forest-900)] whitespace-nowrap">
                        Join as alumni
                      </span>
                    </button>
                  )}
                </div>

                {/* Desktop: placed in empty sky box %. Mobile <768px: stacked cleanly to the right of left rail */}
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
                    className="pointer-events-auto absolute max-md:left-[60px] max-md:right-4 max-md:top-[calc(12vh+72px)] md:left-[var(--card-x)] md:top-[var(--card-y)]"
                  >
                    <StepCard
                      scene={scene}
                      expanded={isExpanded}
                      onToggle={handleToggleCard}
                      onOpenAuth={onOpenAuth}
                      onJoinAlumni={() => onOpenAuth?.('register')}
                    />
                  </div>

                  {/* Mobile <768px: keep Kurukshetra's 3 lit torches (Internships, Jobs, Projects) visible inside screen */}
                  {scene.id === 'kurukshetra' && (
                    <div
                      data-kurukshetra-torches="mobile"
                      className="md:hidden pointer-events-none absolute left-[60px] right-4 bottom-6 flex items-center justify-between gap-2"
                    >
                      {KURUKSHETRA_TORCHES.map((torch) => (
                        <div
                          key={torch.label}
                          className="flex flex-col items-center gap-1 flex-1"
                        >
                          <div className="w-2.5 h-4 rounded-full bg-gradient-to-t from-[#FF7A1A] via-[#F4A21B] to-[#FFF6E3] shadow-[0_0_12px_rgba(244,162,27,0.9)]" />
                          <span className="px-2 py-0.5 rounded-md bg-[rgba(11,16,38,0.88)] border border-[rgba(212,175,55,0.48)] text-[11px] font-semibold text-[#FFF6E3] whitespace-nowrap">
                            {torch.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}

          {/* Scene 5: The Gate - pins in place, doors open, zooms toward doorway with white-gold flash */}
          <section
            ref={gateSectionRef}
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
              <div className="relative z-30 w-full flex flex-col md:items-center max-md:items-start px-4 max-md:pl-[60px] shrink-0 pointer-events-auto">
                <div
                  data-gate-card-wrap="true"
                  className="w-full flex md:justify-center max-md:justify-start transition-transform duration-300"
                >
                  <StepCard
                    scene={gateScene}
                    expanded={expandedStopId === gateScene.id}
                    onToggle={handleToggleCard}
                    onOpenAuth={onOpenAuth}
                  />
                </div>

                {/* 28px gold waypoint 5: centered above arch peak on desktop, aligned to x = 28px rail on mobile */}
                <button
                  type="button"
                  data-waypoint-stop={gateScene.stopNumber}
                  data-lit={reducedMotion || Boolean(litStops[4]) ? 'true' : 'false'}
                  aria-label={gateScene.waypointLabel}
                  onClick={() => handleWaypointSelect(gateScene)}
                  className={[
                    'mt-1.5 mb-2 relative z-30 max-md:-ml-[46px] w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-200 cursor-pointer',
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
                <GateArtworkStage config={gateArt} reducedMotion={reducedMotion} />
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
