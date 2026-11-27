import { COPY } from '../content/copy';
import { Button } from '../components/Button';
import { LotusSvg } from '../components/MotifIcons';
import { useRouter, type AppRoute } from '../lib/router';

export function PlaceholderPage({ route }: { route: Exclude<AppRoute, '/'> }) {
  const { navigate } = useRouter();

  const routeCopyMap = {
    '/signup': COPY.routes.signup,
    '/forgot-password': COPY.routes.forgotPassword,
    '/dashboard': COPY.routes.dashboard,
    '/privacy': COPY.routes.privacy,
    '/terms': COPY.routes.terms,
  } as const;

  const current = routeCopyMap[route];
  const backLabel = 'signOutLabel' in current ? current.signOutLabel : current.backLabel;

  return (
    <main
      id="main-content"
      data-section-mode="dark"
      data-route={route}
      className="min-h-screen flex items-center justify-center px-5 py-16 bg-[var(--grad-bg)]"
    >
      <div className="gate-glass-card w-full max-w-md p-8 text-center">
        <div className="flex justify-center mb-5">
          <LotusSvg className="w-11 h-11 text-[var(--c-gold)]" />
        </div>
        <h1 className="text-card-h3 sm:text-3xl text-[var(--c-ivory)] mb-3">{current.title}</h1>
        <p className="text-sm sm:text-base text-[var(--c-ivory-dim)] mb-7 mx-auto">
          {current.body}
        </p>
        <Button variant="outline" fullWidth onClick={() => navigate('/')}>
          {backLabel}
        </Button>
      </div>
    </main>
  );
}
