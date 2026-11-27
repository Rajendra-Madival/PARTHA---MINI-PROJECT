import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { resetWebGLSupportCacheForTest } from '../src/landing/three/capabilities';

function installBrowserStubs({ reducedMotion = false, webgl = false }: { reducedMotion?: boolean; webgl?: boolean }) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : query.includes('pointer: fine'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  if (!('IntersectionObserver' in window)) {
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      value: MockIntersectionObserver,
    });
  }

  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  if (!webgl) {
    resetWebGLSupportCacheForTest();
  }
}

afterEach(() => {
  cleanup();
  resetWebGLSupportCacheForTest();
});

describe('Phase 4R-B: Hero scene layers, accessibility, and fallbacks', () => {
  it('renders layered silhouettes, terracotta road, chariot with wheel group, archer replay button, and arrow without forbidden terms', async () => {
    installBrowserStubs({ reducedMotion: false, webgl: false });
    const { Hero } = await import('../src/landing/sections/Hero');
    const { container } = render(<Hero />);

    expect(container.querySelector('[data-hero-layer="sky"]')).not.toBeNull();
    expect(container.querySelector('[data-hero-layer="silhouettes"]')).not.toBeNull();
    expect(container.querySelector('[data-hero-silhouette="banyan"]')).not.toBeNull();
    expect(container.querySelector('[data-hero-silhouette="gopuram"]')).not.toBeNull();
    expect(container.querySelector('[data-hero-layer="road"]')).not.toBeNull();
    expect(container.querySelector('[data-hero-layer="chariot-unit"]')).not.toBeNull();
    expect(container.querySelector('[data-chariot-part="horses"]')).not.toBeNull();
    expect(container.querySelector('[data-chariot-part="body"]')).not.toBeNull();
    expect(container.querySelector('[data-chariot-wheel="true"]')).not.toBeNull();

    const replayBtn = container.querySelector('button[aria-label="Replay the archer\'s shot"]');
    expect(replayBtn).not.toBeNull();
    expect(container.querySelector('[data-archer-part="bow"]')).not.toBeNull();
    expect(container.querySelector('[data-archer-bowstring="true"]')).not.toBeNull();
    expect(container.querySelector('[data-hero-layer="arrow"]')).not.toBeNull();
    expect(container.querySelector('[data-hero-layer="3d-canvas"]')).toBeNull();

    const html = container.innerHTML.toLowerCase();
    for (const forbidden of ['arjuna', 'krishna', 'rama', 'karna', 'sudarshan']) {
      expect(html).not.toContain(forbidden);
    }
  });

  it('shows the final frame under reduced motion and triggers instant replay state change', async () => {
    installBrowserStubs({ reducedMotion: true, webgl: false });
    const { Hero } = await import('../src/landing/sections/Hero');
    const { container } = render(<Hero />);

    const replayBtn = container.querySelector(
      'button[aria-label="Replay the archer\'s shot"]',
    ) as HTMLButtonElement | null;
    expect(replayBtn).not.toBeNull();
    expect(replayBtn?.getAttribute('data-shot-state')).toBe('landed');

    const bowstring = container.querySelector('[data-archer-bowstring="true"]') as SVGGElement | null;
    expect(bowstring?.style.transform).toMatch(/scale\(6|scaleX\(6\)|matrix\(6,\s*0,\s*0,\s*1/);

    const arrow = container.querySelector('[data-hero-layer="arrow"]') as HTMLElement | null;
    expect(arrow?.style.opacity).toBe('1');

    fireEvent.click(replayBtn!);
    expect(replayBtn?.getAttribute('data-replay-count')).toBe('1');
    expect(replayBtn?.getAttribute('data-shot-state')).toBe('landed');
  });

  it('keeps total hero SVG size strictly under 60 KB gzipped', () => {
    const heroArtSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/landing/components/HeroSceneArt.tsx'),
      'utf8',
    );
    const fallbackSrc = fs.readFileSync(
      path.resolve(process.cwd(), 'src/landing/components/HeroFallback2D.tsx'),
      'utf8',
    );
    const totalGzipBytes = zlib.gzipSync(`${heroArtSrc}\n${fallbackSrc}`).length;
    expect(totalGzipBytes).toBeLessThan(60 * 1024);
  });
});
