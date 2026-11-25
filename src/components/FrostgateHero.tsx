import Lenis from 'lenis';
import { useEffect, useRef, type CSSProperties } from 'react';
import type { UserRole } from '../types';

const ASSETS = {
  sky: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_032051_b03be317-55bc-49c0-9643-583fc5604213.png&w=2688&q=85',
  side: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_032150_6a19ddba-1bad-419f-9e29-dca0828c11eb.png&w=2688&q=85',
  stairs:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_050711_a8f1e754-6cb0-4763-b6a4-e7acd19f6d16.png&w=2688&q=85',
  hall: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_032131_a39a98b6-be3d-473c-a0a1-5ad2850557e7.png&w=2688&q=85',
  people:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_050913_015b6505-badf-4834-b44e-dca4af03c966.png&w=2688&q=85',
  larch:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_032234_5b1a89ba-826e-4bdd-9416-0faf5b650f82.png&w=2688&q=85',
  pav: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_032301_6b8aa813-522f-412c-b90d-0bfaf40c7590.png&w=2688&q=85',
  mid: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_032324_f9cb6fb0-9f9d-4f42-adcb-cfeae0e153da.png&w=2688&q=85',
  near: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_032346_c94ad70e-0a0f-4a4e-99f8-39e0200da791.png&w=2688&q=85',
  lake: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_032412_9f658303-9bca-4653-a7e8-7fcb3788f887.png&w=2688&q=85',
  walls:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_032423_d01ee5a9-9ec6-424c-93bb-9972ecf2f3cf.png&w=2688&q=85',
  arch: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_025152_784dec8b-ad51-476d-9e19-dbca11ca8d01.png&w=2688&q=85',
  flags:
    'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261124_032437_291e3d42-e769-437c-abcf-ecf2965a8feb.png&w=2688&q=85',
} as const;

const B_KEY = 0.42;
const H0 = B_KEY;
const H1 = 1 - B_KEY;

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

// Monotone cubic Hermite spline across keyframes A (u=0), B (u=0.42), C (u=1)
function spline(a: number, b: number, c: number, u: number): number {
  const d0 = (b - a) / H0;
  const d1 = (c - b) / H1;
  const mB =
    d0 * d1 > 0 && d0 !== 0 && d1 !== 0
      ? (H0 + H1) / (H0 / d0 + H1 / d1)
      : 0;

  if (u <= B_KEY) {
    const t = u / H0;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * a + (-2 * t3 + 3 * t2) * b + (t3 - t2) * mB * H0;
  }

  const t = (u - B_KEY) / H1;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * b + (t3 - 2 * t2 + t) * mB * H1 + (-2 * t3 + 3 * t2) * c;
}

function setMask(el: HTMLElement | null, value: string): void {
  if (!el) return;
  el.style.maskImage = value;
  el.style.webkitMaskImage = value;
}

function buildSoftBottomGradient(
  fade: number,
  y: number,
  fadeSpeed: number,
  bandTop?: number,
): string {
  const f = fade * Math.min(1, -y * fadeSpeed);
  if (bandTop !== undefined) {
    if (f <= 0.01) {
      return `linear-gradient(to bottom, transparent 0%, transparent ${bandTop}%, #000 ${bandTop + 1.2}%, #000 100%)`;
    }
    return `linear-gradient(to bottom, transparent 0%, transparent ${bandTop}%, #000 ${bandTop + 1.2}%, #000 ${100 - f}%, transparent 100%)`;
  }
  if (f <= 0.01) return 'none';
  return `linear-gradient(to bottom, #000 0%, #000 ${100 - f}%, transparent 100%)`;
}

interface FrostgateHeroProps {
  onSelectPortal: (options: { role?: UserRole; mode?: 'login' | 'register' }) => void;
}

export function FrostgateHero({ onSelectPortal }: FrostgateHeroProps) {
  const diveRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const caveRef = useRef<HTMLDivElement | null>(null);
  const caveInRef = useRef<HTMLDivElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  const skyRef = useRef<HTMLImageElement | null>(null);
  const sideRef = useRef<HTMLImageElement | null>(null);
  const stairsBaseRef = useRef<HTMLImageElement | null>(null);
  const hallRef = useRef<HTMLImageElement | null>(null);
  const stairsBand2Ref = useRef<HTMLImageElement | null>(null);
  const peopleBand2Ref = useRef<HTMLImageElement | null>(null);
  const stairsBand3Ref = useRef<HTMLImageElement | null>(null);
  const peopleBand3Ref = useRef<HTMLImageElement | null>(null);
  const larchLRef = useRef<HTMLImageElement | null>(null);
  const larchRRef = useRef<HTMLImageElement | null>(null);
  const pavRef = useRef<HTMLImageElement | null>(null);
  const midLRef = useRef<HTMLImageElement | null>(null);
  const midRRef = useRef<HTMLImageElement | null>(null);
  const nearLRef = useRef<HTMLImageElement | null>(null);
  const nearRRef = useRef<HTMLImageElement | null>(null);
  const lakeRef = useRef<HTMLImageElement | null>(null);
  const wallsRef = useRef<HTMLImageElement | null>(null);
  const archRef = useRef<HTMLImageElement | null>(null);
  const flagsRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const dive = diveRef.current;
    const frame = frameRef.current;
    const cave = caveRef.current;
    const caveIn = caveInRef.current;
    if (!dive || !frame || !cave || !caveIn) return;

    // Static masks
    setMask(
      peopleBand2Ref.current,
      'linear-gradient(to bottom, transparent 0%, transparent 66.8%, #000 67%, #000 67.8%, transparent 68%, transparent 100%)',
    );
    setMask(
      peopleBand3Ref.current,
      'linear-gradient(to bottom, transparent 0%, transparent 67.5%, #000 68%, #000 100%)',
    );
    setMask(
      flagsRef.current,
      'linear-gradient(to bottom, transparent 1%, #000 13%, #000 100%)',
    );

    const renderScene = (p: number) => {
      const clampedP = clamp(p, 0, 1);
      const u = clamp((clampedP - 0.03) / 0.94, 0, 1);

      // Frame vertical pan on tall viewports
      const spare = window.innerHeight - frame.offsetHeight;
      const panY = spare < 0 ? spare * 0.6 * spline(0, 1, 1, u) : 0;
      frame.style.transform = `translate3d(-50%, ${panY}px, 0)`;

      // Sky
      const ySky = spline(0, 0, -0.12, u);
      if (skyRef.current) {
        skyRef.current.style.transform = `translate3d(0, ${ySky * 100}%, 0)`;
      }

      // Side halls
      const ySide = spline(0, -0.15, -0.6, u);
      if (sideRef.current) {
        sideRef.current.style.transform = `translate3d(0, ${ySide * 100}%, 0)`;
        setMask(sideRef.current, buildSoftBottomGradient(10, ySide, 6));
      }

      // Base stairs & Hall
      const yBase = spline(0, -0.1, -0.6, u);
      if (stairsBaseRef.current) {
        stairsBaseRef.current.style.transform = `translate3d(0, ${yBase * 100}%, 0)`;
      }
      if (hallRef.current) {
        hallRef.current.style.transform = `translate3d(0, ${yBase * 100}%, 0)`;
      }

      // Band 2 (stairs + people)
      const yBand2 = spline(0, -0.15, -0.63, u);
      if (stairsBand2Ref.current) {
        stairsBand2Ref.current.style.transform = `translate3d(0, ${yBand2 * 100}%, 0)`;
        setMask(stairsBand2Ref.current, buildSoftBottomGradient(5, yBand2, 40, 66));
      }
      if (peopleBand2Ref.current) {
        peopleBand2Ref.current.style.transform = `translate3d(0, ${yBand2 * 100}%, 0)`;
      }

      // Band 3 (stairs + people)
      const yBand3 = spline(0, -0.2, -0.66, u);
      if (stairsBand3Ref.current) {
        stairsBand3Ref.current.style.transform = `translate3d(0, ${yBand3 * 100}%, 0)`;
        setMask(stairsBand3Ref.current, buildSoftBottomGradient(7, yBand3, 30, 72));
      }
      if (peopleBand3Ref.current) {
        peopleBand3Ref.current.style.transform = `translate3d(0, ${yBand3 * 100}%, 0)`;
      }

      // Larch (two halves ±7%)
      const yLarch = spline(0, -0.2, -0.8, u);
      const larchMask = buildSoftBottomGradient(30, yLarch, 6);
      if (larchLRef.current) {
        larchLRef.current.style.transform = `translate3d(-7%, ${yLarch * 100}%, 0)`;
        setMask(larchLRef.current, larchMask);
      }
      if (larchRRef.current) {
        larchRRef.current.style.transform = `translate3d(7%, ${yLarch * 100}%, 0)`;
        setMask(larchRRef.current, larchMask);
      }

      // Pavilions
      const yPav = spline(0, -0.2, -0.85, u);
      if (pavRef.current) {
        pavRef.current.style.transform = `translate3d(0, ${yPav * 100}%, 0)`;
        setMask(pavRef.current, buildSoftBottomGradient(14, yPav, 6));
      }

      // Mid pines (two halves ±5%)
      const yMid = spline(0, -0.27, -0.95, u);
      const midMask = buildSoftBottomGradient(18, yMid, 6);
      if (midLRef.current) {
        midLRef.current.style.transform = `translate3d(-5%, ${yMid * 100}%, 0)`;
        setMask(midLRef.current, midMask);
      }
      if (midRRef.current) {
        midRRef.current.style.transform = `translate3d(5%, ${yMid * 100}%, 0)`;
        setMask(midRRef.current, midMask);
      }

      // Near pines (two halves ±6%)
      const yNear = spline(0, -0.36, -1.2, u);
      const nearMask = buildSoftBottomGradient(34, yNear, 6);
      if (nearLRef.current) {
        nearLRef.current.style.transform = `translate3d(-6%, ${yNear * 100}%, 0)`;
        setMask(nearLRef.current, nearMask);
      }
      if (nearRRef.current) {
        nearRRef.current.style.transform = `translate3d(6%, ${yNear * 100}%, 0)`;
        setMask(nearRRef.current, nearMask);
      }

      // Arch
      const ay = spline(1.0, 0.16, -0.07, u);
      const as = spline(1, 1, 1.75, u);
      if (archRef.current) {
        archRef.current.style.transform = `translate3d(0, ${ay * 100}%, 0) scale(${as})`;
        if (u > B_KEY) {
          const tC = clamp((u - B_KEY) / 0.58, 0, 1);
          const fb = 26 * clamp(tC / 0.35, 0, 1);
          setMask(
            archRef.current,
            `linear-gradient(to bottom, #000 0%, #000 ${100 - fb}%, transparent 100%)`,
          );
        } else {
          setMask(archRef.current, 'none');
        }
      }

      // Cave interior
      const cy = spline(0.22, 0.2, 0, u);
      const cs = spline(0.8, 0.8, 1, u);
      caveIn.style.transform = `translate3d(0, ${cy * 100}%, 0) scale(${cs})`;

      // Cave opening reveal mask tied to arch opening line (0.6 inside arch image)
      const seal = (1 + (0.6 - 1) * as + ay) * 100;
      const feather = 11 * as;
      if (seal - feather >= 100) {
        cave.style.visibility = 'hidden';
      } else {
        cave.style.visibility = 'visible';
        setMask(
          cave,
          `linear-gradient(to bottom, transparent ${seal - feather}%, #000 ${seal}%)`,
        );
      }

      // Prayer flags
      const yFlags = spline(0.14, 0.14, 0, u);
      const opacityFlags = clamp((u - 0.55) / (0.9 - 0.55), 0, 1);
      if (flagsRef.current) {
        flagsRef.current.style.transform = `translate3d(0, ${yFlags * 100}%, 0)`;
        flagsRef.current.style.opacity = String(opacityFlags);
      }
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reducedMotion = motionQuery.matches;

    let cancelled = false;
    let rafId = 0;
    let failsafeTimer: ReturnType<typeof setTimeout> | null = null;
    let lenis: Lenis | null = null;
    let lastP = -1;

    const allImages = [
      skyRef.current,
      sideRef.current,
      stairsBaseRef.current,
      hallRef.current,
      stairsBand2Ref.current,
      peopleBand2Ref.current,
      stairsBand3Ref.current,
      peopleBand3Ref.current,
      larchLRef.current,
      larchRRef.current,
      pavRef.current,
      midLRef.current,
      midRRef.current,
      nearLRef.current,
      nearRRef.current,
      lakeRef.current,
      wallsRef.current,
      archRef.current,
      flagsRef.current,
    ].filter((img): img is HTMLImageElement => Boolean(img));

    const decodeAll = Promise.allSettled(
      allImages.map((img) => img.decode().catch(() => undefined)),
    );
    const timeoutPromise = new Promise<void>((resolve) => {
      failsafeTimer = setTimeout(resolve, 5000);
    });

    const handleResize = () => {
      if (reducedMotion) {
        renderScene(0.42);
      } else {
        const range = dive.offsetHeight - window.innerHeight;
        const currentScroll = lenis ? lenis.scroll : window.scrollY;
        const nextP = range > 0 ? clamp((currentScroll - dive.offsetTop) / range, 0, 1) : 0;
        lastP = nextP;
        renderScene(nextP);
      }
    };

    window.addEventListener('resize', handleResize);

    if (reducedMotion) {
      document.documentElement.classList.add('ready');
      renderScene(0.42);
    } else {
      renderScene(0);
      lastP = 0;

      void Promise.race([decodeAll, timeoutPromise]).then(() => {
        if (cancelled) return;
        document.documentElement.classList.add('ready');

        const instance = new Lenis({
          lerp: 0.085,
          wheelMultiplier: 0.9,
          smoothWheel: true,
        });
        lenis = instance;
        lenisRef.current = instance;

        renderScene(0);

        const tick = (now: number) => {
          if (cancelled) return;
          instance.raf(now);
          const range = dive.offsetHeight - window.innerHeight;
          const nextP =
            range > 0 ? clamp((instance.scroll - dive.offsetTop) / range, 0, 1) : 0;
          if (Math.abs(nextP - lastP) > 0.00001) {
            lastP = nextP;
            renderScene(nextP);
          }
          rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
      });
    }

    return () => {
      cancelled = true;
      if (failsafeTimer) clearTimeout(failsafeTimer);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      if (lenis) {
        lenis.destroy();
      }
      lenisRef.current = null;
      document.documentElement.classList.remove('ready');
    };
  }, []);

  function scrollToSection(
    target: string | number,
    portalOptions?: { role?: UserRole; mode?: 'login' | 'register' },
  ) {
    if (portalOptions) {
      onSelectPortal(portalOptions);
    }
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.2 });
    } else if (typeof target === 'string') {
      document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  }

  return (
    <main className="dive" id="dive" ref={diveRef}>
      <div className="stage">
        <div className="card" id="card">
          <div className="frame" id="frame" ref={frameRef}>
            {/* 1. sky */}
            <img
              ref={skyRef}
              src={ASSETS.sky}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
            />
            {/* 2. side halls */}
            <img
              ref={sideRef}
              src={ASSETS.side}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
            />
            {/* 3. stairs (base, full image) */}
            <img
              ref={stairsBaseRef}
              src={ASSETS.stairs}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
            />
            {/* 4. hall */}
            <img
              ref={hallRef}
              src={ASSETS.hall}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
            />
            {/* 5. stairs band 2 */}
            <img
              ref={stairsBand2Ref}
              src={ASSETS.stairs}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
            />
            {/* 6. people band 2 */}
            <img
              ref={peopleBand2Ref}
              src={ASSETS.people}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
            />
            {/* 7. stairs band 3 */}
            <img
              ref={stairsBand3Ref}
              src={ASSETS.stairs}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
            />
            {/* 8. people band 3 */}
            <img
              ref={peopleBand3Ref}
              src={ASSETS.people}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
            />
            {/* 9–10. larch (two halves) */}
            <img
              ref={larchLRef}
              src={ASSETS.larch}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
            <img
              ref={larchRRef}
              src={ASSETS.larch}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
              style={{ clipPath: 'inset(0 0 0 50%)' }}
            />
            {/* 11. pav */}
            <img
              ref={pavRef}
              src={ASSETS.pav}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
            />
            {/* 12–13. mid pines (two halves) */}
            <img
              ref={midLRef}
              src={ASSETS.mid}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
            <img
              ref={midRRef}
              src={ASSETS.mid}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
              style={{ clipPath: 'inset(0 0 0 50%)' }}
            />
            {/* 14–15. near pines (two halves) */}
            <img
              ref={nearLRef}
              src={ASSETS.near}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
            <img
              ref={nearRRef}
              src={ASSETS.near}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
              style={{ clipPath: 'inset(0 0 0 50%)' }}
            />
            {/* 16–17. cave (lake inside cave-in, walls after cave-in) */}
            <div className="cave" ref={caveRef}>
              <div className="cave-in" ref={caveInRef}>
                <img
                  ref={lakeRef}
                  src={ASSETS.lake}
                  alt=""
                  decoding="async"
                  draggable={false}
                  className="layer"
                />
              </div>
              <img
                ref={wallsRef}
                src={ASSETS.walls}
                alt=""
                decoding="async"
                draggable={false}
                className="layer"
              />
            </div>
            {/* 18. arch */}
            <img
              ref={archRef}
              src={ASSETS.arch}
              alt=""
              decoding="async"
              draggable={false}
              className="layer layer-arch"
            />
            {/* 19. flags */}
            <img
              ref={flagsRef}
              src={ASSETS.flags}
              alt=""
              decoding="async"
              draggable={false}
              className="layer"
            />
          </div>

          <nav className="nav" aria-label="Main">
            <button
              type="button"
              className="nav-link"
              style={{ '--nav-i': 0 } as CSSProperties}
              onClick={() =>
                scrollToSection('#auth-portal', { role: 'student', mode: 'login' })
              }
            >
              STUDENT
            </button>
            <button
              type="button"
              className="nav-link"
              style={{ '--nav-i': 1 } as CSSProperties}
              onClick={() =>
                scrollToSection('#auth-portal', { role: 'alumni', mode: 'login' })
              }
            >
              ALUMNI
            </button>
            <button
              type="button"
              className="nav-link"
              style={{ '--nav-i': 2 } as CSSProperties}
              onClick={() =>
                scrollToSection('#auth-portal', { role: 'admin', mode: 'login' })
              }
            >
              ADMIN
            </button>
            <button
              type="button"
              className="nav-logo"
              aria-label="PARTHA home"
              style={{ '--nav-i': 3 } as CSSProperties}
              onClick={() => scrollToSection(0)}
            >
              <svg
                viewBox="0 0 48 22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 21 L15 4 L24 14 L31 7 L47 21" />
                <path d="M10 21 L15 15 L19 21" />
                <path d="M27 21 L31 16 L36 21" />
              </svg>
            </button>
            <button
              type="button"
              className="nav-link"
              style={{ '--nav-i': 4 } as CSSProperties}
              onClick={() =>
                scrollToSection('#auth-portal', { role: 'student', mode: 'register' })
              }
            >
              REGISTER
            </button>
            <button
              type="button"
              className="nav-link"
              style={{ '--nav-i': 5 } as CSSProperties}
              onClick={() => scrollToSection('#auth-portal', { mode: 'login' })}
            >
              SIGN IN
            </button>
            <button
              type="button"
              className="nav-link"
              style={{ '--nav-i': 6 } as CSSProperties}
              onClick={() => scrollToSection('#auth-portal')}
            >
              PORTAL
            </button>
          </nav>
        </div>
      </div>
    </main>
  );
}
