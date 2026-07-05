"use client";

// Drop-in replacement for next/link on internal navigation. Keeps Link's
// prefetching, but routes the actual click through the NavigationProvider
// transition so the global progress bar shows immediately — including for
// search-param-only navigations that never trigger loading.tsx.
import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { useNavigation } from "./NavigationProvider";

type NavLinkProps = ComponentProps<typeof Link> & { href: string };

export function NavLink({ href, onClick, ...props }: NavLinkProps) {
  const { navigate } = useNavigation();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    // Let the browser handle modified clicks (new tab, download, etc.).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    navigate(href);
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
