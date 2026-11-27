import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

function setupDomStubs({
  reducedMotion = false,
  width = 1440,
  finePointer = true,
}: {
  reducedMotion?: boolean;
  width?: number;
  finePointer?: boolean;
} = {}) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion')
        ? reducedMotion
        : query.includes('pointer: fine')
          ? finePointer
          : false,
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

describe('Phase V3-3: Hero bow shot, mouse trail, scene choreography, alumni diya, and Gate', () => {
  it('swaps Rama to rama-draw on bow pull and shoots after auto-timer (~5s)', async () => {
    vi.useFakeTimers();
    setupDomStubs({ reducedMotion: false, width: 1440, finePointer: true });

    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage />);

    const bowBtn = container.querySelector('[data-hero-bow-trigger="true"]') as HTMLButtonElement;
    expect(bowBtn).not.toBeNull();

    const ramaImg = () => container.querySelector('[data-prop="rama-ready"]') as HTMLImageElement;
    expect(ramaImg().getAttribute('src')).toBe('/landing/art/rama-ready.webp');

    // Auto-shoot fires after ~4.8s draw + 320ms release
    await act(async () => {
      vi.advanceTimersByTime(4850);
    });
    expect(ramaImg().getAttribute('src')).toBe('/landing/art/rama-draw.webp');

    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    expect(ramaImg().getAttribute('src')).toBe('/landing/art/rama-ready.webp');
    expect(container.querySelector('[data-hero-bow-trigger="true"]')).toBeNull();
  });

  it('shoots immediately if visitor scrolls down before shooting', async () => {
    setupDomStubs({ reducedMotion: false, width: 1440, finePointer: true });
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage />);

    expect(container.querySelector('[data-hero-bow-trigger="true"]')).not.toBeNull();

    await act(async () => {
      fireEvent.wheel(window, { deltaY: 120 });
    });

    expect(container.querySelector('[data-hero-bow-trigger="true"]')).toBeNull();
  });

  it('enables MouseTrailCanvas on fine-pointer desktop and disables it on mobile phones', async () => {
    setupDomStubs({ reducedMotion: false, width: 1440, finePointer: true });
    const { MouseTrailCanvas } = await import('../src/landing/components/MouseTrailCanvas');

    const desktop = render(<MouseTrailCanvas reducedMotion={false} />);
    expect(desktop.container.querySelector('[data-mouse-trail="true"]')).not.toBeNull();
    desktop.unmount();

    setupDomStubs({ reducedMotion: false, width: 390, finePointer: false });
    const phone = render(<MouseTrailCanvas reducedMotion={false} />);
    expect(phone.container.querySelector('[data-mouse-trail="true"]')).toBeNull();
    phone.unmount();

    setupDomStubs({ reducedMotion: false, width: 1440, finePointer: true });
    const reduced = render(<MouseTrailCanvas reducedMotion />);
    expect(reduced.container.querySelector('[data-mouse-trail="true"]')).toBeNull();
  });

  it('renders Kurukshetra 3 real torch labels, Dawn Lake alumni diya calling standard register, and Gate flash layer', async () => {
    setupDomStubs({ reducedMotion: false, width: 1440, finePointer: true });
    const onOpenAuth = vi.fn();
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage onOpenAuth={onOpenAuth} />);

    // Scene 2 stars layer
    expect(container.querySelector('[data-bridge-stars="true"]')).not.toBeNull();

    // Scene 3 three real torch labels
    const torchesDesktop = container.querySelector('[data-kurukshetra-torches="desktop"]');
    expect(torchesDesktop?.textContent).toContain('Internships');
    expect(torchesDesktop?.textContent).toContain('Jobs');
    expect(torchesDesktop?.textContent).toContain('Projects');

    // Scene 4 glowing alumni diya button on the lake -> standard register flow
    const alumniDiyaBtn = container.querySelector('[data-alumni-diya="true"]') as HTMLButtonElement;
    expect(alumniDiyaBtn).not.toBeNull();
    expect(alumniDiyaBtn.textContent).toContain('Join as alumni');
    fireEvent.click(alumniDiyaBtn);
    expect(onOpenAuth).toHaveBeenCalledWith('register');

    // Scene 5 Gate flash layer present
    expect(container.querySelector('[data-gate-flash="true"]')).not.toBeNull();
  });

  it('under reduced motion, shows open Gate doors immediately and lotus already bloomed', async () => {
    setupDomStubs({ reducedMotion: true, width: 1440, finePointer: true });
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage />);

    const closedGate = container.querySelector('[data-gate-layer="closed"]') as HTMLElement;
    const openGate = container.querySelector('[data-gate-layer="open"]') as HTMLElement;
    expect(closedGate.style.opacity).toBe('0');
    expect(openGate.style.opacity).toBe('1');

    const lotusOpen = container.querySelector('[data-prop="lotus-open"]');
    expect(lotusOpen?.getAttribute('data-lotus-bloomed')).toBe('true');
  });
});
