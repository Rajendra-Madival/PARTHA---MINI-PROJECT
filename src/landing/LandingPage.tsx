import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
import { Navbar } from './components/Navbar';
import { SceneBackdrop } from './components/SceneBackdrop';
import { GateArtworkStage, SceneProps } from './components/SceneProps';
import { StepCard } from './components/StepCard';

gsap.registerPlugin(ScrollTrigger);

export interface LandingPageProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
  gateAuthSlot?: ReactNode;
}

function FallbackGateLogin({ onOpenAuth }: { onOpenAuth?: (mode: 'login' | 'register') => void }) {
  return (
    <article
      data-gate-fallback-login="true"
      className="max-w-[380px] w-full rounded-2xl p-6 border backdrop-blur-md bg-[rgba(255,254,250,0.95)] border-[rgba(20,56,42,0.22)] text-[var(--c-ink)] shadow-[0_20px_48px_rgba(20,56,42,0.16)] text-center"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--c-forest)] mb-1 m-0">
        Stop 5 of 5 · {COPY.waypoints[4].epicTitle}
      </p>
      <h3 className="font-[var(--font-landing-display)] text-3xl font-bold text-[var(--c-forest-900)] mb-2 m-0">
        {COPY.gate.heading}
      </h3>
      <p className="text-sm text-[var(--c-ink)] mb-5 m-0">{COPY.waypoints[4].body}</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onOpenAuth?.('login')}
          className="v3-btn-primary flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm cursor-pointer"
        >
          {COPY.gate.loginCta}
        </button>
        <button
          type="button"
          onClick={() => onOpenAuth?.('register')}
          className="flex-1 min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--c-forest-900)] bg-[#FFFEFA] text-[var(--c-forest-900)] hover:bg-[var(--c-brand-green)] transition-colors cursor-pointer"
        >
          {COPY.gate.signupCta}
        </button>
      </div>
    </article>
  );
}

export function LandingPage({ onOpenAuth, gateAuthSlot }: LandingPageProps = {}) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const gateSectionRef = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  const [litStops, setLitStops] = useState<boolean[]>(() =>
    COPY.waypoints.map(() => reducedMotion),
  );
  const [expandedStopId, setExpandedStopId] = useState<StoryWaypointScene['id'] | null>(null);

  const [ramaPose, setRamaPose] = useState<'ready' | 'draw'>('ready');
  const [hasHeroShot, setHasHeroShot] = useState<boolean>(reducedMotion);

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

  // Scene 5 (The Gate) pinned sequence: doors open -> deep zoom into doorway flash -> fade in real login page
  useEffect(() => {
    const gateEl = gateSectionRef.current;
    if (!gateEl || reducedMotion) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        id: 'gate-pinned-zoom',
        trigger: gateEl,
        start: 'bottom bottom',
        end: '+=180%',
        pin: true,
        pinSpacing: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = Math.min(Math.max(self.progress, 0), 1);

          // 0..32%: doors swing open & Stop 5 ring fades cleanly
          const doorP = Math.min(1, p / 0.32);
          // 20..82%: deep zoom into the doorway center (1x -> 3.4x)
          const zoomP = Math.min(1, Math.max(0, (p - 0.2) / 0.62));
          // 30..78%: white-gold doorway flash expands across screen
          const flashP = Math.min(1, Math.max(0, (p - 0.3) / 0.48));
          // 72..100%: real login page fades in inside the light
          const loginP = Math.min(1, Math.max(0, (p - 0.72) / 0.28));

          const closedEl = gateEl.querySelector<HTMLElement>('[data-gate-layer="closed"]');
          const openEl = gateEl.querySelector<HTMLElement>('[data-gate-layer="open"]');
          const wrapperEl = gateEl.querySelector<HTMLElement>('[data-gate-wrapper="true"]');
          const wallExts = gateEl.querySelectorAll<HTMLElement>('[data-gate-wall-ext="true"]');
          const ringEl = gateEl.querySelector<HTMLElement>('[data-waypoint-stop="5"]');
          const flashEl = gateEl.querySelector<HTMLElement>('[data-gate-flash="true"]');
          const loginEl = gateEl.querySelector<HTMLElement>('[data-gate-login-overlay="true"]');

          if (closedEl) closedEl.style.opacity = String(1 - doorP);
          if (openEl) openEl.style.opacity = String(doorP);
          if (ringEl) ringEl.style.opacity = String(Math.max(0, 1 - doorP * 1.4));

          if (wrapperEl) {
            const scale = 1 + zoomP * zoomP * 2.4;
            wrapperEl.style.transform = `scale(${scale.toFixed(4)})`;
          }

          wallExts.forEach((ext) => {
            ext.style.opacity = String(Math.max(0, 1 - zoomP * 1.6));
          });

          if (flashEl) {
            flashEl.style.opacity = String(flashP.toFixed(3));
          }

          if (loginEl) {
            loginEl.style.opacity = String(loginP.toFixed(3));
            loginEl.style.transform = `scale(${(0.96 + loginP * 0.04).toFixed(4)})`;
            loginEl.style.pointerEvents = loginP > 0.35 ? 'auto' : 'none';
          }
        },
      });
    }, gateEl);

    return () => ctx.revert();
  }, [reducedMotion]);

  // Scene 4 (The Dawn Lake): lotus starts closed (lotus-bud) and blooms open as you scroll past
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || reducedMotion) return;

    const lakeEl = container.querySelector<HTMLElement>('#scene-dawn-lake');
    if (!lakeEl) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        id: 'dawn-lake-lotus-bloom',
        trigger: lakeEl,
        start: 'top 58%',
        end: 'top 22%',
        scrub: 0.4,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (lakeEl.getBoundingClientRect().height === 0) return;
          const p = Math.min(Math.max(self.progress, 0), 1);
          const budEl = lakeEl.querySelector<HTMLElement>('[data-prop="lotus-bud"]');
          const openEl = lakeEl.querySelector<HTMLElement>('[data-prop="lotus-open"]');
          if (budEl) budEl.style.opacity = String((1 - p).toFixed(3));
          if (openEl) {
            openEl.style.opacity = String(p.toFixed(3));
            openEl.dataset.lotusBloomed = p >= 0.5 ? 'true' : 'false';
          }
        },
      });
    }, lakeEl);

    return () => ctx.revert();
  }, [reducedMotion]);

  const handleLitStopsChange = useCallback((nextLit: boolean[]) => {
    setLitStops(nextLit);
  }, []);

  const handleActiveSceneChange = useCallback((activeSceneId: StoryWaypointScene['id'] | null) => {
    setExpandedStopId(activeSceneId);
  }, []);

  const handleToggleCard = useCallback((id: StoryWaypointScene['id']) => {
    setExpandedStopId((prev) => (prev === id ? null : id));
  }, []);

  const handleWaypointSelect = useCallback((scene: StoryWaypointScene) => {
    if (scene.id === 'gate') {
      const gateTrigger = ScrollTrigger.getById('gate-pinned-zoom');
      if (gateTrigger) {
        scrollToTarget(gateTrigger.end, { duration: 1.4 });
        return;
      }
    }
    scrollToTarget(`#scene-${scene.id}`, { duration: 1.4 });
    setExpandedStopId(scene.id);
  }, []);

  const handleHeroFollow = useCallback(() => {
    scrollToTarget(`#scene-${COPY.waypoints[0].id}`, { duration: 1.4 });
  }, []);

  const handleHeroShoot = useCallback(() => {
    setHasHeroShot(true);
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
        {/* Single unified path & arrow overlay (z-20): strictly above scenes (z-1..6) and below HUD (z-30) */}
        <ArrowsPathOverlay
          containerRef={scrollContainerRef}
          reducedMotion={reducedMotion}
          hasShot={hasHeroShot}
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

            {/* Bow anchor & clean hit area inside Hero's 16:9 art box */}
            <div
              data-scene-hud="hero"
              style={{ '--art-focus-x': String(heroArt.focusXPercent) } as CSSProperties}
              className="v3-art-box pointer-events-none !overflow-visible z-30"
            >
              <HeroBowOverlay
                reducedMotion={reducedMotion}
                hasShot={hasHeroShot}
                onRamaPoseChange={setRamaPose}
                onShoot={handleHeroShoot}
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
                  <SceneProps
                    config={art}
                    reducedMotion={reducedMotion}
                  />
                </SceneBackdrop>

                {/* Waypoint ring: desktop uses shared 16:9 box %; mobile pins to straight left rail (x = 28px) */}
                <div
                  data-scene-hud={scene.id}
                  className="pointer-events-none absolute z-30 md:inset-x-0 md:bottom-0 md:aspect-[16/9] max-md:inset-0"
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
                      'pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 max-md:!left-[28px] max-md:!top-[calc(12vh+96px)] w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-base border-2 transition-all duration-200 cursor-pointer',
                      isLit
                        ? 'bg-[var(--c-saffron)] border-[#FFF6E3] text-[var(--c-night-0)] shadow-[0_0_24px_rgba(244,162,27,0.85)]'
                        : 'bg-[rgba(11,16,38,0.68)] border-[var(--c-gold)] text-[#FFF6E3] shadow-[0_0_14px_rgba(212,175,55,0.48)] hover:border-[var(--c-saffron)]',
                    ].join(' ')}
                  >
                    {scene.stopNumber}
                  </button>
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
                </div>
              </section>
            );
          })}

          {/* Scene 5: The Gate - pins in place, doors open, zooms into doorway flash, fades in real login page */}
          <section
            ref={gateSectionRef}
            id={`scene-${gateScene.id}`}
            data-scene={gateScene.id}
            data-section-mode={gateScene.mode}
            aria-labelledby={`heading-${gateScene.id}`}
            className="relative -mt-[12vh] h-[calc(112vh-38px)] min-h-[calc(112vh-38px)] flex flex-col justify-end overflow-hidden"
          >
            <h2 id={`heading-${gateScene.id}`} className="sr-only">
              {gateScene.epicTitle}
            </h2>

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

            {/* Gate stage: small Stop 5 ring above the arch + full-height palace gate */}
            <div className="relative w-full h-full flex flex-col items-center justify-end pt-[calc(12vh+72px)] pointer-events-none overflow-visible">
              <div className="relative z-30 w-full flex flex-col md:items-center max-md:items-start px-4 max-md:pl-[60px] shrink-0">
                <button
                  type="button"
                  data-waypoint-stop={gateScene.stopNumber}
                  data-lit={reducedMotion || Boolean(litStops[4]) ? 'true' : 'false'}
                  aria-label={gateScene.waypointLabel}
                  onClick={() => handleWaypointSelect(gateScene)}
                  className={[
                    'pointer-events-auto mb-2 relative z-30 max-md:-ml-[46px] w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-200 cursor-pointer',
                    reducedMotion || Boolean(litStops[4])
                      ? 'bg-[var(--c-saffron)] border-[#FFF6E3] text-[var(--c-night-0)] shadow-[0_0_20px_rgba(244,162,27,0.85)]'
                      : 'bg-[rgba(255,254,250,0.9)] border-[var(--c-gold)] text-[var(--c-forest-900)] shadow-[0_0_14px_rgba(212,175,55,0.55)] hover:border-[var(--c-saffron)]',
                  ].join(' ')}
                >
                  {gateScene.stopNumber}
                </button>
              </div>

              <div className="relative z-[7] md:flex-1 md:min-h-0 max-md:h-[calc(146vw*1072/1920)] max-md:max-h-[65vh] w-full flex items-end justify-center">
                <GateArtworkStage config={gateArt} reducedMotion={reducedMotion} />
              </div>
            </div>

            {/* White-gold doorway flash filling the viewport as the gate zooms in */}
            <div
              aria-hidden="true"
              data-gate-flash="true"
              style={{
                opacity: reducedMotion ? 0.92 : 0,
                background:
                  'radial-gradient(circle at 50% 58%, #FFFEFA 0%, #FAF7F0 38%, rgba(255,236,179,0.96) 72%, rgba(250,247,240,0.98) 100%)',
              }}
              className="pointer-events-none absolute inset-0 z-[35]"
            />

            {/* Real Login / Sign-up screen fading in inside the doorway light */}
            <div
              data-gate-login-overlay="true"
              style={{
                opacity: reducedMotion ? 1 : 0,
                pointerEvents: reducedMotion ? 'auto' : 'none',
              }}
              className="absolute inset-x-0 bottom-0 h-screen z-40 flex items-center justify-center pt-20 pb-6 px-4 overflow-y-auto"
            >
              {gateAuthSlot ?? <FallbackGateLogin onOpenAuth={onOpenAuth} />}
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
