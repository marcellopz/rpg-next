import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { PictoAvatar } from "@/components/PictoAvatar";

export const metadata: Metadata = {
  title: "RPG Campaign Manager",
  description: "Campaign wiki, character sheets, and a live combat log.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    null;
  // Seed the procedural avatar off the email (stable per user); fall back to
  // the user id if for some reason there's no email.
  const avatarSeed = user?.email ?? user?.id ?? "";

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-[#f0f0f0] text-gray-900">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 px-6 py-4 shadow-sm backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" className="h-9 w-9" />
                <span className="text-lg font-semibold text-gray-900">
                  RPG Manager
                </span>
              </Link>
              <Link
                href="/campaigns"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Campaigns
              </Link>
              <Link
                href="/library"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Library
              </Link>
            </div>

            <div className="flex items-center gap-3">
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
                    <span className="max-w-[12rem] truncate">
                      {displayName}
                    </span>
                  </Link>
                  <SignOutButton />
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-500"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-auto border-t border-gray-200 bg-white px-6 py-8">
          <div className="mx-auto flex max-w-6xl items-center gap-2 text-sm text-gray-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="h-6 w-6" />
            <span>RPG Manager</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
