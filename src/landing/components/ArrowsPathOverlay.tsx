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

interface PathGeometry {
  d: string;
  width: number;
  height: number;
  thresholds: number[];
  endX: number;
  endY: number;
  endAngle: number;
}

function buildCurvePath(points: Array<{ x: number; y: number }>, isMobile: boolean): string {
  if (points.length === 0) return '';
  if (isMobile) {
    const railX = points[0].x;
    const lastY = points[points.length - 1].y;
    return `M ${railX.toFixed(1)} ${points[0].y.toFixed(1)} L ${railX.toFixed(1)} ${lastY.toFixed(1)}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const dy = curr.y - prev.y;
    const c1x = prev.x;
    const c1y = prev.y + dy * 0.48;
    const c2x = curr.x;
    const c2y = curr.y - dy * 0.48;
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
  const tipRef = useRef<HTMLDivElement | null>(null);
  const filterId = useId();

  const [geometry, setGeometry] = useState<PathGeometry>({
    d: '',
    width: 1440,
    height: 4000,
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

    const stopPoints = stopEls.map(toPoint);
    const originPoint = isMobile
      ? { x: stopPoints[0].x, y: toPoint(originEl).y }
      : toPoint(originEl);

    const allPoints = [originPoint, ...stopPoints];
    const d = buildCurvePath(allPoints, isMobile);
    const width = Math.max(container.scrollWidth, Math.round(cRect.width));
    const height = Math.max(container.scrollHeight, Math.round(cRect.height));

    setGeometry({
      d,
      width,
      height,
      thresholds: metricsRef.current.thresholds,
      endX: stopPoints[stopPoints.length - 1].x,
      endY: stopPoints[stopPoints.length - 1].y,
      endAngle: 90,
    });
  }, [containerRef]);

  // Measure path length & waypoint progress thresholds whenever path `d` updates
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

    if (reducedMotion) {
      pathEl.style.strokeDasharray = `${totalLength}`;
      pathEl.style.strokeDashoffset = '0';
      if (tipRef.current) {
        gsap.set(tipRef.current, { x: endX, y: endY, rotation: endAngle, opacity: 1 });
      }
      updateLitStops(1, thresholds, true);
    } else {
      pathEl.style.strokeDasharray = `${totalLength}`;
      const st = ScrollTrigger.getById('arrows-path-scroll');
      const progress = st ? st.progress : 0;
      const drawn = totalLength * progress;
      pathEl.style.strokeDashoffset = `${Math.max(0, totalLength - drawn)}`;

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

  // Persistent single ScrollTrigger tied to container scroll; debounced resize rebuilds SVG path cleanly without creating new ScrollTriggers
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
          const tipEl = tipRef.current;
          const { totalLength, thresholds } = metricsRef.current;
          if (!pathEl || totalLength <= 0) return;

          const p = Math.min(Math.max(self.progress, 0), 1);
          const dist = totalLength * p;
          pathEl.style.strokeDashoffset = `${Math.max(0, totalLength - dist)}`;

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
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#F4A21B" floodOpacity="0.45" />
          </filter>
        </defs>

        {geometry.d && (
          <>
            {/* Faint bronze guide rail visible in both light & dark scenes */}
            <path
              d={geometry.d}
              fill="none"
              stroke="#8C6A3B"
              strokeOpacity="0.3"
              strokeWidth="2.5"
              strokeDasharray="6 8"
              strokeLinecap="round"
            />
            {/* Drawn golden scroll path */}
            <path
              ref={pathRef}
              data-arrows-path="true"
              d={geometry.d}
              fill="none"
              stroke="#D4AF37"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter={`url(#${filterId})`}
            />
          </>
        )}
      </svg>

      {/* Leading arrowhead and short shaft riding along path tangent */}
      <div
        ref={tipRef}
        data-arrow-tip="true"
        className="pointer-events-none absolute left-0 top-0 -ml-10 -mt-2.5 w-10 h-5"
        style={{ transformOrigin: '100% 50%' }}
      >
        <svg viewBox="0 0 40 20" className="w-full h-full overflow-visible" fill="none">
          <path
            d="M2 10H31"
            stroke="#14382A"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
          <path
            d="M2 10H31"
            stroke="#F4A21B"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M25 3.5L39 10L25 16.5L28.5 10Z"
            fill="#F4A21B"
            stroke="#14382A"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
