import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RPG Campaign Manager",
  description: "Campaign wiki, character sheets, and a live combat log.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-gray-800 px-6 py-3">
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="font-semibold">
              RPG Manager
            </Link>
            <Link href="/campaigns" className="text-gray-300 hover:text-white">
              Campaigns
            </Link>
            <Link href="/library" className="text-gray-300 hover:text-white">
              Library
            </Link>
          </nav>
        </header>
        <main className="px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
