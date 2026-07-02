import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import { createServerClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";

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

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-[#f0f0f0] text-gray-900">
        <Navbar user={user} />
        <main id="site-main" className="flex-1">{children}</main>
        <footer id="site-footer" className="mt-auto border-t border-gray-200 bg-white py-8">
          <div className="app-container flex items-center gap-2 text-sm text-gray-500">
            <Image src="/logo.svg" alt="" width={24} height={24} />
            <span>RPG Manager</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
