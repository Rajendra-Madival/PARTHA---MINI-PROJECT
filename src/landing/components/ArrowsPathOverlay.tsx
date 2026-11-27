import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COPY, type StoryWaypointScene } from '../content/copy';

gsap.registerPlugin(ScrollTrigger);

interface ArrowsPathOverlayProps {
  containerRef: RefObject<HTMLDivElement | null>;
  reducedMotion: boolean;
  hasShot?: boolean;
  onActiveStopsChange: (litStops: boolean[]) => void;
  onActiveSceneChange?: (sceneId: StoryWaypointScene['id'] | null) => void;
}

interface LightBandRect {
  y: number;
  height: number;
}

interface PathGeometry {
  d: string;
  width: number;
  height: number;
  isMobile: boolean;
  lightBands: LightBandRect[];
  launchPt: { x: number; y: number } | null;
  stopDocYs: number[];
  endX: number;
  endY: number;
  endAngle: number;
}

function buildBowAndCurvePath(
  origin: { x: number; y: number },
  launchPt: { x: number; y: number },
  stops: Array<{ x: number; y: number }>,
  isMobile: boolean,
): string {
  if (stops.length === 0) return '';

  // Segment 0: straight bow shot forward into the open sky
  let d = `M ${origin.x.toFixed(1)} ${origin.y.toFixed(1)} L ${launchPt.x.toFixed(1)} ${launchPt.y.toFixed(1)}`;

  // Segment 1: C1-smooth, broad sweeping curve from the straight sky shot down to Stop 1
  const dx0 = launchPt.x - origin.x;
  const dy0 = launchPt.y - origin.y;
  const len0 = Math.hypot(dx0, dy0) || 1;
  const ux = dx0 / len0;
  const uy = dy0 / len0;
  const tangentLead = isMobile ? 42 : Math.min(72, len0 * 0.18);

  const firstStop = stops[0];
  const dy1 = firstStop.y - launchPt.y;
  const c1x = launchPt.x + ux * tangentLead;
  const c1y = launchPt.y + uy * tangentLead;
  const c2x = isMobile ? firstStop.x : firstStop.x + (launchPt.x - firstStop.x) * 0.14;
  const c2y = firstStop.y - dy1 * 0.52;
  d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${firstStop.x.toFixed(1)} ${firstStop.y.toFixed(1)}`;

  if (isMobile) {
    for (let i = 1; i < stops.length; i += 1) {
      d += ` L ${stops[i].x.toFixed(1)} ${stops[i].y.toFixed(1)}`;
    }
    return d;
  }

  for (let i = 1; i < stops.length; i += 1) {
    const prev = stops[i - 1];
    const curr = stops[i];
    const dy = curr.y - prev.y;
    const sc1x = prev.x;
    const sc1y = prev.y + dy * 0.45;
    const sc2x = curr.x;
    const sc2y = curr.y - dy * 0.45;
    d += ` C ${sc1x.toFixed(1)} ${sc1y.toFixed(1)}, ${sc2x.toFixed(1)} ${sc2y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }

  return d;
}

function findClosestProgress(
  pathEl: SVGPathElement,
  totalLength: number,
  target: { x: number; y: number },
): number {
  if (totalLength <= 0 || typeof pathEl.getPointAtLength !== 'function') return 1;
  const samples = 180;
  let bestDist = Infinity;
  let bestT = 0;

  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const pt = pathEl.getPointAtLength(totalLength * t);
    const dx = pt.x - target.x;
    const dy = pt.y - target.y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      bestT = t;
    }
  }
  return bestT;
}

function computeScrollMappedProgress(
  scrollY: number,
  stopScrollYs: number[],
  thresholds: number[],
  launchProgress: number,
  shotProgress: number,
  scrollEngaged: boolean,
): number {
  const s0 = Math.max(120, stopScrollYs[0] ?? 700);
  const t0 = thresholds[0] ?? 0.28;
  const handoffY = Math.max(60, Math.round(s0 * 0.2));
  const pHandoff = launchProgress + (t0 - launchProgress) * 0.2;

  if (scrollY <= 1) {
    return scrollEngaged ? 0 : shotProgress;
  }

  if (scrollY < s0) {
    if (!scrollEngaged && shotProgress > 0 && scrollY <= handoffY) {
      return shotProgress + (pHandoff - shotProgress) * (scrollY / handoffY);
    }
    if (scrollY <= handoffY) {
      return (scrollY / handoffY) * pHandoff;
    }
    const u = (scrollY - handoffY) / (s0 - handoffY);
    return pHandoff + (t0 - pHandoff) * u;
  }

  for (let i = 0; i < 4; i += 1) {
    const startY = stopScrollYs[i] ?? s0;
    const endY = Math.max(startY + 1, stopScrollYs[i + 1] ?? startY + 600);
    if (scrollY <= endY) {
      const u = (scrollY - startY) / (endY - startY);
      const pStart = thresholds[i] ?? 0;
      const pEnd = thresholds[i + 1] ?? 1;
      return pStart + (pEnd - pStart) * u;
    }
  }

  return 1;
}

export function ArrowsPathOverlay({
  containerRef,
  reducedMotion,
  hasShot = false,
  onActiveStopsChange,
  onActiveSceneChange,
}: ArrowsPathOverlayProps) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const brownEdgeRef = useRef<SVGPathElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const glowId = useId();
  const lightClipId = useId();

  const [geometry, setGeometry] = useState<PathGeometry>({
    d: '',
    width: 1440,
    height: 4000,
    isMobile: false,
    lightBands: [],
    launchPt: null,
    stopDocYs: [1080, 1800, 2490, 3060, 3400],
    endX: 0,
    endY: 0,
    endAngle: 90,
  });

  const metricsRef = useRef<{
    totalLength: number;
    thresholds: number[];
    stopScrollYs: number[];
    launchProgress: number;
    endX: number;
    endY: number;
    endAngle: number;
    reducedMotion: boolean;
  }>({
    totalLength: 0,
    thresholds: [0.28, 0.48, 0.68, 0.85, 1],
    stopScrollYs: [700, 1420, 2110, 2680, 3100],
    launchProgress: 0.1,
    endX: 0,
    endY: 0,
    endAngle: 90,
    reducedMotion,
  });

  const shotProgressRef = useRef<number>(0);
  const scrollEngagedRef = useRef<boolean>(false);
  const prevScrollYRef = useRef<number>(0);
  const shotTweenRef = useRef<gsap.core.Tween | null>(null);

  const lastLitMaskRef = useRef<string>('');
  const lastActiveSceneRef = useRef<StoryWaypointScene['id'] | null>(null);
  const onActiveStopsChangeRef = useRef(onActiveStopsChange);
  onActiveStopsChangeRef.current = onActiveStopsChange;
  const onActiveSceneChangeRef = useRef(onActiveSceneChange);
  onActiveSceneChangeRef.current = onActiveSceneChange;

  const updateLitStops = useCallback(
    (progress: number, thresholds: number[], launchProgress: number, isReduced: boolean) => {
      const next = isReduced
        ? thresholds.map(() => true)
        : thresholds.map((t) => progress >= Math.max(0.02, t - 0.03));
      const mask = next.map((b) => (b ? '1' : '0')).join('');
      if (mask !== lastLitMaskRef.current) {
        lastLitMaskRef.current = mask;
        onActiveStopsChangeRef.current(next);
      }

      if (isReduced) return;

      let activeScene: StoryWaypointScene['id'] | null = null;
      for (let i = 0; i < 4; i += 1) {
        const t = thresholds[i] ?? 1;
        const enter =
          i === 0
            ? Math.max(launchProgress + 0.02, t - 0.05)
            : (thresholds[i - 1] + t) * 0.5 + 0.015;
        const leave = (t + (thresholds[i + 1] ?? 1)) * 0.5 - 0.015;
        if (progress >= enter && progress <= leave) {
          activeScene = COPY.waypoints[i].id;
          break;
        }
      }

      if (activeScene !== lastActiveSceneRef.current) {
        lastActiveSceneRef.current = activeScene;
        onActiveSceneChangeRef.current?.(activeScene);
      }
    },
    [],
  );

  const syncVisuals = useCallback(() => {
    const pathEl = pathRef.current;
    const brownEl = brownEdgeRef.current;
    const tipEl = tipRef.current;
    const {
      totalLength,
      thresholds,
      stopScrollYs,
      launchProgress,
      endX,
      endY,
      endAngle,
      reducedMotion: isReduced,
    } = metricsRef.current;

    if (!pathEl) return;

    const applyDash = (offset: number) => {
      pathEl.style.strokeDasharray = `${totalLength}`;
      pathEl.style.strokeDashoffset = `${offset}`;
      if (brownEl) {
        brownEl.style.strokeDasharray = `${totalLength}`;
        brownEl.style.strokeDashoffset = `${offset}`;
      }
    };

    if (isReduced) {
      applyDash(0);
      if (tipEl) {
        gsap.set(tipEl, { x: endX, y: endY, rotation: endAngle, opacity: 1 });
      }
      updateLitStops(1, thresholds, launchProgress, true);
      return;
    }

    const scrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    const s0 = Math.max(120, stopScrollYs[0] ?? 700);
    const scrollingUp = scrollY < prevScrollYRef.current - 2;
    prevScrollYRef.current = scrollY;

    if (scrollY >= s0 * 0.2 || (scrollingUp && scrollY > 0)) {
      scrollEngagedRef.current = true;
      shotTweenRef.current?.kill();
    }

    const effective = Math.min(
      1,
      Math.max(
        0,
        computeScrollMappedProgress(
          scrollY,
          stopScrollYs,
          thresholds,
          launchProgress,
          shotProgressRef.current,
          scrollEngagedRef.current,
        ),
      ),
    );

    const drawn = totalLength * effective;
    applyDash(Math.max(0, totalLength - drawn));

    if (tipEl && totalLength > 0 && typeof pathEl.getPointAtLength === 'function') {
      if (drawn <= 2) {
        const pt = pathEl.getPointAtLength(0);
        const nextPt = pathEl.getPointAtLength(Math.min(totalLength, 4));
        const angle = (Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * 180) / Math.PI;
        gsap.set(tipEl, { x: pt.x, y: pt.y, rotation: angle, opacity: 1 });
      } else {
        const pt = pathEl.getPointAtLength(drawn);
        const prevPt = pathEl.getPointAtLength(Math.max(0, drawn - 3));
        const angle = (Math.atan2(pt.y - prevPt.y, pt.x - prevPt.x) * 180) / Math.PI;
        gsap.set(tipEl, { x: pt.x, y: pt.y, rotation: angle, opacity: 1 });
      }
    }

    updateLitStops(effective, thresholds, launchProgress, false);
  }, [updateLitStops]);

  const recomputePath = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    const originEl = container.querySelector<HTMLElement>('[data-arrow-origin="true"]');
    const stopEls = Array.from(container.querySelectorAll<HTMLElement>('[data-waypoint-stop]'));
    if (!originEl || stopEls.length === 0) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const width = Math.max(1, Math.round(cRect.width));
    const height = Math.max(container.scrollHeight, Math.round(cRect.height));

    const toPoint = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - cRect.left,
        y: r.top + r.height / 2 - cRect.top,
      };
    };

    const originPt = toPoint(originEl);
    const stopPts = stopEls.map(toPoint);

    const launchPt = isMobile
      ? {
          x: Math.min(width - 42, originPt.x + Math.max(105, width * 0.36)),
          y: originPt.y - 10,
        }
      : {
          x: Math.min(width - 72, originPt.x + Math.max(280, width * 0.36)),
          y: originPt.y - Math.round(Math.min(20, width * 0.012)),
        };

    const d = buildBowAndCurvePath(originPt, launchPt, stopPts, isMobile);

    const lightSections = Array.from(
      container.querySelectorAll<HTMLElement>('[data-scene][data-section-mode="light"]'),
    );
    const lightBands = lightSections.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        y: Math.max(0, r.top - cRect.top),
        height: r.height,
      };
    });

    const lastPt = stopPts[stopPts.length - 1];
    setGeometry({
      d,
      width,
      height,
      isMobile,
      lightBands,
      launchPt,
      stopDocYs: stopPts.map((pt) => pt.y),
      endX: lastPt.x,
      endY: lastPt.y,
      endAngle: 90,
    });
  }, [containerRef]);

  // Measure path length, launchPt progress, and waypoint thresholds whenever `d` updates
  useEffect(() => {
    const pathEl = pathRef.current;
    const container = containerRef.current;
    if (!pathEl || !container || !geometry.d) return;

    const stopEls = Array.from(container.querySelectorAll<HTMLElement>('[data-waypoint-stop]'));
    const cRect = container.getBoundingClientRect();

    let totalLength = 0;
    if (typeof pathEl.getTotalLength === 'function') {
      totalLength = pathEl.getTotalLength();
    }

    const launchProgress =
      totalLength > 0 && geometry.launchPt
        ? Math.max(0.04, findClosestProgress(pathEl, totalLength, geometry.launchPt))
        : 0.1;

    const thresholds =
      totalLength > 0 && stopEls.length > 0
        ? stopEls.map((el) => {
            const r = el.getBoundingClientRect();
            return findClosestProgress(pathEl, totalLength, {
              x: r.left + r.width / 2 - cRect.left,
              y: r.top + r.height / 2 - cRect.top,
            });
          })
        : [0.28, 0.48, 0.68, 0.85, 1];

    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const stopScrollYs = geometry.stopDocYs.map((docY, idx) =>
      Math.max(120, Math.round(docY - vh * (idx === 4 ? 0.36 : 0.48))),
    );

    let endX = geometry.endX;
    let endY = geometry.endY;
    let endAngle = 90;
    if (totalLength > 2 && typeof pathEl.getPointAtLength === 'function') {
      const tip = pathEl.getPointAtLength(totalLength);
      const prev = pathEl.getPointAtLength(totalLength - 3);
      endX = tip.x;
      endY = tip.y;
      endAngle = (Math.atan2(tip.y - prev.y, tip.x - prev.x) * 180) / Math.PI;
    }

    metricsRef.current = {
      totalLength,
      thresholds,
      stopScrollYs,
      launchProgress,
      endX,
      endY,
      endAngle,
      reducedMotion,
    };

    syncVisuals();
    ScrollTrigger.refresh();
    container.dataset.scrolltriggerCount = String(ScrollTrigger.getAll().length);
  }, [
    containerRef,
    geometry.d,
    geometry.endX,
    geometry.endY,
    geometry.launchPt,
    geometry.stopDocYs,
    reducedMotion,
    syncVisuals,
  ]);

  // Animate the single arrow straight out from Rama's bow when fired at the top
  useEffect(() => {
    if (reducedMotion || !hasShot || scrollEngagedRef.current) return;

    const target = metricsRef.current.launchProgress || 0.1;
    if (shotProgressRef.current >= target) {
      syncVisuals();
      return;
    }

    const proxy = { p: shotProgressRef.current };
    shotTweenRef.current?.kill();
    shotTweenRef.current = gsap.to(proxy, {
      p: target,
      duration: 0.55,
      ease: 'power2.out',
      onUpdate: () => {
        if (scrollEngagedRef.current) return;
        shotProgressRef.current = proxy.p;
        syncVisuals();
      },
      onComplete: () => {
        if (scrollEngagedRef.current) return;
        shotProgressRef.current = target;
        syncVisuals();
      },
    });

    return () => {
      shotTweenRef.current?.kill();
    };
  }, [hasShot, reducedMotion, syncVisuals]);

  // Sync smoothly on every native scroll, Lenis frame, resize, and ScrollTrigger update
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    recomputePath();

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        recomputePath();
      }, 150);
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        onResize();
      });
      ro.observe(container);
    }

    if (reducedMotion) {
      return () => {
        window.clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
        ro?.disconnect();
      };
    }

    const onScroll = () => {
      syncVisuals();
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const stop5El = container.querySelector<HTMLElement>('[data-waypoint-stop="5"]');
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        id: 'arrows-path-scroll',
        trigger: container,
        start: 'top top',
        endTrigger: stop5El ?? container,
        end: stop5El ? 'center 38%' : 'bottom bottom',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: () => {
          syncVisuals();
        },
      });
    }, container);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('scroll', onScroll);
      ro?.disconnect();
      ctx.revert();
    };
  }, [containerRef, recomputePath, reducedMotion, syncVisuals]);

  const goldWidth = geometry.isMobile ? 4 : 5;
  const edgeWidth = goldWidth + 3; // 1.5px dark-brown casing on each side of gold path in light scenes

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      <svg
        role="img"
        aria-label={COPY.pathOverlay.ariaLabel}
        width={geometry.width}
        height={geometry.height}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        preserveAspectRatio="xMinYMin meet"
        style={{ width: `${geometry.width}px`, height: `${geometry.height}px` }}
        className="block"
      >
        <defs>
          <filter id={glowId} x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#F4A21B" floodOpacity="0.65" />
          </filter>
          <clipPath id={lightClipId}>
            {geometry.lightBands.map((band, idx) => (
              <rect
                key={idx}
                x={0}
                y={band.y}
                width={geometry.width}
                height={band.height}
              />
            ))}
          </clipPath>
        </defs>

        {geometry.d && (
          <>
            {/* Visible dotted ahead guide at 35% opacity */}
            <path
              data-arrows-guide="true"
              d={geometry.d}
              fill="none"
              stroke="#C9972C"
              strokeOpacity="0.35"
              strokeWidth={geometry.isMobile ? 3 : 4}
              strokeDasharray="4 10"
              strokeLinecap="round"
            />
            {/* Thin 1.5px dark-brown edge ONLY in light scenes */}
            <path
              ref={brownEdgeRef}
              d={geometry.d}
              fill="none"
              stroke="#4A250E"
              strokeOpacity="0.88"
              strokeWidth={edgeWidth}
              strokeLinecap="round"
              clipPath={geometry.lightBands.length > 0 ? `url(#${lightClipId})` : undefined}
            />
            {/* Drawn warm gold path (5px desktop / 4px phone) with soft glow */}
            <path
              ref={pathRef}
              data-arrows-path="true"
              d={geometry.d}
              fill="none"
              stroke="#F4A21B"
              strokeWidth={goldWidth}
              strokeLinecap="round"
              filter={`url(#${glowId})`}
            />
          </>
        )}
      </svg>

      {/* Single unified glowing golden arrow riding the path */}
      <div
        ref={tipRef}
        data-arrow-tip="true"
        className="pointer-events-none absolute left-0 top-0 -ml-[56px] -mt-[14px] w-[56px] h-[28px]"
        style={{
          transformOrigin: '100% 50%',
          filter: 'drop-shadow(0 0 8px rgba(244, 162, 27, 0.78))',
        }}
      >
        <svg viewBox="0 0 56 28" className="w-full h-full overflow-visible" fill="none">
          <path
            d="M4 14H41"
            stroke="#3B1D0A"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />
          <path
            d="M4 14H41"
            stroke="#F4A21B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M3 10L10 14L3 18"
            stroke="#F4A21B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M35 5.5L55 14L35 22.5L40.5 14Z"
            fill="#F4A21B"
            stroke="#3B1D0A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
