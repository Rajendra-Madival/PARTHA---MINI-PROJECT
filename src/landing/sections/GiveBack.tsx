import { Button } from '../components/Button';
import { RangoliBorder } from '../components/Patterns';
import { COPY } from '../content/copy';
import { scrollToTarget } from '../motion/lenis';

export function GiveBack() {
  const handleCta = () => {
    scrollToTarget('#login-gate');
    const emailInput = document.querySelector('#login-gate input[type="email"]');
    if (emailInput instanceof HTMLInputElement) {
      window.setTimeout(() => emailInput.focus({ preventScroll: true }), 450);
    }
  };

  return (
    <section
      id="give-back"
      data-section-mode="light"
      aria-labelledby="give-back-heading"
      className="relative bg-[var(--c-brand-green)] py-20 sm:py-28 px-5 overflow-x-clip border-b border-[rgba(20,56,42,0.18)]"
    >
      <RangoliBorder className="absolute inset-x-0 top-0 text-[var(--c-forest)] opacity-45" />
      <div className="max-w-3xl mx-auto text-center">
        <h2
          id="give-back-heading"
          className="text-section-h2 text-[var(--c-forest-900)] mb-5"
        >
          {COPY.giveBack.heading}
        </h2>
        <p className="text-body-copy text-[var(--c-ink)] mx-auto mb-9 leading-relaxed">
          {COPY.giveBack.body}
        </p>
        <div className="flex justify-center">
          <Button variant="primary" onClick={handleCta}>
            {COPY.giveBack.cta}
          </Button>
        </div>
      </div>
    </section>
  );
}
