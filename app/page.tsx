"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CombatPreview } from "@/components/home/CombatPreview";
import { InventoryPreview } from "@/components/home/InventoryPreview";
import { buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";
import { sourceSerif } from "@/lib/fonts";
import { accentHatchStyle } from "@/lib/ui/accent-hatch";
import { useI18n } from "@/lib/i18n/context";

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function IconGauge() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 15l3.5-3.5" />
      <path d="M20.3 18a10 10 0 1 0-16.6 0" />
    </svg>
  );
}
function IconFile() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}
function IconTablet() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}
function IconTv() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="m21 8-9-5-9 5v8l9 5 9-5z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  );
}
function IconMap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
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
    titleKey: "home.features.map",
    textKey: "home.features.mapDesc",
    icon: <IconMap />,
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

const PLATFORMS = [
  {
    titleKey: "home.features.phone",
    textKey: "home.features.phoneDesc",
    icon: <IconPhone />,
  },
  {
    titleKey: "home.features.tablet",
    textKey: "home.features.tabletDesc",
    icon: <IconTablet />,
  },
  {
    titleKey: "home.features.screen",
    textKey: "home.features.screenDesc",
    icon: <IconTv />,
  },
] as const;

export default function HomePage() {
  const { t } = useI18n();

  const features = FEATURES.map((f) => ({
    ...f,
    title: t(f.titleKey),
    text: t(f.textKey),
  }));

  return (
    <div className="bg-[#f0f0f0]">
      {/* Hero â€” solid accent + hatch texture, brand first, product preview */}
      <header
        id="home-hero"
        className="relative overflow-hidden bg-accent-800 text-white"
        style={accentHatchStyle}
      >
        <div className="app-container relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <Image
                src="/logo-white.svg"
                alt=""
                width={48}
                height={48}
                className="h-12 w-12"
                priority
              />
              <p
                className={cn(sourceSerif.className, "text-2xl font-semibold tracking-tight sm:text-3xl")}
              >
                {t("home.brand")}
              </p>
            </div>
            <p className="mt-6 text-sm font-medium uppercase tracking-wider text-white/70">
              {t("home.tagline")}
            </p>
            <h1
              className={cn(sourceSerif.className, "mt-3 text-3xl font-bold leading-tight sm:text-4xl")}
            >
              {t("home.headline")}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
              {t("home.description")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href="/campaigns"
                className={cn(
                  buttonVariants({ variant: "white", size: "lg" }),
                  "font-semibold"
                )}
              >
                {t("home.cta")}
              </Link>
              <Link
                href="/campaigns/demo"
                className="text-sm font-medium text-white/90 underline-offset-4 hover:underline"
              >
                {t("home.demoCta")}
              </Link>
            </div>
          </div>

          <div className="min-w-0">
            <CombatPreview />
          </div>
        </div>
      </header>

      {/* Flat feature grid â€” no gradient featured tile */}
      <section id="home-features" className="app-container py-16 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className={cn(sourceSerif.className, "text-3xl font-bold")}>
            {t("home.featureGridTitle")}
          </h2>
          <p className="mt-3 text-gray-600">{t("home.featureGridSubtitle")}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.titleKey}
              className="border border-gray-200 bg-white p-6"
            >
              <div className="text-accent-700">{f.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">
                {f.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Alternating showcase rows */}
      <section id="home-showcase" className="bg-white py-16 sm:py-20">
        <div className="app-container space-y-16 sm:space-y-20">
          <div className="flex flex-col items-center gap-10 lg:flex-row">
            <div className="flex-1">
              <span className="text-sm font-semibold uppercase tracking-wide text-accent-600">
                {t("home.inventorySection")}
              </span>
              <h2
                className={cn(sourceSerif.className, "mt-2 text-3xl font-bold")}
              >
                {t("home.inventoryTitle")}
              </h2>
              <p className="mt-3 text-gray-600">{t("home.inventoryDesc")}</p>
              <ul className="mt-5 space-y-2.5 text-gray-700">
                {INVENTORY_POINTS_KEYS.map((keyPath) => (
                  <li key={keyPath} className="flex items-start gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent-600"
                      aria-hidden
                    />
                    {t(keyPath)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-1 justify-center">
              <InventoryPreview />
            </div>
          </div>

          <div className="flex flex-col items-center gap-10 lg:flex-row-reverse">
            <div className="flex-1">
              <span className="text-sm font-semibold uppercase tracking-wide text-accent-600">
                {t("home.combatSection")}
              </span>
              <h2
                className={cn(sourceSerif.className, "mt-2 text-3xl font-bold")}
              >
                {t("home.combatTitle")}
              </h2>
              <p className="mt-3 text-gray-600">{t("home.combatDesc")}</p>
              <ul className="mt-5 space-y-2.5 text-gray-700">
                {COMBAT_POINTS_KEYS.map((keyPath) => (
                  <li key={keyPath} className="flex items-start gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent-600"
                      aria-hidden
                    />
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

      {/* Platforms â€” single bordered strip, no card stack */}
      <section id="home-platforms" className="app-container py-16 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className={cn(sourceSerif.className, "text-3xl font-bold")}>
            {t("home.features.platforms")}
          </h2>
          <p className="mt-3 text-gray-600">
            {t("home.features.platformsDesc")}
          </p>
        </div>

        <div className="grid grid-cols-1 divide-y divide-gray-200 border border-gray-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {PLATFORMS.map((platform) => (
            <div key={platform.titleKey} className="px-6 py-8 text-center">
              <div className="mx-auto text-accent-700">{platform.icon}</div>
              <h3 className="mt-3 text-base font-semibold text-gray-900">
                {t(platform.titleKey)}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {t(platform.textKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band â€” solid accent */}
      <section id="home-cta" className="bg-accent-600">
        <div className="app-container flex flex-col items-center gap-6 py-16 text-center text-white">
          <h2 className={cn(sourceSerif.className, "text-3xl font-bold")}>
            {t("home.ready")}
          </h2>
          <p className="max-w-xl text-white/85">{t("home.readyDescription")}</p>
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


