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
      <body className="min-h-screen">
        <header className="border-b border-gray-800 px-6 py-3">
          <nav className="flex items-center justify-between gap-6 text-sm">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-semibold">
                RPG Manager
              </Link>
              <Link
                href="/campaigns"
                className="text-gray-300 hover:text-white"
              >
                Campaigns
              </Link>
              <Link href="/library" className="text-gray-300 hover:text-white">
                Library
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 text-gray-300 hover:text-white"
                  >
                    <PictoAvatar seed={avatarSeed} size={28} />
                    <span className="max-w-[12rem] truncate">
                      {displayName}
                    </span>
                  </Link>
                  <SignOutButton />
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500"
                >
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </header>
        <main className="px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
