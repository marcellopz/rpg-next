"use client";

import { useEffect, useState, type ComponentType } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/cn";
import { IconButton } from "@/components/ui";
import { CombatPreview } from "./CombatPreview";
import { HandoutsPreview } from "./HandoutsPreview";
import { InventoryPreview } from "./InventoryPreview";
import { MapPreview } from "./MapPreview";
import { ResourcesPreview } from "./ResourcesPreview";
import { WikiPreview } from "./WikiPreview";

type CarouselSlide = {
  titleKey: string;
  Preview: ComponentType;
};

const SLIDES: CarouselSlide[] = [
  { titleKey: "home.features.wiki", Preview: WikiPreview },
  { titleKey: "home.features.inventory", Preview: InventoryPreview },
  { titleKey: "home.features.map", Preview: MapPreview },
  { titleKey: "home.features.combat", Preview: CombatPreview },
  { titleKey: "home.features.resources", Preview: ResourcesPreview },
  { titleKey: "home.features.handouts", Preview: HandoutsPreview },
];

const AUTOPLAY_DELAY_MS = 5000;

export function HeroFeatureCarousel() {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length);
    }, AUTOPLAY_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, paused, reducedMotion]);

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + SLIDES.length) % SLIDES.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % SLIDES.length);
  }

  return (
    <section
      className="w-full rounded-2xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-sm sm:p-4"
      aria-label={t("home.carousel.label")}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-white/60">
            {activeIndex + 1} / {SLIDES.length}
          </p>
          <h2 className="truncate text-base font-semibold text-white sm:text-lg">
            {t(SLIDES[activeIndex].titleKey)}
          </h2>
        </div>
        <div className="flex shrink-0 gap-2">
          <IconButton
            aria-label={t("home.carousel.previous")}
            onClick={showPrevious}
            className="h-9 w-9 border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </IconButton>
          <IconButton
            aria-label={t("home.carousel.next")}
            onClick={showNext}
            className="h-9 w-9 border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </IconButton>
        </div>
      </div>

      <div className="relative h-[18rem] overflow-hidden rounded-xl sm:h-[20rem]">
        {SLIDES.map(({ titleKey, Preview }, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={titleKey}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} / ${SLIDES.length}: ${t(titleKey)}`}
              aria-hidden={!isActive}
              className={cn(
                "absolute inset-0 flex items-center justify-center transition duration-500",
                isActive
                  ? "translate-x-0 opacity-100"
                  : "pointer-events-none translate-x-3 opacity-0"
              )}
            >
              <Preview />
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-center gap-1" aria-hidden="true">
        {SLIDES.map(({ titleKey }, index) => (
          <span
            key={titleKey}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === activeIndex ? "w-6 bg-white" : "w-1.5 bg-white/35"
            )}
          />
        ))}
      </div>
    </section>
  );
}
