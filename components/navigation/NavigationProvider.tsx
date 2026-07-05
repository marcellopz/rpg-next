"use client";

// Global navigation feedback. Next.js only shows loading.tsx when the route
// *segment* changes — most clicks in this app (tool tabs, note pages,
// characters) only change search params, so the UI would sit frozen until the
// server render arrives. NavLink routes those clicks through a React
// transition and this provider shows a top progress bar while any navigation
// is in flight.
import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type NavigationContextValue = {
  /** Push `href` inside a transition so `isNavigating` tracks it. */
  navigate: (href: string) => void;
  isNavigating: boolean;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigation(): NavigationContextValue {
  const value = useContext(NavigationContext);
  if (!value) {
    throw new Error("useNavigation must be used inside <NavigationProvider>");
  }
  return value;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  return (
    <NavigationContext.Provider value={{ navigate, isNavigating }}>
      {isNavigating && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
        >
          <div className="nav-progress-bar h-full w-1/2 rounded-full bg-accent-600" />
        </div>
      )}
      {children}
    </NavigationContext.Provider>
  );
}
