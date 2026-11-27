import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface HeroBowOverlayProps {
  reducedMotion: boolean;
  hasShot: boolean;
  onRamaPoseChange: (pose: 'ready' | 'draw') => void;
  onShotStart: (triggeredByScroll: boolean) => void;
  onShotComplete: () => void;
}

export function HeroBowOverlay({
  reducedMotion,
  hasShot,
  onRamaPoseChange,
  onShotStart,
  onShotComplete,
}: HeroBowOverlayProps) {
  const hitboxRef = useRef<HTMLButtonElement | null>(null);
  const flyingArrowRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPull, setDrawPull] = useState(0);
  const [isFlying, setIsFlying] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const shotStartedRef = useRef(hasShot || reducedMotion);
  const flightTweenRef = useRef<gsap.core.Timeline | null>(null);

  const onRamaPoseChangeRef = useRef(onRamaPoseChange);
  onRamaPoseChangeRef.current = onRamaPoseChange;
  const onShotStartRef = useRef(onShotStart);
  onShotStartRef.current = onShotStart;
  const onShotCompleteRef = useRef(onShotComplete);
  onShotCompleteRef.current = onShotComplete;

  const launchArrow = useCallback(
    (triggeredByScroll: boolean) => {
      if (shotStartedRef.current) return;
      shotStartedRef.current = true;
      setIsDrawing(false);
      setDrawPull(0);
      onRamaPoseChangeRef.current('ready');
      onShotStartRef.current(triggeredByScroll);

      if (reducedMotion || typeof window === 'undefined') {
        onShotCompleteRef.current();
        return;
      }

      const arrowEl = flyingArrowRef.current;
      if (!arrowEl) {
        onShotCompleteRef.current();
        return;
      }

      setIsFlying(true);
      flightTweenRef.current?.kill();

      const arcDuration = triggeredByScroll ? 0.36 : 0.78;
      const peakY = triggeredByScroll ? -48 : -96;
      const peakX = triggeredByScroll ? -6 : -14;

      const tl = gsap.timeline({
        onComplete: () => {
          setIsFlying(false);
          onShotCompleteRef.current();
        },
      });

      gsap.set(arrowEl, { x: 0, y: 0, rotation: -32, scale: 0.9, opacity: 1 });
      tl.to(arrowEl, {
        x: peakX,
        y: peakY,
        rotation: -68,
        scale: 1.08,
        duration: arcDuration * 0.45,
        ease: 'power2.out',
      }).to(arrowEl, {
        x: 0,
        y: 0,
        rotation: 86,
        scale: 1,
        duration: arcDuration * 0.55,
        ease: 'power2.in',
      });

      flightTweenRef.current = tl;
    },
    [reducedMotion],
  );

  // Brief draw-and-release sequence for auto-shot, keyboard, or phone tap
  const triggerAutoOrTapShot = useCallback(
    (drawDurationMs = 280) => {
      if (shotStartedRef.current) return;
      setIsDrawing(true);
      setDrawPull(1);
      onRamaPoseChangeRef.current('draw');

      window.setTimeout(() => {
        if (!shotStartedRef.current) {
          launchArrow(false);
        }
      }, drawDurationMs);
    },
    [launchArrow],
  );

  // ~5s auto-shoot timer + immediate shoot if visitor scrolls before shooting
  useEffect(() => {
    if (reducedMotion || hasShot) {
      shotStartedRef.current = true;
      return;
    }

    const autoTimer = window.setTimeout(() => {
      if (!shotStartedRef.current && !dragStartRef.current) {
        triggerAutoOrTapShot(320);
      }
    }, 4800);

    const handleScrollIntent = () => {
      if (shotStartedRef.current) return;
      if (window.scrollY > 10) {
        window.clearTimeout(autoTimer);
        launchArrow(true);
      }
    };

    const handleWheelIntent = (e: WheelEvent) => {
      if (shotStartedRef.current) return;
      if (e.deltaY > 4) {
        window.clearTimeout(autoTimer);
        launchArrow(true);
      }
    };

    window.addEventListener('scroll', handleScrollIntent, { passive: true });
    window.addEventListener('wheel', handleWheelIntent, { passive: true });

    return () => {
      window.clearTimeout(autoTimer);
      window.removeEventListener('scroll', handleScrollIntent);
      window.removeEventListener('wheel', handleWheelIntent);
    };
  }, [hasShot, launchArrow, reducedMotion, triggerAutoOrTapShot]);

  useEffect(() => {
    return () => {
      flightTweenRef.current?.kill();
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (shotStartedRef.current || reducedMotion) return;

    if (e.pointerType === 'touch') {
      triggerAutoOrTapShot(180);
      return;
    }

    dragStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setIsDrawing(true);
    setDrawPull(0.35);
    onRamaPoseChangeRef.current('draw');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const start = dragStartRef.current;
    if (!start || start.pointerId !== e.pointerId || shotStartedRef.current) return;
    const dx = Math.max(0, start.x - e.clientX);
    const dy = Math.max(0, e.clientY - start.y);
    const dist = Math.hypot(dx, dy);
    const nextPull = Math.min(1, Math.max(0.35, dist / 64));
    setDrawPull(nextPull);
  };

  const handlePointerRelease = (e: React.PointerEvent<HTMLButtonElement>) => {
    const start = dragStartRef.current;
    if (!start || start.pointerId !== e.pointerId) return;
    dragStartRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (!shotStartedRef.current) {
      launchArrow(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (shotStartedRef.current || reducedMotion) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerAutoOrTapShot(220);
    }
  };

  return (
    <>
      {/* Origin glowing bow anchor where the golden path starts */}
      <div
        aria-hidden="true"
        data-arrow-origin="true"
        className={[
          'pointer-events-none absolute left-[35.5%] top-[47%] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300',
          isDrawing
            ? 'w-5 h-5 bg-[#FFF6E3] ring-8 ring-[rgba(244,162,27,0.48)] shadow-[0_0_28px_rgba(244,162,27,0.95)]'
            : 'w-3.5 h-3.5 bg-[var(--c-saffron)] ring-4 ring-[rgba(244,162,27,0.32)] shadow-[0_0_16px_rgba(244,162,27,0.65)]',
        ].join(' ')}
        style={
          isDrawing
            ? { transform: `translate(-50%, -50%) scale(${1 + drawPull * 0.25})` }
            : undefined
        }
      />

      {/* Flying golden arrow arc from Rama's bow into the dawn sky and onto the path */}
      <div
        ref={flyingArrowRef}
        aria-hidden="true"
        data-hero-flying-arrow="true"
        className={[
          'pointer-events-none absolute left-[35.5%] top-[47%] -ml-[56px] -mt-[14px] w-[56px] h-[28px]',
          isFlying ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        style={{
          transformOrigin: '100% 50%',
          filter: 'drop-shadow(0 0 10px rgba(244, 162, 27, 0.9))',
        }}
      >
        <svg viewBox="0 0 56 28" className="w-full h-full overflow-visible" fill="none">
          <path d="M4 14H41" stroke="#3B1D0A" strokeWidth="6.5" strokeLinecap="round" strokeOpacity="0.6" />
          <path d="M4 14H41" stroke="#F4A21B" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M3 10L10 14L3 18" stroke="#FFF6E3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M35 5.5L55 14L35 22.5L40.5 14Z"
            fill="#F4A21B"
            stroke="#3B1D0A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Interactive Rama bow hitbox (desktop drag-back or mobile tap) */}
      {!hasShot && !reducedMotion && (
        <button
          ref={hitboxRef}
          type="button"
          data-hero-bow-trigger="true"
          aria-label="Pull and release Rama's bow to shoot the golden arrow"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerRelease}
          onPointerCancel={handlePointerRelease}
          onKeyDown={handleKeyDown}
          style={{ left: '30%', top: '49%' }}
          className={[
            'pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 w-[13%] min-w-[68px] h-[28%] min-h-[76px] rounded-full bg-transparent border-0 flex items-end justify-center pb-1 transition-transform duration-150 select-none touch-none',
            isDrawing ? 'cursor-grabbing scale-105' : 'cursor-grab',
          ].join(' ')}
        >
          <span
            className={[
              'px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap border backdrop-blur-sm shadow-sm transition-opacity duration-200',
              isDrawing
                ? 'bg-[var(--c-saffron)] border-[#3B1D0A] text-[var(--c-night-0)] opacity-100'
                : 'bg-[rgba(255,254,250,0.88)] border-[rgba(20,56,42,0.28)] text-[var(--c-forest-900)] opacity-95',
            ].join(' ')}
          >
            <span className="max-md:hidden">{isDrawing ? 'Release to shoot' : 'Pull bow'}</span>
            <span className="md:hidden">Tap bow</span>
          </span>
        </button>
      )}
    </>
  );
}
