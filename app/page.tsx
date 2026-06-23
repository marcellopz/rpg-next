import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="m21 8-9-5-9 5v8l9 5 9-5z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconTv() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

type Feature = {
  title: string;
  text: string;
  icon: ReactNode;
};

const FEATURES: Feature[] = [
  {
    title: "Wiki pages",
    text: "OneNote-style rich-text pages organized into categories so your lore never gets lost.",
    icon: <IconBook />,
  },
  {
    title: "Character sheets",
    text: "Flexible sheets for every player and NPC in your party.",
    icon: <IconUser />,
  },
  {
    title: "Party inventory",
    text: "Track shared loot, currency, and who is carrying what.",
    icon: <IconBox />,
  },
  {
    title: "Live combat log",
    text: "A realtime, append-only log of attacks, rolls, and notes.",
    icon: <IconBolt />,
  },
  {
    title: "Member invites",
    text: "Invite players with a link and manage their roles.",
    icon: <IconUsers />,
  },
  {
    title: "TV display",
    text: "A read-only surface that broadcasts the action to your living-room TV.",
    icon: <IconTv />,
  },
];

const INVENTORY_POINTS = [
  "Add, edit, and move items between characters.",
  "Track quantities, currency, and a shared party stash.",
  "Keep an audit log of every change.",
];

const COMBAT_POINTS = [
  "Append rolls and attacks in realtime as the round unfolds.",
  "Everyone at the table sees the same log instantly.",
  "Mirror it to the TV for a shared battle view.",
];

export default function HomePage() {
  return (
    <div className="bg-[#f0f0f0]">
      {/* Hero — accent-driven CSS gradient, no background image */}
      <header className="relative overflow-hidden bg-gradient-to-br from-accent-700 via-accent-600 to-accent-800 text-white">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-black/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center sm:py-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-white.svg" alt="" className="mb-6 h-16 w-16" />
          <span className="mb-5 inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide">
            Your table, all in one place
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Run unforgettable campaigns without the chaos
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            A campaign wiki with rich-text pages, character sheets and
            inventories, a live combat log, member invites, and a read-only TV
            display surface.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/campaigns"
              className={cn(
                buttonVariants({ variant: "white", size: "lg" }),
                "font-semibold"
              )}
            >
              Go to campaigns
            </Link>
            <Link
              href="/library"
              className="rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Personal library
            </Link>
          </div>
        </div>
      </header>

      {/* Bento feature grid */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Everything your table needs</h2>
          <p className="mt-3 text-gray-600">
            One tool for prep, play, and everything in between.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Featured (accent) card */}
          <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-accent-600 to-accent-700 p-8 text-white shadow-sm md:col-span-2 lg:col-span-2 lg:row-span-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              {FEATURES[0].icon}
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-semibold">{FEATURES[0].title}</h3>
              <p className="mt-2 max-w-md text-white/85">{FEATURES[0].text}</p>
            </div>
          </div>

          {/* Standard cards */}
          {FEATURES.slice(1, 5).map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.text}</p>
            </div>
          ))}

          {/* Wide card */}
          <div className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:col-span-2 lg:col-span-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
              {FEATURES[5].icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{FEATURES[5].title}</h3>
              <p className="mt-1 text-sm text-gray-600">{FEATURES[5].text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Alternating showcase rows */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl space-y-20 px-6">
          {/* Inventory — text left, image right */}
          <div className="flex flex-col items-center gap-10 lg:flex-row">
            <div className="flex-1">
              <span className="text-sm font-semibold uppercase tracking-wide text-accent-600">
                Inventory
              </span>
              <h2 className="mt-2 text-3xl font-bold">Manage party loot</h2>
              <p className="mt-3 text-gray-600">
                Keep the whole party&apos;s gear in one place, always in sync.
              </p>
              <ul className="mt-5 space-y-3">
                {INVENTORY_POINTS.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-gray-700">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-1 justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/home/screenshot-inventory.svg"
                alt="Inventory screenshot placeholder"
                className="w-full max-w-xl rounded-xl border border-gray-200 shadow-sm"
              />
            </div>
          </div>

          {/* Combat — image left, text right */}
          <div className="flex flex-col items-center gap-10 lg:flex-row-reverse">
            <div className="flex-1">
              <span className="text-sm font-semibold uppercase tracking-wide text-accent-600">
                Combat
              </span>
              <h2 className="mt-2 text-3xl font-bold">Run combat in realtime</h2>
              <p className="mt-3 text-gray-600">
                A shared, live battle log that keeps everyone on the same beat.
              </p>
              <ul className="mt-5 space-y-3">
                {COMBAT_POINTS.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-gray-700">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-1 justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/home/screenshot-combat.svg"
                alt="Combat tracker placeholder"
                className="w-full max-w-xl rounded-xl border border-gray-200 shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA band — full-bleed accent */}
      <section className="bg-accent-600">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">Ready to roll initiative?</h2>
          <p className="max-w-xl text-white/85">
            Spin up a campaign and bring your whole table along — players, lore,
            loot, and all.
          </p>
          <Link
            href="/campaigns"
            className={cn(
              buttonVariants({ variant: "white", size: "lg" }),
              "font-semibold"
            )}
          >
            Go to campaigns
          </Link>
        </div>
      </section>
    </div>
  );
}
