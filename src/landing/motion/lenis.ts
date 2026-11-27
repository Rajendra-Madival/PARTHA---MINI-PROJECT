import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let activeLenis: Lenis | null = null;

export function getLenis(): Lenis | null {
  return activeLenis;
}

export function scrollToTarget(target: string | HTMLElement): void {
  if (activeLenis) {
    activeLenis.scrollTo(target, { offset: 0, duration: 1.1 });
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
    };
  }

  const lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
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
  };
}
