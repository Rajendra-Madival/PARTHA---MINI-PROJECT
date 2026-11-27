import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SCENE_ARTWORKS } from '../src/landing/content/scenes';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
  });
});

afterEach(() => {
  cleanup();
});

describe('Phase V3-2: SceneBackdrop & SceneProps', () => {
  it('renders gradient fallback only when no layers are provided', async () => {
    const { SceneBackdrop } = await import('../src/landing/components/SceneBackdrop');
    const { container } = render(
      <SceneBackdrop gradientClass="v3-backdrop-dawn" sceneId="hero" eager />,
    );
    const root = container.querySelector('[data-scene-backdrop="hero"]');
    expect(root).not.toBeNull();
    expect(root?.className).toContain('v3-backdrop-dawn');
    expect(container.querySelector('[data-backdrop-layer="sky"]')).toBeNull();
    expect(container.querySelector('[data-backdrop-layer="land"]')).toBeNull();
    expect(container.querySelector('[data-backdrop-layer="fore"]')).toBeNull();
  });

  it('renders sky, land, and fore layers when layers are provided', async () => {
    const { SceneBackdrop } = await import('../src/landing/components/SceneBackdrop');
    const { container } = render(
      <SceneBackdrop
        gradientClass="v3-backdrop-dawn"
        sceneId="hero"
        layers={SCENE_ARTWORKS.hero.layers}
        landShiftY={SCENE_ARTWORKS.hero.landShiftY}
        skyShiftY={SCENE_ARTWORKS.hero.skyShiftY}
        eager
      />,
    );
    expect(container.querySelector('[data-backdrop-layer="sky"] img')?.getAttribute('src')).toBe(
      '/landing/art/s0-sky.webp',
    );
    expect(container.querySelector('[data-backdrop-layer="land"] img')?.getAttribute('src')).toBe(
      '/landing/art/s0-land.webp',
    );
    expect(container.querySelector('[data-backdrop-layer="fore"] img')?.getAttribute('src')).toBe(
      '/landing/art/s0-fore.webp',
    );
  });

  it('applies no scroll parallax transforms under reduced motion', async () => {
    const { SceneBackdrop } = await import('../src/landing/components/SceneBackdrop');
    const { container } = render(
      <SceneBackdrop
        gradientClass="v3-backdrop-warm-gold"
        sceneId="ashram"
        layers={SCENE_ARTWORKS.ashram.layers}
        eager
        reducedMotion
      />,
    );
    const land = container.querySelector('[data-backdrop-layer="land"]') as HTMLElement | null;
    const fore = container.querySelector('[data-backdrop-layer="fore"]') as HTMLElement | null;
    expect(land?.style.transform).not.toContain('-');
    expect(fore?.style.transform).not.toContain('-');
  });

  it('renders Scene 5 closed and lazy-open gates in identical wrapper with doorway transform-origin', async () => {
    const { SceneProps } = await import('../src/landing/components/SceneProps');
    const { container } = render(<SceneProps config={SCENE_ARTWORKS.gate} eager />);
    const wrapper = container.querySelector('[data-gate-wrapper="true"]') as HTMLElement | null;
    expect(wrapper).not.toBeNull();
    expect(wrapper?.style.transformOrigin).toBe('50% 65%');
    expect(container.querySelector('[data-gate-layer="closed"]')).not.toBeNull();
    const openGate = container.querySelector('[data-gate-layer="open"]');
    expect(openGate).not.toBeNull();
    expect(openGate?.className).toContain('opacity-0');
  });

  it('keeps scene props inside the shared land-group wrapper with locked box coordinates', async () => {
    const { SceneBackdrop } = await import('../src/landing/components/SceneBackdrop');
    const { SceneProps } = await import('../src/landing/components/SceneProps');
    const { container } = render(
      <SceneBackdrop
        gradientClass="v3-backdrop-mint-gold"
        sceneId="dawn-lake"
        layers={SCENE_ARTWORKS['dawn-lake'].layers}
        landShiftY={SCENE_ARTWORKS['dawn-lake'].landShiftY}
        landHeightPercent={SCENE_ARTWORKS['dawn-lake'].landHeightPercent}
        blended
        eager
      >
        <SceneProps config={SCENE_ARTWORKS['dawn-lake']} eager />
      </SceneBackdrop>,
    );
    const canvas = container.querySelector('[data-scene-canvas="true"]');
    expect(canvas?.className).toContain('v3-scene-blend-mask');
    const landGroup = container.querySelector('[data-backdrop-layer="land-group"]');
    expect(landGroup?.querySelector('[data-prop="lotus-bud"]')).not.toBeNull();
    expect(landGroup?.querySelector('[data-water-ripple="lotus-bud"]')).not.toBeNull();
  });
});
