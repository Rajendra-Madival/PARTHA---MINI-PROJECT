export type MotifName =
  | 'diya'
  | 'lotus'
  | 'bow'
  | 'chakra'
  | 'palmLeaf'
  | 'conch'
  | 'ratha'
  | 'dwara'
  | 'gopuram';

export interface HighlightItem {
  id: string;
  title: string;
  icon: MotifName;
  description: string;
  direction: 'left' | 'bottom' | 'right';
  details: readonly [string, string, string];
}

export interface GurukulPillar {
  id: string;
  title: string;
  body: string;
  sanskritLabel: string;
}

export interface EpicMilestone {
  step: number;
  threshold: number;
  title: string;
  description: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  field: string;
  city: string;
  tiltDeg: number;
  isPlaceholder: true;
}

export const COPY = {
  brand: {
    name: 'Partha',
    skipToContent: 'Skip to main content',
    logoLabel: 'Partha lotus emblem',
  },
  nav: {
    ariaLabel: 'Primary navigation',
    drawerLabel: 'Mobile navigation menu',
    links: [
      { label: 'Mentors', href: '#gurukul' },
      { label: 'Opportunities', href: '#highlights' },
      { label: 'How it works', href: '#epic-path' },
      { label: 'Stories', href: '#stories' },
    ],
    login: 'Log in',
    signup: 'Sign up',
    menuOpenLabel: 'Open navigation menu',
    menuCloseLabel: 'Close navigation menu',
  },
  hero: {
    title: 'Partha',
    tagline: 'Where every student finds a guru.',
    subline: 'Mentorship for the path ahead.',
    primaryCta: 'Enter the Gurukul',
    secondaryCta: 'Explore the journey',
    scrollCueLabel: 'Scroll to explore the journey',
  },
  question: {
    headingPrefix: 'Every seeker begins with a ',
    headingAccent: 'question.',
    followUp:
      'Partha answers it by connecting you with someone who has already walked that road.',
  },
  gurukul: {
    heading: 'The Gurukul, reimagined.',
    body: 'Partha connects students with mentors who have walked the road before them.',
    archLabelPrefix: 'Gurukul Arch',
    mobileRegionLabel: 'Gurukul pillars',
    pillars: [
      {
        id: 'serves',
        title: 'Who it serves',
        body: 'Students from school to postgraduate level, across fields and cities.',
        // VERIFY: native speaker review before launch
        sanskritLabel: 'शिष्य · The Seeker',
      },
      {
        id: 'works',
        title: 'How it works',
        body: 'Browse verified mentors, book a session, and grow over time.',
        // VERIFY: native speaker review before launch
        sanskritLabel: 'गुरु · The Guide',
      },
      {
        id: 'matters',
        title: 'Why it matters',
        body: 'Good guidance turns a question into a direction.',
        // VERIFY: native speaker review before launch
        sanskritLabel: 'मार्ग · The Path',
      },
    ] satisfies readonly GurukulPillar[],
  },
  highlights: {
    heading: 'Everything a seeker needs.',
    sub: 'Six tools for the road ahead.',
    learnMore: 'Learn more',
    showLess: 'Show less',
    // TODO(content): Confirm detail bullets with the product team (Section 6.4)
    items: [
      {
        id: 'find-your-guru',
        title: 'Find Your Guru',
        icon: 'diya',
        description: 'Browse verified mentors by field, skill, and experience.',
        direction: 'left',
        // TODO(content): Confirm detail bullets with the product team
        details: [
          'Filter by field, language, and experience',
          'See availability',
          'Read verified profiles',
        ],
      },
      {
        id: 'book-guidance-sessions',
        title: 'Book Guidance Sessions',
        icon: 'lotus',
        description: 'Schedule one-to-one or group mentoring calls.',
        direction: 'bottom',
        // TODO(content): Confirm detail bullets with the product team
        details: [
          'One-to-one or group calls',
          'Pick a time that fits',
          'Reminders before each session',
        ],
      },
      {
        id: 'discover-opportunities',
        title: 'Discover Opportunities',
        icon: 'bow',
        description:
          'Internships, scholarships, competitions, and fellowships curated for students.',
        direction: 'right',
        // TODO(content): Confirm detail bullets with the product team
        details: [
          'Internships, scholarships, competitions, fellowships',
          'Matched to your profile',
          'Deadlines in one place',
        ],
      },
      {
        id: 'track-your-growth',
        title: 'Track Your Growth',
        icon: 'chakra',
        description:
          'A personal dashboard with goals, dharma-aligned milestones, and progress.',
        direction: 'left',
        // TODO(content): Confirm detail bullets with the product team
        details: [
          'Set goals with your mentor',
          'Milestones and progress',
          'Session history',
        ],
      },
      {
        id: 'community-of-shishyas',
        title: 'Community of Shishyas',
        icon: 'palmLeaf',
        description: 'Peer discussions, study circles, and shared learning.',
        direction: 'bottom',
        // TODO(content): Confirm detail bullets with the product team
        details: [
          'Topic-based discussion rooms',
          'Study circles',
          'Peer Q&A',
        ],
      },
      {
        id: 'mentor-insights',
        title: 'Mentor Insights',
        icon: 'conch',
        description:
          'Ratings, reviews, and profiles to help you choose with confidence.',
        direction: 'right',
        // TODO(content): Confirm detail bullets with the product team
        details: [
          'Ratings and reviews',
          'Verified credentials',
          'Clear session summaries',
        ],
      },
    ] satisfies readonly HighlightItem[],
  },
  epicPath: {
    heading: 'Your path, step by step.',
    stepPrefix: 'Step',
    milestones: [
      {
        step: 1,
        threshold: 0.2,
        title: 'Create your profile',
        description:
          'Tell us your field, your goals, and where you are starting from.',
      },
      {
        step: 2,
        threshold: 0.45,
        title: 'Meet your mentor',
        description: 'Match with a guide who has walked a similar road.',
      },
      {
        step: 3,
        threshold: 0.7,
        title: 'Learn and grow together',
        description: 'Sessions, goals, and feedback that build over time.',
      },
      {
        step: 4,
        threshold: 0.9,
        title: 'Unlock opportunities',
        description:
          'Internships, scholarships, and competitions matched to your growth.',
      },
    ] satisfies readonly EpicMilestone[],
  },
  stories: {
    heading: 'Words from the road.',
    sampleBadge: 'Sample testimonial',
    prevLabel: 'Previous story',
    nextLabel: 'Next story',
    pauseLabel: 'Pause stories',
    playLabel: 'Resume stories',
    pauseText: 'Pause',
    playText: 'Play',
    slidesListLabel: 'Story slides',
    slideTabPrefix: 'Show story',
    activeIndicatorLabel: 'Featured story',
    // PLACEHOLDER: Confirm real student testimonials before launch (Section 6.6 & 14)
    items: [
      {
        id: 'sample-1',
        // PLACEHOLDER
        quote:
          'My first session turned months of scattered reading into a clear six-week plan for my fellowship application.',
        name: 'Aarav Sharma', // PLACEHOLDER
        field: 'Undergraduate · Computer Science', // PLACEHOLDER
        city: 'Pune', // PLACEHOLDER
        tiltDeg: -0.9,
        isPlaceholder: true,
      },
      {
        id: 'sample-2',
        // PLACEHOLDER
        quote:
          'Having a mentor who came from a small town helped me prepare for scholarship interviews without second-guessing myself.',
        name: 'Meera Nair', // PLACEHOLDER
        field: 'Class 12 · Humanities', // PLACEHOLDER
        city: 'Kochi', // PLACEHOLDER
        tiltDeg: 0.7,
        isPlaceholder: true,
      },
      {
        id: 'sample-3',
        // PLACEHOLDER
        quote:
          'The opportunity deadlines and study circles kept me consistent through my first research internship search.',
        name: 'Rohan Verma', // PLACEHOLDER
        field: 'Postgraduate · Biotechnology', // PLACEHOLDER
        city: 'Jaipur', // PLACEHOLDER
        tiltDeg: -0.5,
        isPlaceholder: true,
      },
    ] satisfies readonly TestimonialItem[],
  },
  login: {
    heading: 'Walk through the gate.',
    // VERIFY: native speaker review before launch
    sanskritSubtitle: 'द्वार · The Threshold of Guidance',
    subheading: 'Sign in to continue your mentorship journey.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    showPasswordLabel: 'Show password',
    hidePasswordLabel: 'Hide password',
    forgotPassword: 'Forgot password?',
    submitIdle: 'Begin Your Journey',
    dividerOr: 'or',
    googleCta: 'Continue with Google',
    otpCta: 'Continue with Email OTP',
    newSeeker: 'New seeker?',
    createAccount: 'Create your account',
  },
  footer: {
    heading: 'Footer navigation',
    columns: [
      {
        heading: 'Product',
        links: [
          { label: 'Mentors', href: '#gurukul' },
          { label: 'Opportunities', href: '#highlights' },
          { label: 'How it works', href: '#epic-path' },
        ],
      },
      {
        heading: 'Company',
        links: [
          // TODO(content): Replace placeholder anchor with About page when ready
          { label: 'About', href: '#gurukul' },
          // TODO(content): Replace placeholder anchor with Contact page when ready
          { label: 'Contact', href: '#login-gate' },
        ],
      },
      {
        heading: 'Legal',
        links: [
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ],
      },
      {
        heading: 'Social',
        links: [
          // TODO(content): Replace placeholder social links
          { label: 'LinkedIn', href: '#' },
          { label: 'Instagram', href: '#' },
          { label: 'X / Twitter', href: '#' },
        ],
      },
    ],
    copyrightOwner: 'Partha. All rights reserved.',
    // VERIFY: native speaker review before launch
    shloka: 'विद्या ददाति विनयम्',
    shlokaTranslation: 'Knowledge gives humility',
  },
  routes: {
    signup: {
      title: 'Create your seeker profile',
      body: 'Registration is coming soon. Return to the gate to explore Partha.',
      backLabel: 'Back to Partha',
    },
    forgotPassword: {
      title: 'Reset your password',
      body: 'Password recovery will be connected in the auth phase. Return to the gate for now.',
      backLabel: 'Back to login',
    },
    dashboard: {
      title: 'Welcome to the Gurukul',
      body: 'You have crossed the gate. Your mentor matches, sessions, and opportunities live here.',
      signOutLabel: 'Return to landing page',
    },
    privacy: {
      title: 'Privacy Policy',
      body: 'Placeholder privacy notice for Partha. Confirm final legal copy before launch.',
      backLabel: 'Back to Partha',
    },
    terms: {
      title: 'Terms of Service',
      body: 'Placeholder terms of service for Partha. Confirm final legal copy before launch.',
      backLabel: 'Back to Partha',
    },
  },
} as const;
