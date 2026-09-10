"use client";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useI18n, type Locale } from "@/lib/i18n/context";

const OPTIONS: { locale: Locale; label: string }[] = [
  { locale: "en", label: "EN" },
  { locale: "pt", label: "PT" },
];

export function LanguageSwitcher({
  id = "site-language",
  className,
}: {
  id?: string;
  className?: string;
}) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      id={id}
      role="group"
      aria-label={t("navbar.language")}
      className={cn(
        "inline-flex rounded-md border border-gray-300 bg-gray-100 p-0.5",
        className
      )}
    >
      {OPTIONS.map((option) => {
        const active = locale === option.locale;
        return (
          <Button
            key={option.locale}
            size="xs"
            variant={active ? "primary" : "ghost"}
            aria-pressed={active}
            onClick={() => setLocale(option.locale)}
            className={cn(
              "min-w-[2.25rem] rounded px-2 py-1 text-[0.7rem] font-semibold tracking-wide",
              active
                ? "shadow-none"
                : "text-gray-600 hover:bg-transparent hover:text-gray-900"
            )}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
