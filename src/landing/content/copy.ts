export type MotifName =
  | 'lamp'
  | 'lotus'
  | 'bow'
  | 'palmLeaf'
  | 'shield'
  | 'conch'
  | 'chakra'
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
    logoLabel: 'Partha lotus and bow emblem',
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
    // CONFIRM: copy owner
    subline: 'Alumni mentorship for the path ahead.',
    primaryCta: 'Enter the Gurukul',
    secondaryCta: 'Explore the journey',
    scrollCueLabel: 'Scroll to explore the journey',
    replayShotLabel: "Replay the archer's shot",
  },
  question: {
    headingPrefix: 'Every seeker begins with a ',
    headingAccent: 'question.',
    followUp:
      'Partha answers it by connecting you with someone who has already walked that road.',
  },
  gurukul: {
    heading: 'The Gurukul, reimagined.',
    // CONFIRM: copy owner
    body: 'Partha connects students with alumni who have walked the road before them.',
    sceneLabel: 'Gurukul courtyard under a banyan tree with a sage-teacher and three students',
    pillars: [
      {
        id: 'serves',
        title: 'Who it serves',
        // CONFIRM: copy owner
        body: 'Students looking for guidance, and alumni ready to give back.',
        // VERIFY: native speaker review before launch
        sanskritLabel: 'शिष्य · The Seeker',
      },
      {
        id: 'works',
        title: 'How it works',
        // CONFIRM: copy owner
        body: 'Find an alumnus, send a request, and keep talking once they accept.',
        // VERIFY: native speaker review before launch
        sanskritLabel: 'गुरु · The Guide',
      },
      {
        id: 'matters',
        title: 'Why it matters',
        // CONFIRM: copy owner
        body: "A senior's advice turns a question into a direction.",
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
    items: [
      {
        id: 'find-your-guru',
        title: 'Find Your Guru',
        icon: 'lamp',
        // CONFIRM: copy owner
        description: 'Browse verified alumni by branch, company, domain, and skills.',
        direction: 'left',
        // CONFIRM: copy owner
        details: [
          'Filter by branch, domain, and company',
          'See what each alumnus is open to',
          'Read public profiles',
        ],
      },
      {
        id: 'request-mentorship',
        title: 'Request Mentorship',
        icon: 'lotus',
        // CONFIRM: copy owner
        description:
          'Ask for career guidance, a resume review, an internship referral, or project help.',
        direction: 'bottom',
        // CONFIRM: copy owner
        details: [
          'Choose your goal',
          'Send a short message',
          'Chat once the alumnus accepts',
        ],
      },
      {
        id: 'discover-opportunities',
        title: 'Discover Opportunities',
        icon: 'bow',
        // CONFIRM: copy owner
        description: 'Internships, jobs, and projects posted by verified alumni.',
        direction: 'right',
        // CONFIRM: copy owner
        details: [
          'Internships, full-time roles, and collaborative projects',
          'Posted by verified alumni',
          'Apply through the listed link',
        ],
      },
      {
        id: 'knowledge-hub',
        title: 'Knowledge Hub',
        icon: 'palmLeaf',
        // CONFIRM: copy owner
        description: 'Interview prep and career guides written by alumni.',
        direction: 'left',
        // CONFIRM: copy owner
        details: [
          'Guides by domain',
          'Read time shown',
          'Upvote the ones that help',
        ],
      },
      {
        id: 'verified-and-private',
        title: 'Verified and Private',
        icon: 'shield',
        // CONFIRM: copy owner
        description:
          'Alumni are verified, and their contact details unlock only after they accept you.',
        direction: 'bottom',
        // CONFIRM: copy owner
        details: [
          'Verification status on every profile',
          'Email, phone, and LinkedIn stay private',
          'Shared only after acceptance',
        ],
      },
      {
        id: 'save-for-later',
        title: 'Save for Later',
        icon: 'conch',
        // CONFIRM: copy owner
        description: 'Bookmark alumni and opportunities to come back to.',
        direction: 'right',
        // CONFIRM: copy owner
        details: [
          'Save mentors and listings',
          'Keep a shortlist',
          'Return when you are ready',
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
          'Share your branch, semester, and the skills, domain, and company you are aiming for.',
      },
      {
        step: 2,
        threshold: 0.45,
        title: 'Meet your alumni mentor',
        description: 'Browse verified alumni and find someone who has walked your road.',
      },
      {
        step: 3,
        threshold: 0.7,
        title: 'Ask and learn',
        description: 'Send a mentorship request, and chat once it is accepted.',
      },
      {
        step: 4,
        threshold: 0.9,
        title: 'Unlock opportunities',
        description: 'Find internships, jobs, and projects posted by alumni.',
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
    // PLACEHOLDER: Confirm real student testimonials before launch (v1 Section 14)
    items: [
      {
        id: 'sample-1',
        // PLACEHOLDER
        quote:
          'One resume review from an alumnus in my domain turned scattered preparation into a clear six-week plan.',
        name: 'Aarav Sharma', // PLACEHOLDER
        field: 'Semester 6 · Computer Science', // PLACEHOLDER
        city: 'Hubballi', // PLACEHOLDER
        tiltDeg: -0.9,
        isPlaceholder: true,
      },
      {
        id: 'sample-2',
        // PLACEHOLDER
        quote:
          'Reading alumni interview guides and getting honest project help gave me confidence before my internship applications.',
        name: 'Meera Nair', // PLACEHOLDER
        field: 'Semester 5 · Information Science', // PLACEHOLDER
        city: 'Belagavi', // PLACEHOLDER
        tiltDeg: 0.7,
        isPlaceholder: true,
      },
      {
        id: 'sample-3',
        // PLACEHOLDER
        quote:
          'Bookmarking relevant roles and talking directly with a senior mentor after acceptance kept my job search focused.',
        name: 'Rohan Verma', // PLACEHOLDER
        field: 'Semester 7 · Electronics & Communication', // PLACEHOLDER
        city: 'Bengaluru', // PLACEHOLDER
        tiltDeg: -0.5,
        isPlaceholder: true,
      },
    ] satisfies readonly TestimonialItem[],
  },
  giveBack: {
    heading: 'Walked the road? Guide the next seeker.',
    // CONFIRM: copy owner
    body: 'Alumni can mentor students, post internships and jobs, and share guides.',
    cta: 'Join as alumni',
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
    creditLine: 'Inspired by the Ramayana and the Mahabharata.',
  },
  routes: {
    signup: {
      title: 'Create your seeker profile',
      body: 'Registration will connect to the Partha portal in the next phase. Return to the gate to explore Partha.',
      backLabel: 'Back to Partha',
    },
    forgotPassword: {
      title: 'Reset your password',
      body: 'Password recovery will be connected in the auth phase. Return to the gate for now.',
      backLabel: 'Back to login',
    },
    dashboard: {
      title: 'Welcome to the Gurukul',
      body: 'You have crossed the gate. Your mentor matches, conversations, and opportunities live here.',
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
