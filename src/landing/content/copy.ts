export type SectionMode = 'light' | 'dark';

export type SceneId = 'hero' | 'ashram' | 'bridge' | 'kurukshetra' | 'dawn-lake' | 'gate';

export interface StoryWaypointScene {
  id: Exclude<SceneId, 'hero'>;
  stopNumber: 1 | 2 | 3 | 4 | 5;
  mode: SectionMode;
  side: 'right' | 'left' | 'center';
  epicTitle: string;
  waypointLabel: string;
  stepTitle: string;
  body: string;
  alumniLine?: string;
  backdropClass: string;
}

export const COPY = {
  brand: {
    name: 'Partha',
    skipToContent: 'Skip to main content',
  },
  nav: {
    ariaLabel: 'Primary navigation',
    login: 'Log in',
  },
  hero: {
    id: 'hero' as const,
    mode: 'light' as SectionMode,
    title: 'Partha',
    tagline: 'Where every student finds a guru.',
    // CONFIRM: copy owner
    subline: 'Alumni mentorship for the path ahead.',
    cta: 'Follow the arrow',
    backdropClass: 'v3-backdrop-dawn',
  },
  pathOverlay: {
    ariaLabel: "The Arrow's Path",
  },
  waypoints: [
    {
      id: 'ashram',
      stopNumber: 1,
      mode: 'light',
      side: 'right',
      epicTitle: 'The Ashram',
      waypointLabel: 'Stop 1 of 5: The Ashram',
      stepTitle: 'Find your guru',
      // CONFIRM: copy owner
      body: 'Browse verified alumni from your college and find the guide who has walked your path.',
      backdropClass: 'v3-backdrop-warm-gold',
    },
    {
      id: 'bridge',
      stopNumber: 2,
      mode: 'dark',
      side: 'left',
      epicTitle: 'The Bridge of Stones',
      waypointLabel: 'Stop 2 of 5: The Bridge of Stones',
      stepTitle: 'Request mentorship',
      // CONFIRM: copy owner
      body: 'Send a request with your goal: Career Guidance, Resume Review, Internship Referral, or Project Help. Once your guru accepts, you can chat.',
      backdropClass: 'v3-backdrop-dusk',
    },
    {
      id: 'kurukshetra',
      stopNumber: 3,
      mode: 'dark',
      side: 'right',
      epicTitle: 'Kurukshetra',
      waypointLabel: 'Stop 3 of 5: Kurukshetra',
      stepTitle: 'Discover opportunities',
      // CONFIRM: copy owner
      body: 'Internships, jobs, and projects posted by verified alumni, all in one place.',
      backdropClass: 'v3-backdrop-night',
    },
    {
      id: 'dawn-lake',
      stopNumber: 4,
      mode: 'light',
      side: 'left',
      epicTitle: 'The Dawn Lake',
      waypointLabel: 'Stop 4 of 5: The Dawn Lake',
      stepTitle: 'Knowledge Hub',
      // CONFIRM: copy owner
      body: 'Guides written by alumni, upvoted so the most useful rise to the top. Save what you need for later.',
      // CONFIRM: copy owner
      alumniLine: 'Alumni: pass the lamp on. Join as alumni.',
      backdropClass: 'v3-backdrop-mint-gold',
    },
    {
      id: 'gate',
      stopNumber: 5,
      mode: 'light',
      side: 'center',
      epicTitle: 'The Gate',
      waypointLabel: 'Stop 5 of 5: The Gate',
      stepTitle: 'Login',
      // CONFIRM: copy owner
      body: 'Sign in with your college account or register as a student or alumnus to begin.',
      backdropClass: 'v3-backdrop-bright-gold',
    },
  ] satisfies readonly StoryWaypointScene[],
  card: {
    expandHint: 'Read step details',
    collapseHint: 'Hide details',
  },
  gate: {
    heading: 'Enter the Gurukul',
    loginCta: 'Log in',
    signupCta: 'Create your account',
  },
  footer: {
    creditLine: 'Inspired by the Ramayana and the Mahabharata.',
  },
} as const;
