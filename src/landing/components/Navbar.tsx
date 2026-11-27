import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COPY, type SectionMode } from '../content/copy';
import { scrollToTarget } from '../motion/lenis';

gsap.registerPlugin(ScrollTrigger);

export function Navbar() {
  const [navMode, setNavMode] = useState<SectionMode>('light');

  useEffect(() => {
    const scenes = Array.from(
      document.querySelectorAll<HTMLElement>('.partha-landing-v3 [data-scene][data-section-mode]'),
    );
    if (scenes.length === 0) return;

    const ctx = gsap.context(() => {
      for (const sceneEl of scenes) {
        const mode: SectionMode =
          sceneEl.dataset.sectionMode === 'dark' ? 'dark' : 'light';
        ScrollTrigger.create({
          trigger: sceneEl,
          start: 'top 64px',
          end: 'bottom 64px',
          onEnter: () => setNavMode(mode),
          onEnterBack: () => setNavMode(mode),
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const isDark = navMode === 'dark';

  return (
    <header
      id="navbar"
      data-section-mode={navMode}
      className={[
        'fixed top-0 inset-x-0 z-50 border-b backdrop-blur-md transition-colors duration-200',
        isDark
          ? 'bg-[rgba(11,16,38,0.88)] border-[rgba(212,175,55,0.28)] nav-mode-dark'
          : 'bg-[rgba(250,247,240,0.92)] border-[rgba(20,56,42,0.16)] nav-mode-light',
      ].join(' ')}
    >
      <nav
        aria-label={COPY.nav.ariaLabel}
        className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4"
      >
        <a
          href="#scene-hero"
          onClick={(e) => {
            e.preventDefault();
            scrollToTarget('#scene-hero', { duration: 1.2 });
          }}
          className={[
            'inline-flex items-center min-h-[44px] px-2 -ml-2 rounded-lg no-underline transition-colors duration-200',
            'font-[var(--font-landing-display)] text-2xl sm:text-3xl font-semibold tracking-[0.06em]',
            isDark ? 'text-[var(--c-ivory)]' : 'text-[var(--c-forest-900)]',
          ].join(' ')}
        >
          {COPY.brand.name}
        </a>

        <button
          type="button"
          onClick={() => {
            const gateTrigger = ScrollTrigger.getById('gate-pinned-zoom');
            if (gateTrigger) {
              scrollToTarget(gateTrigger.end, { duration: 1.4 });
              return;
            }
            scrollToTarget('#scene-gate', { duration: 1.4 });
          }}
          className={[
            'min-h-[44px] min-w-[44px] px-5 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer border',
            isDark
              ? 'border-[rgba(212,175,55,0.55)] bg-[rgba(27,31,75,0.75)] text-[var(--c-ivory)] hover:border-[var(--c-saffron)] hover:bg-[var(--c-night-1)]'
              : 'border-[rgba(20,56,42,0.3)] bg-[#FFFEFA] text-[var(--c-forest-900)] hover:border-[var(--c-forest-900)] hover:bg-[var(--c-brand-green)]',
          ].join(' ')}
        >
          {COPY.nav.login}
        </button>
      </nav>
    </header>
  );
}
