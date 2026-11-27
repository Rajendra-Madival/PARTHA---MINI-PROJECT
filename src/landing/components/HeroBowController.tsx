import { useCallback, useEffect, useRef, useState } from 'react';

interface HeroBowOverlayProps {
  reducedMotion: boolean;
  hasShot: boolean;
  onRamaPoseChange: (pose: 'ready' | 'draw') => void;
  onShoot: () => void;
}

export function HeroBowOverlay({
  reducedMotion,
  hasShot,
  onRamaPoseChange,
  onShoot,
}: HeroBowOverlayProps) {
  const [isDrawing, setIsDrawing] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const shotFiredRef = useRef(hasShot || reducedMotion);
  const releaseTimerRef = useRef<number | null>(null);

  const onRamaPoseChangeRef = useRef(onRamaPoseChange);
  onRamaPoseChangeRef.current = onRamaPoseChange;
  const onShootRef = useRef(onShoot);
  onShootRef.current = onShoot;

  const fireShot = useCallback(() => {
    if (shotFiredRef.current) return;
    shotFiredRef.current = true;
    setIsDrawing(false);
    onRamaPoseChangeRef.current('ready');
    onShootRef.current();
  }, []);

  const triggerDrawThenFire = useCallback(
    (drawDurationMs = 260) => {
      if (shotFiredRef.current) return;
      setIsDrawing(true);
      onRamaPoseChangeRef.current('draw');

      releaseTimerRef.current = window.setTimeout(() => {
        fireShot();
      }, drawDurationMs);
    },
    [fireShot],
  );

  // ~4.8s automatic shot fallback, or immediate shot on scroll/wheel
  useEffect(() => {
    if (reducedMotion || hasShot) {
      shotFiredRef.current = true;
      return;
    }

    const autoTimer = window.setTimeout(() => {
      if (!shotFiredRef.current && !dragStartRef.current) {
        triggerDrawThenFire(300);
      }
    }, 4800);

    const handleScrollIntent = () => {
      if (shotFiredRef.current) return;
      if (window.scrollY > 8) {
        window.clearTimeout(autoTimer);
        if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
        fireShot();
      }
    };

    const handleWheelIntent = (e: WheelEvent) => {
      if (shotFiredRef.current) return;
      if (e.deltaY > 4) {
        window.clearTimeout(autoTimer);
        if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
        fireShot();
      }
    };

    window.addEventListener('scroll', handleScrollIntent, { passive: true });
    window.addEventListener('wheel', handleWheelIntent, { passive: true });

    return () => {
      window.clearTimeout(autoTimer);
      if (releaseTimerRef.current) window.clearTimeout(releaseTimerRef.current);
      window.removeEventListener('scroll', handleScrollIntent);
      window.removeEventListener('wheel', handleWheelIntent);
    };
  }, [fireShot, hasShot, reducedMotion, triggerDrawThenFire]);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (shotFiredRef.current || reducedMotion) return;

    if (e.pointerType === 'touch') {
      triggerDrawThenFire(180);
      return;
    }

    dragStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDrawing(true);
    onRamaPoseChangeRef.current('draw');
  };

  const handlePointerRelease = (e: React.PointerEvent<HTMLButtonElement>) => {
    const start = dragStartRef.current;
    if (!start || start.pointerId !== e.pointerId) return;
    dragStartRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (!shotFiredRef.current) {
      fireShot();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (shotFiredRef.current || reducedMotion) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerDrawThenFire(220);
    }
  };

  return (
    <>
      {/* Invisible point anchor right at Rama's bowstring tip (single arrow path starts here) */}
      <div
        aria-hidden="true"
        data-arrow-origin="true"
        className="pointer-events-none absolute left-[35.5%] top-[47%] -translate-x-1/2 -translate-y-1/2 w-1 h-1 opacity-0"
      />

      {/* Clean, invisible interactive bow hit area over Rama (no blocking text label) */}
      {!hasShot && !reducedMotion && (
        <button
          type="button"
          data-hero-bow-trigger="true"
          aria-label="Pull and release Rama's bow to shoot the golden arrow"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerRelease}
          onPointerCancel={handlePointerRelease}
          onKeyDown={handleKeyDown}
          style={{ left: '30%', top: '49%' }}
          className={[
            'pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-[13%] min-w-[68px] h-[28%] min-h-[76px] rounded-full bg-transparent border-0 select-none touch-none',
            isDrawing ? 'cursor-grabbing' : 'cursor-grab',
          ].join(' ')}
        />
      )}
    </>
  );
}
