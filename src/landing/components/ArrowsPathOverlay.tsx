import { useCallback, useEffect, useId, useRef, useState, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COPY } from '../content/copy';

gsap.registerPlugin(ScrollTrigger);

interface ArrowsPathOverlayProps {
  containerRef: RefObject<HTMLDivElement | null>;
  reducedMotion: boolean;
  onActiveStopsChange: (litStops: boolean[]) => void;
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
  thresholds: number[];
  endX: number;
  endY: number;
  endAngle: number;
}

function buildCurvePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const dy = curr.y - prev.y;
    const c1x = prev.x;
    const c1y = prev.y + dy * 0.45;
    const c2x = curr.x;
    const c2y = curr.y - dy * 0.45;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  return d;
}

function findClosestProgress(
  pathEl: SVGPathElement,
  totalLength: number,
  target: { x: number; y: number },
): number {
  if (totalLength <= 0 || typeof pathEl.getPointAtLength !== 'function') return 1;
  const samples = 140;
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

export function ArrowsPathOverlay({
  containerRef,
  reducedMotion,
  onActiveStopsChange,
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
    thresholds: [0.18, 0.36, 0.56, 0.76, 0.96],
    endX: 0,
    endY: 0,
    endAngle: 90,
  });

  const metricsRef = useRef<{
    totalLength: number;
    thresholds: number[];
    endX: number;
    endY: number;
    endAngle: number;
    reducedMotion: boolean;
  }>({
    totalLength: 0,
    thresholds: [0.18, 0.36, 0.56, 0.76, 0.96],
    endX: 0,
    endY: 0,
    endAngle: 90,
    reducedMotion,
  });

  const lastLitMaskRef = useRef<string>('');
  const onActiveStopsChangeRef = useRef(onActiveStopsChange);
  onActiveStopsChangeRef.current = onActiveStopsChange;

  const updateLitStops = useCallback((progress: number, thresholds: number[], isReduced: boolean) => {
    const next = isReduced
      ? thresholds.map(() => true)
      : thresholds.map((t) => progress >= Math.max(0.02, t - 0.015));
    const mask = next.map((b) => (b ? '1' : '0')).join('');
    if (mask !== lastLitMaskRef.current) {
      lastLitMaskRef.current = mask;
      onActiveStopsChangeRef.current(next);
    }
  }, []);

  const recomputePath = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    const originEl = container.querySelector<HTMLElement>('[data-arrow-origin="true"]');
    const stopEls = Array.from(container.querySelectorAll<HTMLElement>('[data-waypoint-stop]'));
    if (!originEl || stopEls.length === 0) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const toPoint = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - cRect.left,
        y: r.top + r.height / 2 - cRect.top,
      };
    };

    const allPoints = [toPoint(originEl), ...stopEls.map(toPoint)];
    const d = buildCurvePath(allPoints);
    const width = Math.max(1, Math.round(cRect.width));
    const height = Math.max(container.scrollHeight, Math.round(cRect.height));

    // Record light-section vertical bands so dark-brown 1.5px casing renders ONLY in light scenes
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

    const lastPt = allPoints[allPoints.length - 1];
    setGeometry({
      d,
      width,
      height,
      isMobile,
      lightBands,
      thresholds: metricsRef.current.thresholds,
      endX: lastPt.x,
      endY: lastPt.y,
      endAngle: 90,
    });
  }, [containerRef]);

  // Measure path length & waypoint progress thresholds whenever path `d` updates
  useEffect(() => {
    const pathEl = pathRef.current;
    const brownEl = brownEdgeRef.current;
    const container = containerRef.current;
    if (!pathEl || !container || !geometry.d) return;

    const stopEls = Array.from(container.querySelectorAll<HTMLElement>('[data-waypoint-stop]'));
    const cRect = container.getBoundingClientRect();

    let totalLength = 0;
    if (typeof pathEl.getTotalLength === 'function') {
      totalLength = pathEl.getTotalLength();
    }

    const thresholds =
      totalLength > 0 && stopEls.length > 0
        ? stopEls.map((el) => {
            const r = el.getBoundingClientRect();
            return findClosestProgress(pathEl, totalLength, {
              x: r.left + r.width / 2 - cRect.left,
              y: r.top + r.height / 2 - cRect.top,
            });
          })
        : [0.18, 0.36, 0.56, 0.76, 0.96];

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
      endX,
      endY,
      endAngle,
      reducedMotion,
    };

    const applyDash = (offset: number) => {
      pathEl.style.strokeDasharray = `${totalLength}`;
      pathEl.style.strokeDashoffset = `${offset}`;
      if (brownEl) {
        brownEl.style.strokeDasharray = `${totalLength}`;
        brownEl.style.strokeDashoffset = `${offset}`;
      }
    };

    if (reducedMotion) {
      applyDash(0);
      if (tipRef.current) {
        gsap.set(tipRef.current, { x: endX, y: endY, rotation: endAngle, opacity: 1 });
      }
      updateLitStops(1, thresholds, true);
    } else {
      const st = ScrollTrigger.getById('arrows-path-scroll');
      const progress = st ? st.progress : 0;
      const drawn = totalLength * progress;
      applyDash(Math.max(0, totalLength - drawn));

      if (tipRef.current && totalLength > 0 && typeof pathEl.getPointAtLength === 'function') {
        const pt = pathEl.getPointAtLength(drawn);
        const prevPt = pathEl.getPointAtLength(Math.max(0, drawn - 3));
        const angle =
          drawn > 2
            ? (Math.atan2(pt.y - prevPt.y, pt.x - prevPt.x) * 180) / Math.PI
            : 90;
        gsap.set(tipRef.current, { x: pt.x, y: pt.y, rotation: angle, opacity: 1 });
      }
      updateLitStops(progress, thresholds, false);
    }

    ScrollTrigger.refresh();
    container.dataset.scrolltriggerCount = String(ScrollTrigger.getAll().length);
  }, [containerRef, geometry.d, geometry.endX, geometry.endY, reducedMotion, updateLitStops]);

  // Persistent single ScrollTrigger tied to container scroll; debounced resize rebuilds SVG path cleanly without extra triggers
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

    if (reducedMotion) {
      return () => {
        window.clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
      };
    }

    const stop5El = container.querySelector<HTMLElement>('[data-waypoint-stop="5"]');
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        id: 'arrows-path-scroll',
        trigger: container,
        start: 'top top',
        endTrigger: stop5El ?? container,
        end: stop5El ? 'center 38%' : 'bottom bottom',
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const pathEl = pathRef.current;
          const brownEl = brownEdgeRef.current;
          const tipEl = tipRef.current;
          const { totalLength, thresholds } = metricsRef.current;
          if (!pathEl || totalLength <= 0) return;

          const p = Math.min(Math.max(self.progress, 0), 1);
          const dist = totalLength * p;
          const dashOffset = `${Math.max(0, totalLength - dist)}`;
          pathEl.style.strokeDashoffset = dashOffset;
          if (brownEl) {
            brownEl.style.strokeDashoffset = dashOffset;
          }

          if (tipEl && typeof pathEl.getPointAtLength === 'function') {
            const pt = pathEl.getPointAtLength(dist);
            const prevPt = pathEl.getPointAtLength(Math.max(0, dist - 3));
            const angle =
              dist > 2
                ? (Math.atan2(pt.y - prevPt.y, pt.x - prevPt.x) * 180) / Math.PI
                : 90;
            gsap.set(tipEl, { x: pt.x, y: pt.y, rotation: angle, opacity: 1 });
          }

          updateLitStops(p, thresholds, false);
        },
      });
    }, container);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      ctx.revert();
    };
  }, [containerRef, recomputePath, reducedMotion, updateLitStops]);

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
        className="w-full h-full block"
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

      {/* Leading ~56px glowing arrowhead and shaft riding along path tangent */}
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
          {/* Dark outline for clarity against sky & light hills */}
          <path
            d="M4 14H41"
            stroke="#3B1D0A"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeOpacity="0.6"
          />
          {/* Glowing gold shaft */}
          <path
            d="M4 14H41"
            stroke="#F4A21B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Subtle tail fletching */}
          <path
            d="M3 10L10 14L3 18"
            stroke="#F4A21B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Pointed golden arrowhead */}
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
