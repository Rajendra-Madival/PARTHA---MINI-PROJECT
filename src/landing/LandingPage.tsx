import { useEffect } from 'react';
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
