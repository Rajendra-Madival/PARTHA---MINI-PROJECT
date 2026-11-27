import { COPY } from '../content/copy';
import { Divider } from '../components/Divider';
import { LotusSvg } from '../components/MotifIcons';
import { MandalaMedallionSvg } from '../components/Patterns';
import { scrollToTarget } from '../motion/lenis';
import { useRouter, type AppRoute } from '../lib/router';

export function Footer() {
  const { navigate } = useRouter();
  const currentYear = new Date().getFullYear();

  const handleLink = (href: string) => {
    if (href.startsWith('#')) {
      if (href === '#') return;
      scrollToTarget(href);
      return;
    }
    navigate(href as AppRoute);
  };

  return (
    <footer
      id="footer"
      data-section-mode="dark"
      aria-labelledby="footer-heading"
      className="relative bg-[var(--c-forest-900)] pt-12 pb-14 px-5 overflow-hidden"
    >
      <h2 id="footer-heading" className="sr-only">
        {COPY.footer.heading}
      </h2>

      {/* Mandala medallion watermark at 5% opacity (v2 Section 6.8) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center opacity-5 text-[var(--c-gold)]"
      >
        <MandalaMedallionSvg className="w-[460px] max-w-full h-auto" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <Divider withLotus className="mb-12" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {COPY.footer.columns.map((column) => (
            <div key={column.heading}>
              <h3 className="font-[var(--font-landing-display)] text-base text-[var(--c-gold)] mb-3.5">
                {column.heading}
              </h3>
              <ul className="list-none p-0 m-0 space-y-1">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={(e) => {
                        if (link.href !== '#') {
                          e.preventDefault();
                          handleLink(link.href);
                        }
                      }}
                      className="inline-flex items-center min-h-[44px] text-sm text-[var(--c-ivory-dim)] hover:text-[var(--c-ivory)] transition-colors no-underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="gold-divider mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5 text-sm text-[var(--c-ivory-dim)]">
            <LotusSvg className="w-5 h-5 text-[var(--c-gold)] shrink-0" />
            <span>
              © {currentYear} {COPY.footer.copyrightOwner}
            </span>
          </div>

          {/* // VERIFY: native speaker review before launch */}
          <p className="font-mixed text-sm text-[var(--c-gold)] m-0">
            <span className="font-devanagari text-base mr-2">{COPY.footer.shloka}</span>
            <span className="text-[var(--c-ivory-dim)]">
              — {COPY.footer.shlokaTranslation}
            </span>
          </p>
        </div>

        <p className="text-xs text-[var(--c-ivory-dim)] mt-4 text-center sm:text-left m-0">
          {COPY.footer.creditLine}
        </p>
      </div>
    </footer>
  );
}
