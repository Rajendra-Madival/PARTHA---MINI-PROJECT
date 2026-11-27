import { useEffect } from 'react';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/noto-serif-devanagari/400.css';
import '@fontsource/noto-serif-devanagari/600.css';
import './styles/globals.css';
import { COPY } from './content/copy';
import { initScrollEngine } from './motion/lenis';
import { useReducedMotion } from './motion/useReducedMotion';
import { RouterProvider, useRouter } from './lib/router';
import { Navbar } from './sections/Navbar';
import { Hero } from './sections/Hero';
import { Question } from './sections/Question';
import { Gurukul } from './sections/Gurukul';
import { Highlights } from './sections/Highlights';
import { EpicPath } from './sections/EpicPath';
import { Testimonials } from './sections/Testimonials';
import { GiveBack } from './sections/GiveBack';
import { LoginGate } from './sections/LoginGate';
import { Footer } from './sections/Footer';
import { PlaceholderPage } from './sections/PlaceholderPage';

function LandingRoutes() {
  const { route } = useRouter();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (route !== '/') return;
    return initScrollEngine(reducedMotion);
  }, [route, reducedMotion]);

  if (route !== '/') {
    return (
      <div className="partha-landing-v1">
        <div className="paper-grain-overlay" aria-hidden="true" />
        <PlaceholderPage route={route} />
      </div>
    );
  }

  return (
    <div className="partha-landing-v1">
      <a href="#main-content" className="skip-link">
        {COPY.brand.skipToContent}
      </a>
      <div className="paper-grain-overlay" aria-hidden="true" />
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <Question />
        <Gurukul />
        <Highlights />
        <EpicPath />
        <Testimonials />
        <GiveBack />
        <LoginGate />
      </main>
      <Footer />
    </div>
  );
}

export function LandingPage() {
  return (
    <RouterProvider>
      <LandingRoutes />
    </RouterProvider>
  );
}
