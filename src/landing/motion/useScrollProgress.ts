import { useEffect, useState, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from './useReducedMotion';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollProgressOptions {
  start?: string;
  end?: string;
  scrub?: boolean | number;
  disabled?: boolean;
}

export function useScrollProgress(
  ref: RefObject<HTMLElement | null>,
  options: ScrollProgressOptions = {},
): number {
  const {
    start = 'top top',
    end = 'bottom top',
    scrub = 0.75,
    disabled = false,
  } = options;
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled || reducedMotion) {
      setProgress(0);
      return;
    }

    let lastValue = -1;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: element,
        start,
        end,
        scrub,
        onUpdate: (self) => {
          const rounded = Math.round(self.progress * 200) / 200;
          if (rounded !== lastValue) {
            lastValue = rounded;
            setProgress(self.progress);
          }
        },
      });
    }, element);

    return () => {
      ctx.revert();
    };
  }, [ref, start, end, scrub, disabled, reducedMotion]);

  return progress;
}
