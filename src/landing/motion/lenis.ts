import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let activeLenis: Lenis | null = null;

export interface ScrollTargetOptions {
  duration?: number;
  offset?: number;
}

export function getLenis(): Lenis | null {
  return activeLenis;
}

export function scrollToTarget(
  target: string | HTMLElement | number,
  options: ScrollTargetOptions = {},
): void {
  const { duration = 1.4, offset = 0 } = options;

  if (activeLenis) {
    activeLenis.scrollTo(target, { offset, duration });
    return;
  }

  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: 'auto' });
    return;
  }

  const element =
    typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
  element?.scrollIntoView({ behavior: 'auto', block: 'start' });
}

export function initScrollEngine(reducedMotion: boolean): () => void {
  if (reducedMotion || typeof window === 'undefined') {
    activeLenis = null;
    ScrollTrigger.refresh();
    return () => {
      activeLenis = null;
      for (const trigger of ScrollTrigger.getAll()) {
        trigger.kill();
      }
    };
  }

  const lenis = new Lenis({
    duration: 1.2,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  });

  activeLenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);

  const tick = (time: number) => {
    lenis.raf(time * 1000);
  };

  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.refresh();

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    if (activeLenis === lenis) {
      activeLenis = null;
    }
    for (const trigger of ScrollTrigger.getAll()) {
      trigger.kill();
    }
  };
}
