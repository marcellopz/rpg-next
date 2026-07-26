"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CombatPreview } from "@/components/home/CombatPreview";
import { InventoryPreview } from "@/components/home/InventoryPreview";
import { buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/context";

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconGauge() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M12 15l3.5-3.5" />
      <path d="M20.3 18a10 10 0 1 0-16.6 0" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}
function IconTablet() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}
function IconTv() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
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
type Feature = {
  titleKey: string;
  textKey: string;
  icon: ReactNode;
};

const FEATURES: Feature[] = [
  {
    titleKey: "home.features.wiki",
    textKey: "home.features.wikiDesc",
    icon: <IconBook />,
  },
  {
    titleKey: "home.features.inventory",
    textKey: "home.features.inventoryDesc",
    icon: <IconBox />,
  },
  {
    titleKey: "home.features.combat",
    textKey: "home.features.combatDesc",
    icon: <IconBolt />,
  },
  {
    titleKey: "home.features.resources",
    textKey: "home.features.resourcesDesc",
    icon: <IconGauge />,
  },
  {
    titleKey: "home.features.handouts",
    textKey: "home.features.handoutsDesc",
    icon: <IconFile />,
  },
];

const INVENTORY_POINTS_KEYS = [
  "home.inventoryPoint1",
  "home.inventoryPoint2",
  "home.inventoryPoint3",
];

const COMBAT_POINTS_KEYS = [
  "home.combatPoint1",
  "home.combatPoint2",
  "home.combatPoint3",
];

export default function HomePage() {
  const { t } = useI18n();

  const features = FEATURES.map(f => ({
    ...f,
    title: t(f.titleKey),
    text: t(f.textKey),
  }));

  return (
    <div className="bg-[#f0f0f0]">
      {/* Hero — accent-driven CSS gradient, no background image */}
      <header id="home-hero" className="relative overflow-hidden bg-gradient-to-br from-accent-700 via-accent-600 to-accent-800 text-white">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-black/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center sm:py-32">
          <Image
            src="/logo-white.svg"
            alt=""
            width={64}
            height={64}
            className="mb-6 h-16 w-16"
          />
          <span className="mb-5 inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide">
            {t("home.tagline")}
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            {t("home.headline")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            {t("home.description")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/campaigns"
              className={cn(
                buttonVariants({ variant: "white", size: "lg" }),
                "font-semibold"
              )}
            >
              {t("home.cta")}
            </Link>
          </div>
        </div>
      </header>

      {/* Bento feature grid */}
      <section id="home-features" className="app-container py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold">{t("home.featureGridTitle")}</h2>
          <p className="mt-3 text-gray-600">
            {t("home.featureGridSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Featured (accent) card */}
          <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-accent-600 to-accent-700 p-8 text-white shadow-sm md:col-span-2 lg:col-span-2 lg:row-span-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              {features[0].icon}
            </div>
            <div className="mt-8">
              <h3 className="text-2xl font-semibold">{features[0].title}</h3>
              <p className="mt-2 max-w-md text-white/85">{features[0].text}</p>
            </div>
          </div>

          {/* Standard cards — a 2×2 block beside the 2×2 featured card */}
          {features.slice(1).map((f) => (
            <div
              key={f.titleKey}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Alternating showcase rows */}
      <section id="home-showcase" className="bg-white py-20">
        <div className="app-container space-y-20">
          {/* Inventory — text left, image right */}
          <div className="flex flex-col items-center gap-10 lg:flex-row">
            <div className="flex-1">
              <span className="text-sm font-semibold uppercase tracking-wide text-accent-600">
                {t("home.inventorySection")}
              </span>
              <h2 className="mt-2 text-3xl font-bold">{t("home.inventoryTitle")}</h2>
              <p className="mt-3 text-gray-600">
                {t("home.inventoryDesc")}
              </p>
              <ul className="mt-5 space-y-3">
                {INVENTORY_POINTS_KEYS.map((keyPath) => (
                  <li key={keyPath} className="flex items-start gap-3 text-gray-700">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    {t(keyPath)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-1 justify-center">
              <InventoryPreview />
            </div>
          </div>

          {/* Combat — image left, text right */}
          <div className="flex flex-col items-center gap-10 lg:flex-row-reverse">
            <div className="flex-1">
              <span className="text-sm font-semibold uppercase tracking-wide text-accent-600">
                {t("home.combatSection")}
              </span>
              <h2 className="mt-2 text-3xl font-bold">{t("home.combatTitle")}</h2>
              <p className="mt-3 text-gray-600">
                {t("home.combatDesc")}
              </p>
              <ul className="mt-5 space-y-3">
                {COMBAT_POINTS_KEYS.map((keyPath) => (
                  <li key={keyPath} className="flex items-start gap-3 text-gray-700">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    {t(keyPath)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-1 justify-center">
              <CombatPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Platforms — it's a browser app, so it goes wherever the table is */}
      <section id="home-platforms" className="app-container py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold">{t("home.features.platforms")}</h2>
          <p className="mt-3 text-gray-600">
            {t("home.features.platformsDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
              <IconPhone />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{t("home.features.phone")}</h3>
            <p className="mt-1 text-sm text-gray-600">
              {t("home.features.phoneDesc")}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
              <IconTablet />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{t("home.features.tablet")}</h3>
            <p className="mt-1 text-sm text-gray-600">
              {t("home.features.tabletDesc")}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
              <IconTv />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{t("home.features.screen")}</h3>
            <p className="mt-1 text-sm text-gray-600">
              {t("home.features.screenDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* CTA band — full-bleed accent */}
      <section id="home-cta" className="bg-accent-600">
        <div className="app-container flex flex-col items-center gap-6 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">{t("home.ready")}</h2>
          <p className="max-w-xl text-white/85">
            {t("home.readyDescription")}
          </p>
          <Link
            href="/campaigns"
            className={cn(
              buttonVariants({ variant: "white", size: "lg" }),
              "font-semibold"
            )}
          >
            {t("home.cta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
