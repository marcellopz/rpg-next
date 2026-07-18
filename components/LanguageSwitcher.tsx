"use client";

import { Globe } from "lucide-react";
import { useI18n, type Locale } from "@/lib/i18n/context";
import { Menu, type MenuEntry } from "@/components/ui";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const entries: MenuEntry[] = [
    {
      label: "English",
      onSelect: () => setLocale("en"),
    },
    {
      label: "Português",
      onSelect: () => setLocale("pt"),
    },
  ];

  return (
    <Menu
      icon={Globe}
      entries={entries}
      label="Change language"
    />
  );
}
