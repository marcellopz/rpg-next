import Image from "next/image";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { PictoAvatar } from "@/components/PictoAvatar";
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

export function Navbar({ user }: { user: User | null }) {
  const displayName = getDisplayName(user);
  // Seed the procedural avatar off the email (stable per user); fall back to
  // the user id if for some reason there's no email.
  const avatarSeed = user?.email ?? user?.id ?? "";

  return (
    <header id="site-header" className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 py-3 shadow-sm backdrop-blur sm:py-4">
      <nav id="site-nav" className="app-container flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
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

        <div id="site-auth" className="flex shrink-0 items-center gap-3">
          {user ? (
            <>
              <Link
                href="/account"
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <PictoAvatar
                  seed={avatarSeed}
                  size={40}
                  className="border border-gray-300"
                />
                <span className="hidden max-w-[12rem] truncate md:inline">
                  {displayName}
                </span>
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Sign in
            </Link>
          )}
        </div>

        <div id="site-nav-mobile" className="flex w-full items-center gap-5 border-t border-gray-100 pt-3 sm:hidden">
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
      </nav>
    </header>
  );
}
