import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { COPY } from '../src/landing/content/copy';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const num = Number.parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [bright, dark] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (bright + 0.05) / (dark + 0.05);
}

function setupDomStubs(reducedMotion = false) {
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
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
}

afterEach(() => {
  cleanup();
});

describe('Phase V3-1: Contrast compliance (WCAG AA)', () => {
  const pairs: Array<[string, string, string, number]> = [
    ['Hero forest-900 heading on brand-white (#FAF7F0)', '#14382A', '#FAF7F0', 4.5],
    ['Hero ink-soft subline on brand-white (#FAF7F0)', '#3B4170', '#FAF7F0', 4.5],
    ['Primary CTA night-0 ink on saffron (#F4A21B)', '#0B1026', '#F4A21B', 4.5],
    ['Primary CTA night-0 ink on marigold (#FF7A1A)', '#0B1026', '#FF7A1A', 4.5],
    ['Light card forest-900 heading on #FFFEFA', '#14382A', '#FFFEFA', 4.5],
    ['Light card forest eyebrow on #FFFEFA', '#1E4D3B', '#FFFEFA', 4.5],
    ['Light card ink body on #FFFEFA', '#1B1F4B', '#FFFEFA', 4.5],
    ['Light card forest-900 on brand-green (#ECFDF5)', '#14382A', '#ECFDF5', 4.5],
    ['Dark card ivory heading on night-0 (#0B1026)', '#FFF6E3', '#0B1026', 4.5],
    ['Dark card ivory-dim body on night-0 (#0B1026)', '#D9CFB8', '#0B1026', 4.5],
    ['Dark card gold eyebrow on night-0 (#0B1026)', '#D4AF37', '#0B1026', 4.5],
    ['Dark card saffron subtitle on night-0 (#0B1026)', '#F4A21B', '#0B1026', 4.5],
    ['Dark nav button ivory on night-1 (#1B1F4B)', '#FFF6E3', '#1B1F4B', 4.5],
    ['Footer ink-soft on brand-white (#FAF7F0)', '#3B4170', '#FAF7F0', 4.5],
  ];

  it.each(pairs)('%s passes contrast', (_label, fg, bg, minRatio) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(minRatio);
  });
});

describe('Phase V3-1: Scenes, 5 waypoints, expandable step cards, Gate, and reduced motion', () => {
  it('renders 6 scenes with expected section modes and disallowed features absent from copy', async () => {
    setupDomStubs(false);
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage />);

    const scenes = Array.from(container.querySelectorAll<HTMLElement>('[data-scene]:not(footer)'));
    expect(scenes.map((el) => [el.dataset.scene, el.dataset.sectionMode])).toEqual([
      ['hero', 'light'],
      ['ashram', 'light'],
      ['bridge', 'dark'],
      ['kurukshetra', 'dark'],
      ['dawn-lake', 'light'],
      ['gate', 'light'],
    ]);

    const serialized = JSON.stringify(COPY).toLowerCase();
    for (const banned of ['scholarship', 'competition', 'fellowship', 'study circle', 'session booking']) {
      expect(serialized).not.toContain(banned);
    }
  });

  it('renders 5 waypoints, expands only one card at a time via waypoint/toggle, and collapses on Escape', async () => {
    setupDomStubs(false);
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage />);

    const waypoints = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-waypoint-stop]'));
    expect(waypoints).toHaveLength(5);
    expect(waypoints[1].getAttribute('aria-label')).toBe('Stop 2 of 5: The Bridge of Stones');

    const toggles = Array.from(
      container.querySelectorAll<HTMLButtonElement>('#scene-ashram button[aria-expanded], #scene-bridge button[aria-expanded], #scene-kurukshetra button[aria-expanded], #scene-dawn-lake button[aria-expanded]'),
    );
    expect(toggles).toHaveLength(4);
    for (const btn of toggles) {
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    }

    // Clicking Stop 2 scrolls and expands Bridge of Stones card
    fireEvent.click(waypoints[1]);
    expect(toggles[1].getAttribute('aria-expanded')).toBe('true');
    const bridgeControlsId = toggles[1].getAttribute('aria-controls')!;
    expect(document.getElementById(bridgeControlsId)?.hasAttribute('hidden')).toBe(false);

    // Clicking Stop 4 closes Stop 2 and opens Dawn Lake (one open at a time)
    fireEvent.click(waypoints[3]);
    expect(toggles[1].getAttribute('aria-expanded')).toBe('false');
    expect(toggles[3].getAttribute('aria-expanded')).toBe('true');

    // Escape collapses open card
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(toggles[3].getAttribute('aria-expanded')).toBe('false');
  });

  it('wires Gate buttons to onOpenAuth(login | register)', async () => {
    setupDomStubs(false);
    const onOpenAuth = vi.fn();
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage onOpenAuth={onOpenAuth} />);

    const gateSection = container.querySelector('#scene-gate')!;
    expect(gateSection.textContent).toContain('Enter the Gurukul');

    const buttons = Array.from(gateSection.querySelectorAll('button'));
    const loginBtn = buttons.find((b) => b.textContent === 'Log in')!;
    const signupBtn = buttons.find((b) => b.textContent === 'Create your account')!;

    fireEvent.click(loginBtn);
    expect(onOpenAuth).toHaveBeenCalledWith('login');

    fireEvent.click(signupBtn);
    expect(onOpenAuth).toHaveBeenCalledWith('register');
  });

  it('renders path fully drawn and all 5 waypoints lit under reduced motion while cards stay expandable', async () => {
    setupDomStubs(true);
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage />);

    const drawnPath = container.querySelector('[data-arrows-path="true"]') as SVGPathElement | null;
    expect(drawnPath).not.toBeNull();
    expect(drawnPath?.style.strokeDashoffset).toBe('0');

    const waypoints = Array.from(container.querySelectorAll<HTMLButtonElement>('[data-waypoint-stop]'));
    expect(waypoints.every((w) => w.getAttribute('data-lit') === 'true')).toBe(true);

    const firstToggle = container.querySelector('#scene-ashram button[aria-expanded]') as HTMLButtonElement;
    fireEvent.click(firstToggle);
    expect(firstToggle.getAttribute('aria-expanded')).toBe('true');
  });
});
