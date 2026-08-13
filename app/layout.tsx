import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { getCurrentUser } from "@/lib/supabase/server";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { NavigationProvider } from "@/components/navigation/NavigationProvider";
import { getPendingInviteCountForCurrentUser } from "@/lib/queries/invites";

export const metadata: Metadata = {
  title: "RPG Campaign Manager",
  description: "Campaign wiki, character sheets, and a live combat log.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const pendingInviteCount = user ? await getPendingInviteCountForCurrentUser() : 0;

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-[#f0f0f0] text-gray-900">
        <I18nProvider>
          <NavigationProvider>
            <Navbar user={user} pendingInviteCount={pendingInviteCount} />
            <main id="site-main" className="flex-1">{children}</main>
            <Footer />
          </NavigationProvider>
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
