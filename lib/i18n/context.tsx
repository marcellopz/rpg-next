"use client";

import { createContext, useContext, useEffect, useState } from "react";
import enMessages from "@/messages/en.json";
import ptMessages from "@/messages/pt.json";

export type Locale = "en" | "pt";

type Messages = Record<string, any>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const messages: Record<Locale, Messages> = {
  en: enMessages,
  pt: ptMessages,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Load saved preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("locale") as Locale | null;
      if (saved && messages[saved]) {
        setLocaleState(saved);
      } else {
        // Detect browser language
        const browserLang = navigator.language.split("-")[0];
        if (browserLang === "pt") {
          setLocaleState("pt");
        } else {
          setLocaleState("en");
        }
      }
    } catch (e) {
      // localStorage might not be available in some contexts
      console.error("Failed to load locale preference:", e);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("locale", newLocale);
    } catch (e) {
      console.error("Failed to save locale preference:", e);
    }
  };

  // Helper to get nested translation value with optional variable interpolation and pluralization
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = messages[locale];

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== "string") return key;

    // Replace placeholders with parameter values and handle pluralization
    if (params) {
      return value.replace(/\{([^}]+)\}/g, (match, placeholder) => {
        const trimmed = placeholder.trim();

        // Handle plural syntax: {count, plural, =1 {singular} other {plural}}
        if (trimmed.includes("plural")) {
          const pluralMatch = trimmed.match(/(\w+)\s*,\s*plural\s*,\s*(.+)/);
          if (pluralMatch) {
            const countKey = pluralMatch[1];
            const count = params[countKey];
            const rules = pluralMatch[2];

            // Parse plural rules: =1 {one} other {many}
            const ruleMatches = rules.matchAll(/=?(\d+|\w+)\s*\{([^}]+)\}/g);
            for (const ruleMatch of ruleMatches) {
              const condition = ruleMatch[1];
              const text = ruleMatch[2];

              if (condition === "other" && typeof count === "number") {
                return text;
              } else if (condition === String(count)) {
                return text;
              }
            }

            // Fallback to "other"
            const otherMatch = rules.match(/other\s*\{([^}]+)\}/);
            if (otherMatch) return otherMatch[1];
          }
        }

        // Standard parameter replacement
        return String(params[trimmed] ?? match);
      });
    }

    return value;
  };

  const contextValue = { locale, setLocale, t };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
