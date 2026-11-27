import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { COPY } from '../content/copy';
import { LotusSvg } from '../components/MotifIcons';
import { Button } from '../components/Button';
import { scrollToTarget } from '../motion/lenis';
import { useRouter } from '../lib/router';
import { useReducedMotion } from '../motion/useReducedMotion';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const { navigate } = useRouter();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;

    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        requestAnimationFrame(() => {
          triggerRef.current?.focus();
        });
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  };

  const handleAnchor = (href: string) => {
    if (drawerOpen) {
      setDrawerOpen(false);
    }
    scrollToTarget(href);
  };

  return (
    <header
      id="navbar"
      className={[
        'fixed top-0 inset-x-0 z-50 border-b',
        reducedMotion ? 'transition-colors duration-150' : 'transition-all duration-300 ease-out',
        scrolled
          ? 'bg-[rgba(11,16,38,0.85)] backdrop-blur-md border-[rgba(212,175,55,0.22)]'
          : 'bg-transparent border-transparent',
      ].join(' ')}
    >
      <nav
        aria-label={COPY.nav.ariaLabel}
        className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4"
      >
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollToTarget('#hero');
          }}
          className="inline-flex items-center gap-2.5 min-h-[44px] pr-2 rounded-lg text-[var(--c-ivory)] no-underline group"
        >
          <LotusSvg className="w-8 h-8 text-[var(--c-gold)] group-hover:text-[var(--c-saffron)] transition-colors duration-200" />
          <span className="font-[var(--font-display)] text-xl tracking-[0.08em] font-semibold">
            {COPY.brand.name}
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {COPY.nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                handleAnchor(link.href);
              }}
              className="min-h-[44px] px-3.5 inline-flex items-center rounded-lg text-sm font-medium text-[var(--c-ivory-dim)] hover:text-[var(--c-ivory)] hover:bg-[rgba(212,175,55,0.08)] transition-colors duration-200 no-underline"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop auth actions */}
        <div className="hidden md:flex items-center gap-2.5">
          <Button variant="ghost" onClick={() => handleAnchor('#login-gate')}>
            {COPY.nav.login}
          </Button>
          <Button variant="primary" onClick={() => navigate('/signup')}>
            {COPY.nav.signup}
          </Button>
        </div>

        {/* Mobile hamburger trigger */}
        <button
          ref={triggerRef}
          type="button"
          aria-label={COPY.nav.menuOpenLabel}
          aria-expanded={drawerOpen}
          aria-controls="mobile-nav-drawer"
          onClick={() => setDrawerOpen(true)}
          className="md:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[rgba(212,175,55,0.4)] bg-[rgba(11,16,38,0.75)] text-[var(--c-ivory)] cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </nav>

      {/* Mobile full-screen drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            id="mobile-nav-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={COPY.nav.drawerLabel}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: reducedMotion ? 0.16 : 0.22, ease: 'easeOut' }}
            className="fixed inset-0 z-50 md:hidden bg-[var(--c-night-0)] px-6 py-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2.5">
                  <LotusSvg className="w-8 h-8 text-[var(--c-gold)]" />
                  <span className="font-[var(--font-display)] text-xl tracking-[0.08em] font-semibold">
                    {COPY.brand.name}
                  </span>
                </span>
                <button
                  ref={closeBtnRef}
                  type="button"
                  aria-label={COPY.nav.menuCloseLabel}
                  onClick={closeDrawer}
                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl border border-[rgba(212,175,55,0.45)] text-[var(--c-ivory)] cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="w-6 h-6"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="mt-10 flex flex-col gap-2">
                {COPY.nav.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleAnchor(link.href);
                    }}
                    className="min-h-[48px] px-4 flex items-center rounded-xl font-[var(--font-display)] text-xl text-[var(--c-ivory)] hover:bg-[rgba(212,175,55,0.1)] no-underline"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-6 border-t border-[rgba(212,175,55,0.3)]">
              <Button variant="outline" fullWidth onClick={() => handleAnchor('#login-gate')}>
                {COPY.nav.login}
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  setDrawerOpen(false);
                  navigate('/signup');
                }}
              >
                {COPY.nav.signup}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
