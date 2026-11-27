import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

function setupDomStubs({
  reducedMotion = false,
  width = 1440,
}: {
  reducedMotion?: boolean;
  width?: number;
} = {}) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  if (!('ResizeObserver' in window)) {
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(window, 'ResizeObserver', {
      writable: true,
      value: MockResizeObserver,
    });
  }

  class MockIntersectionObserver {
    private cb: IntersectionObserverCallback;
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb;
    }
    observe(target: Element) {
      this.cb(
        [{ isIntersecting: true, target } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
  });

  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
}

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('Phase V3-3 (Revised): Single Hero arrow, clean V3-2b scenes, and Gate zoom-to-login', () => {
  it('renders only a single arrow tip (no duplicate flying arrow) and fires straight from the bow on auto-timer', async () => {
    vi.useFakeTimers();
    setupDomStubs({ reducedMotion: false, width: 1440 });

    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage />);

    expect(container.querySelectorAll('[data-arrow-tip="true"]')).toHaveLength(1);
    expect(container.querySelector('[data-hero-flying-arrow="true"]')).toBeNull();
    expect(container.querySelector('[data-mouse-trail="true"]')).toBeNull();

    const bowBtn = container.querySelector('[data-hero-bow-trigger="true"]') as HTMLButtonElement;
    expect(bowBtn).not.toBeNull();

    const ramaImg = () => container.querySelector('[data-prop="rama-ready"]') as HTMLImageElement;
    expect(ramaImg().getAttribute('src')).toBe('/landing/art/rama-ready.webp');

    await act(async () => {
      vi.advanceTimersByTime(4850);
    });
    expect(ramaImg().getAttribute('src')).toBe('/landing/art/rama-draw.webp');

    await act(async () => {
      vi.advanceTimersByTime(320);
    });
    expect(ramaImg().getAttribute('src')).toBe('/landing/art/rama-ready.webp');
    expect(container.querySelector('[data-hero-bow-trigger="true"]')).toBeNull();
  });

  it('shoots immediately when visitor scrolls before shooting', async () => {
    setupDomStubs({ reducedMotion: false, width: 1440 });
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage />);

    expect(container.querySelector('[data-hero-bow-trigger="true"]')).not.toBeNull();

    await act(async () => {
      fireEvent.wheel(window, { deltaY: 120 });
    });

    expect(container.querySelector('[data-hero-bow-trigger="true"]')).toBeNull();
  });

  it('keeps sage & chariot visible, removes Kurukshetra wheel & floating boxes, and starts lotus closed', async () => {
    setupDomStubs({ reducedMotion: false, width: 1440 });
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage />);

    const sage = container.querySelector('[data-prop="sage"]') as HTMLElement;
    const chariot = container.querySelector('[data-prop="chariot"]') as HTMLElement;
    expect(sage.className).not.toContain('opacity-0');
    expect(chariot.className).not.toContain('opacity-0');

    expect(container.querySelector('[data-prop="wheel"]')).toBeNull();
    expect(container.querySelector('[data-kurukshetra-torches]')).toBeNull();
    expect(container.querySelector('[data-dawn-scrolls]')).toBeNull();
    expect(container.querySelector('[data-alumni-diya]')).toBeNull();
    expect(container.querySelector('[data-step-card="gate"]')).toBeNull();

    const lotusBud = container.querySelector('[data-prop="lotus-bud"]') as HTMLElement;
    const lotusOpen = container.querySelector('[data-prop="lotus-open"]') as HTMLElement;
    expect(lotusBud.style.opacity).toBe('1');
    expect(lotusOpen.style.opacity).toBe('0');
  });

  it('removes sky buttons above Gate and fades in gateAuthSlot inside the doorway flash', async () => {
    setupDomStubs({ reducedMotion: false, width: 1440 });
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(
      <LandingPage gateAuthSlot={<div data-testid="embedded-auth">Real Auth Screen</div>} />,
    );

    const gateSection = container.querySelector('#scene-gate')!;
    expect(gateSection.querySelector('[data-step-card="gate"]')).toBeNull();
    expect(gateSection.querySelector('[data-waypoint-stop="5"]')).not.toBeNull();
    expect(gateSection.querySelector('[data-gate-flash="true"]')).not.toBeNull();

    const loginOverlay = gateSection.querySelector('[data-gate-login-overlay="true"]') as HTMLElement;
    expect(loginOverlay.style.opacity).toBe('0');
    expect(loginOverlay.textContent).toContain('Real Auth Screen');
    expect(loginOverlay.querySelector('img')?.getAttribute('src')).toBe(
      '/assets/aistudio/24506908-d5d7-4763-8b9b-3051f12b91ef_71482280.png',
    );
    expect(
      loginOverlay.querySelector('[data-gate-login-align="true"]')?.className,
    ).toContain('md:justify-end');
  });

  it('under reduced motion, shows open Gate doors and login screen immediately', async () => {
    setupDomStubs({ reducedMotion: true, width: 1440 });
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(
      <LandingPage gateAuthSlot={<div data-testid="embedded-auth">Real Auth Screen</div>} />,
    );

    const closedGate = container.querySelector('[data-gate-layer="closed"]') as HTMLElement;
    const openGate = container.querySelector('[data-gate-layer="open"]') as HTMLElement;
    const loginOverlay = container.querySelector('[data-gate-login-overlay="true"]') as HTMLElement;

    expect(closedGate.style.opacity).toBe('0');
    expect(openGate.style.opacity).toBe('1');
    expect(loginOverlay.style.opacity).toBe('1');
    expect(loginOverlay.style.pointerEvents).toBe('auto');
  });
});
