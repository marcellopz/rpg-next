"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";
import { PictoAvatar } from "@/components/PictoAvatar";
import { SignInLink } from "@/components/SignInLink";
import { SignOutButton } from "@/components/SignOutButton";
import { buttonVariants } from "@/components/ui";

const NAV_LINKS = [
  { href: "/campaigns", label: "Campaigns" },
  { href: "/library", label: "Library" },
];

function getDisplayName(user: User | null): string | null {
  return (
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    null
  );
}

export function Navbar({
  user,
  pendingInviteCount = 0,
}: {
  user: User | null;
  pendingInviteCount?: number;
}) {
  const displayName = getDisplayName(user);
  const avatarSeed = user?.email ?? user?.id ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile menu whenever the user navigates to a new route.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header id="site-header" className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur">
      <nav id="site-nav" className="app-container flex items-center justify-between gap-x-6 py-3 sm:py-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image src="/logo.svg" alt="" width={36} height={36} priority />
            <span className="text-lg font-semibold text-gray-900">
              RPG Manager
            </span>
          </Link>

          <div id="site-nav-desktop" className="hidden items-center gap-6 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div id="site-auth" className="flex shrink-0 items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/account"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <span className="relative inline-flex">
                    <PictoAvatar
                      seed={avatarSeed}
                      size={40}
                      className="border border-gray-300"
                    />
                    {pendingInviteCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] font-semibold leading-none text-white ring-2 ring-white">
                        {pendingInviteCount > 9 ? "9+" : pendingInviteCount}
                      </span>
                    )}
                  </span>
                  <span className="hidden max-w-[12rem] truncate md:inline">
                    {displayName}
                  </span>
                </Link>
                <SignOutButton />
              </>
            ) : (
              <Suspense
                fallback={
                  <Link href="/login" className={buttonVariants({ size: "sm" })}>
                    Sign in
                  </Link>
                }
              >
                <SignInLink className={buttonVariants({ size: "sm" })} />
              </Suspense>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="ml-1 flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 sm:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="site-nav-mobile"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile drawer — hidden by default, toggled via hamburger */}
      {menuOpen && (
        <div
          id="site-nav-mobile"
          className="border-t border-gray-100 bg-white sm:hidden"
        >
          <div className="app-container flex flex-col py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
