import { COPY } from '../content/copy';
import { Carousel } from '../components/Carousel';
import { KalamkariVineTile } from '../components/Patterns';

export function Testimonials() {
  return (
    <section
      id="stories"
      data-section-mode="light"
      aria-labelledby="stories-heading"
      className="relative bg-[var(--c-brand-white)] py-24 sm:py-32 px-5 overflow-hidden border-b border-[rgba(20,56,42,0.14)]"
    >
      <KalamkariVineTile opacity={0.06} className="text-[var(--c-forest)]" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 id="stories-heading" className="text-section-h2 text-[var(--c-forest-900)]">
            {COPY.stories.heading}
          </h2>
        </div>

        <Carousel items={COPY.stories.items} />
      </div>
    </section>
  );
}
