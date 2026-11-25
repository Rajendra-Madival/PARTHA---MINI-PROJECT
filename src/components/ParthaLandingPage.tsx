import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/montserrat/latin-400.css';
import '@fontsource/montserrat/latin-500.css';
import '@fontsource/montserrat/latin-600.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { ArrowDown, BookOpen, BriefcaseBusiness, Compass, Users } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import './ParthaLandingPage.css';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    title: 'Alumni Mentorship',
    description:
      'Career guidance, referrals and technical mentorship from experienced alumni.',
    icon: Users,
  },
  {
    title: 'Opportunities',
    description:
      'Discover internships, jobs, hackathons and paths worth pursuing.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Prep Guides',
    description:
      'Learn with practical resources, interview preparation and roadmaps.',
    icon: BookOpen,
  },
  {
    title: 'Your Journey',
    description:
      'Build your profile, showcase your skills and find your next connection.',
    icon: Compass,
  },
];

interface ParthaLandingPageProps {
  children: ReactNode;
}

export function ParthaLandingPage({ children }: ParthaLandingPageProps) {
  const storyRef = useRef<HTMLElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const artworkRef = useRef<HTMLDivElement | null>(null);
  const bowStringRef = useRef<SVGPathElement | null>(null);
  const arrowRef = useRef<SVGGElement | null>(null);
  const destinationRef = useRef<SVGPathElement | null>(null);
  const featureRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const story = storyRef.current;
    const scene = sceneRef.current;
    const artwork = artworkRef.current;
    if (!story || !scene || !artwork) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reducedMotion) return;

    const lenis = new Lenis({
      lerp: 0.075,
      smoothWheel: true,
      wheelMultiplier: 0.85,
    });
    const updateScrollTrigger = () => ScrollTrigger.update();
    const tickLenis = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', updateScrollTrigger);
    gsap.ticker.add(tickLenis);

    const getArjunaFocus = () => {
      const scale = Math.max(
        scene.clientWidth / 1365,
        scene.clientHeight / 768,
      );
      const originX = scene.clientWidth * 0.18;
      const originY = scene.clientHeight * 0.59;
      const arjunaX = 220 * scale;
      const arjunaY =
        (scene.clientHeight - 768 * scale) / 2 + 470 * scale;

      return {
        x:
          scene.clientWidth / 2 -
          (originX + 2.05 * (arjunaX - originX)),
        y:
          scene.clientHeight * 0.54 -
          (originY + 2.05 * (arjunaY - originY)),
      };
    };

    const context = gsap.context(() => {
      gsap.set(featureRefs.current, { autoAlpha: 0, y: 18 });
      gsap.set(arrowRef.current, { autoAlpha: 0, x: 0 });
      gsap.set(destinationRef.current, { autoAlpha: 0, scale: 0.4 });

      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: story,
          start: 'top top',
          end: () => `+=${window.innerHeight * 5.2}`,
          pin: scene,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(
          artwork,
          {
            scale: 2.05,
            x: () => getArjunaFocus().x,
            y: () => getArjunaFocus().y,
            transformOrigin: '18% 59%',
            duration: 1.05,
          },
          0,
        )
        .to(
          bowStringRef.current,
          {
            attr: { d: 'M 244 354 Q 360 438 255 531' },
            duration: 0.65,
          },
          1.1,
        )
        .to(arrowRef.current, { autoAlpha: 1, duration: 0.16 }, 1.62)
        .to(
          bowStringRef.current,
          {
            attr: { d: 'M 244 354 Q 248 443 255 531' },
            duration: 0.2,
          },
          1.68,
        )
        .to(
          artwork,
          {
            scale: 1.16,
            x: () => window.innerWidth * 0.015,
            y: () => -window.innerHeight * 0.015,
            transformOrigin: '18% 59%',
            duration: 0.82,
          },
          1.72,
        )
        .to(
          artwork,
          {
            scale: 1.1,
            x: () => -scene.clientWidth * 0.12,
            y: () => scene.clientHeight * 0.015,
            duration: 3.32,
          },
          2.55,
        )
        .to(
          arrowRef.current,
          {
            x: () => window.innerWidth * 0.68,
            duration: 4.08,
          },
          1.85,
        );

      FEATURES.forEach((_, index) => {
        const start = 2.05 + index * 0.91;
        timeline
          .fromTo(
            featureRefs.current[index],
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.18 },
            start,
          )
          .to(
            featureRefs.current[index],
            { autoAlpha: 0, y: -10, duration: 0.16 },
            start + 0.65,
          );
      });

      timeline
        .to(
          artwork,
          {
            scale: 1,
            x: 0,
            y: 0,
            transformOrigin: '50% 50%',
            duration: 0.76,
          },
          5.96,
        )
        .to(
          arrowRef.current,
          {
            x: () => window.innerWidth * 0.72,
            autoAlpha: 0,
            duration: 0.56,
          },
          6.02,
        )
        .to(
          destinationRef.current,
          { autoAlpha: 1, scale: 1, transformOrigin: 'center', duration: 0.3 },
          6.24,
        );
    }, story);

    ScrollTrigger.refresh();

    return () => {
      context.revert();
      gsap.ticker.remove(tickLenis);
      lenis.off('scroll', updateScrollTrigger);
      lenis.destroy();
    };
  }, []);

  return (
    <main className="partha-landing">
      <section
        ref={storyRef}
        className="partha-story"
        aria-label="PARTHA journey"
      >
        <div ref={sceneRef} className="partha-scene">
          <div ref={artworkRef} className="partha-artwork">
            <img
              className="partha-illustration"
              src="/assets/aistudio/24506908-d5d7-4763-8b9b-3051f12b91ef_71482280.png"
              alt="Krishna guides Arjuna on a chariot"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              draggable={false}
            />
            <div className="partha-artwork-wash" aria-hidden="true" />
            <div className="partha-mobile-brand">
              <h1>PARTHA</h1>
              <p>Guiding Your Journey</p>
            </div>
            <svg
              className="partha-flight-art"
              viewBox="0 0 1365 768"
              preserveAspectRatio="xMinYMid slice"
              aria-hidden="true"
            >
              <path
                className="partha-bow"
                d="M 244 354 Q 178 441 255 531"
              />
              <path
                ref={bowStringRef}
                className="partha-bowstring"
                d="M 244 354 Q 248 443 255 531"
              />
              <g ref={arrowRef} className="partha-arrow">
                <path className="partha-arrow-trail" d="M 252 443 H 374" />
                <path className="partha-arrow-shaft" d="M 252 443 H 382" />
                <path className="partha-arrow-head" d="M 382 443 l -18 -8 m 18 8 l -18 8" />
                <path className="partha-arrow-fletching" d="M 263 443 l -12 -9 m 12 9 l -12 9" />
              </g>
              <path
                ref={destinationRef}
                className="partha-destination"
                d="M 1238 380 l 7 15 16 2 -12 10 4 16 -15 -8 -14 8 3 -16 -12 -10 16 -2 z"
              />
            </svg>
          </div>

          <div className="partha-feature-reel" aria-live="polite">
            {FEATURES.map(({ title, description, icon: Icon }, index) => (
              <article
                key={title}
                ref={(element) => {
                  if (element) featureRefs.current[index] = element;
                }}
                className="partha-feature"
              >
                <span className="partha-feature-mark">
                  <Icon size={20} strokeWidth={1.4} aria-hidden="true" />
                </span>
                <div>
                  <p className="partha-feature-index">0{index + 1} / 04</p>
                  <h2>{title}</h2>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="partha-scroll-cue" aria-hidden="true">
            <span>Scroll to follow the journey</span>
            <ArrowDown size={16} strokeWidth={1.4} />
          </div>
        </div>
      </section>

      <section className="partha-static-features" aria-label="Explore PARTHA">
        {FEATURES.map(({ title, description, icon: Icon }, index) => (
          <article className="partha-static-feature" key={title}>
            <span className="partha-feature-mark">
              <Icon size={20} strokeWidth={1.4} aria-hidden="true" />
            </span>
            <p className="partha-feature-index">0{index + 1} / 04</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="partha-auth-section" aria-labelledby="partha-auth-title">
        <div className="partha-auth-story">
          <span className="partha-auth-ornament" aria-hidden="true">
            <svg viewBox="0 0 240 72">
              <path d="M8 36h76m72 0h76M92 36c13-23 43-23 56 0-13 23-43 23-56 0Zm15 0h26m-13-13v26" />
              <path d="M120 4v13m0 38v13" />
            </svg>
          </span>
          <p className="partha-auth-eyebrow">A path forward, together</p>
          <h1 id="partha-auth-title">PARTHA</h1>
          <p className="partha-auth-subtitle">Guiding Your Journey</p>
          <p className="partha-auth-copy">
            Find the guidance, knowledge and community to take your next step.
          </p>
          <span className="partha-auth-signature">KLS VDIT · Alumni Hub</span>
        </div>
        <div className="partha-auth-form">{children}</div>
      </section>
    </main>
  );
}
