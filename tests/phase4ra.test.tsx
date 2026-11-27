import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
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

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
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

  Element.prototype.scrollIntoView = () => {};
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
});

describe('Phase 4R-A: WCAG contrast verification', () => {
  const normalPairs: Array<[string, string, string]> = [
    ['Dark ivory on night-0', '#F5EEDC', '#0B1026'],
    ['Dark ivory-dim on night-0', '#D9CFB8', '#0B1026'],
    ['Dark gold on night-1', '#D4AF37', '#1B1F4B'],
    ['Dark saffron on night-1', '#F4A21B', '#1B1F4B'],
    ['Footer ivory on forest-900', '#F5EEDC', '#14382A'],
    ['Footer ivory-dim on forest-900', '#D9CFB8', '#14382A'],
    ['Footer gold on forest-900', '#D4AF37', '#14382A'],
    ['Light forest-900 heading on brand-white', '#14382A', '#FAF7F0'],
    ['Light ink body on brand-white', '#1B1F4B', '#FAF7F0'],
    ['Light ink-soft on brand-white', '#3B4170', '#FAF7F0'],
    ['Light forest-900 heading on brand-green', '#14382A', '#ECFDF5'],
    ['Light ink body on brand-green', '#1B1F4B', '#ECFDF5'],
    ['Light ink-soft on brand-green', '#3B4170', '#ECFDF5'],
    ['Light forest-900 on card white (#FFFEFA)', '#14382A', '#FFFEFA'],
    ['Light ink on card white (#FFFEFA)', '#1B1F4B', '#FFFEFA'],
    ['Light ink on parchment (#F3E5C0)', '#1B1F4B', '#F3E5C0'],
    ['Light ink-soft on parchment (#F3E5C0)', '#3B4170', '#F3E5C0'],
    ['Light forest-900 on parchment (#F3E5C0)', '#14382A', '#F3E5C0'],
    ['Light error (#9B2C1F) on brand-white', '#9B2C1F', '#FAF7F0'],
    ['Light error (#9B2C1F) on brand-green', '#9B2C1F', '#ECFDF5'],
  ];

  it.each(normalPairs)('%s achieves >= 4.5:1 AA contrast', (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('light forest eyebrow (#1E4D3B) meets AA contrast on brand-white & brand-green', () => {
    expect(contrastRatio('#1E4D3B', '#FAF7F0')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#1E4D3B', '#ECFDF5')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('Phase 4R-A: Addendum Section 3 copy & banned terms', () => {
  it('matches exact hero subline, 3 Gurukul pillars, 6 highlight cards, 4 milestones, and Give Back copy', () => {
    expect(COPY.hero.tagline).toBe('Where every student finds a guru.');
    expect(COPY.hero.subline).toBe('Alumni mentorship for the path ahead.');
    expect(COPY.gurukul.pillars.map((p) => p.title)).toEqual([
      'Who it serves',
      'How it works',
      'Why it matters',
    ]);
    expect(COPY.highlights.items.map((i) => ({ title: i.title, icon: i.icon }))).toEqual([
      { title: 'Find Your Guru', icon: 'lamp' },
      { title: 'Request Mentorship', icon: 'lotus' },
      { title: 'Discover Opportunities', icon: 'bow' },
      { title: 'Knowledge Hub', icon: 'palmLeaf' },
      { title: 'Verified and Private', icon: 'shield' },
      { title: 'Save for Later', icon: 'conch' },
    ]);
    expect(COPY.epicPath.milestones.map((m) => m.title)).toEqual([
      'Create your profile',
      'Meet your alumni mentor',
      'Ask and learn',
      'Unlock opportunities',
    ]);
    expect(COPY.giveBack.heading).toBe('Walked the road? Guide the next seeker.');
    expect(COPY.giveBack.cta).toBe('Join as alumni');
  });

  it('contains none of the excluded features', () => {
    const serialized = JSON.stringify(COPY).toLowerCase();
    for (const term of ['scholarship', 'competition', 'fellowship', 'study circle', 'session booking']) {
      expect(serialized).not.toContain(term);
    }
  });
});

describe('Phase 4R-A: Section modes, placeholders, and ambient hero opacity', () => {
  it('sets data-section-mode accurately on every section and renders static Gurukul & motif placeholders', async () => {
    const { LandingPage } = await import('../src/landing/LandingPage');
    const { container } = render(<LandingPage />);

    const expectedModes: Record<string, 'dark' | 'light'> = {
      hero: 'dark',
      question: 'dark',
      gurukul: 'light',
      highlights: 'light',
      'epic-path': 'dark',
      stories: 'light',
      'give-back': 'light',
      'login-gate': 'dark',
      footer: 'dark',
    };

    for (const [id, mode] of Object.entries(expectedModes)) {
      const section = container.querySelector(`#${id}`);
      expect(section, `missing #${id}`).not.toBeNull();
      expect(section?.getAttribute('data-section-mode')).toBe(mode);
    }

    const hero = container.querySelector('#hero');
    expect(hero?.querySelector('.opacity-60')).not.toBeNull();

    const gurukul = container.querySelector('#gurukul');
    expect(gurukul?.querySelector('[data-gurukul-part="hut"]')).not.toBeNull();
    expect(gurukul?.querySelector('[data-gurukul-part="banyan"]')).not.toBeNull();
    expect(gurukul?.querySelector('[data-gurukul-part="guru"]')).not.toBeNull();
    expect(gurukul?.querySelectorAll('[data-student-group]').length).toBe(3);

    const motifParts = container.querySelectorAll('#highlights [data-motif-part]');
    expect(motifParts.length).toBeGreaterThanOrEqual(6);
  });
});
