import { useEffect, useRef, useState } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  bornAt: number;
}

const TRAIL_LIFETIME_MS = 420;
const MAX_POINTS = 28;

export function MouseTrailCanvas({ reducedMotion }: { reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') {
      setEnabled(false);
      return;
    }

    const evaluateEligibility = () => {
      const finePointer =
        typeof window.matchMedia === 'function'
          ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
          : true;
      setEnabled(finePointer && window.innerWidth >= 768);
    };

    evaluateEligibility();
    window.addEventListener('resize', evaluateEligibility, { passive: true });
    return () => window.removeEventListener('resize', evaluateEligibility);
  }, [reducedMotion]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const points: TrailPoint[] = [];
    let rafId = 0;
    let dpr = 1;

    const syncSize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(window.innerWidth * dpr));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * dpr));
    };

    syncSize();
    window.addEventListener('resize', syncSize, { passive: true });

    const drawFrame = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      while (points.length > 0 && now - points[0].bornAt > TRAIL_LIFETIME_MS) {
        points.shift();
      }

      if (points.length < 2) {
        rafId = 0;
        return;
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < points.length; i += 1) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const ageRatio = 1 - (now - p1.bornAt) / TRAIL_LIFETIME_MS;
        if (ageRatio <= 0) continue;

        const progress = i / points.length;
        const alpha = Math.max(0, Math.min(1, ageRatio * progress * 0.72));

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(244, 162, 27, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.5 + progress * 3.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(255, 246, 227, ${(alpha * 0.55).toFixed(3)})`;
        ctx.lineWidth = 0.8 + progress * 1.2;
        ctx.stroke();
      }

      rafId = window.requestAnimationFrame(drawFrame);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now();
      const last = points[points.length - 1];
      if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 3) return;

      points.push({ x: e.clientX, y: e.clientY, bornAt: now });
      if (points.length > MAX_POINTS) {
        points.shift();
      }
      if (!rafId) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('resize', syncSize);
      window.removeEventListener('pointermove', onPointerMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-mouse-trail="true"
      className="pointer-events-none fixed inset-0 z-[25] w-full h-full"
    />
  );
}
