import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type AppRoute = '/' | '/signup' | '/forgot-password' | '/dashboard' | '/privacy' | '/terms';

const KNOWN_ROUTES = new Set<string>([
  '/',
  '/signup',
  '/forgot-password',
  '/dashboard',
  '/privacy',
  '/terms',
]);

function normalizePath(pathname: string): AppRoute {
  if (KNOWN_ROUTES.has(pathname)) {
    return pathname as AppRoute;
  }
  return '/';
}

interface RouterContextValue {
  route: AppRoute;
  navigate: (to: AppRoute) => void;
}

const RouterContext = createContext<RouterContextValue>({
  route: '/',
  navigate: () => {},
});

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? normalizePath(window.location.pathname) : '/',
  );

  useEffect(() => {
    const onPopState = () => {
      setRoute(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: AppRoute) => {
    if (typeof window !== 'undefined' && window.location.pathname !== to) {
      window.history.pushState({}, '', to);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    setRoute(to);
  }, []);

  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterContextValue {
  return useContext(RouterContext);
}
