export const LOCALES = ["en", "pt"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "pt";
}

export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return "en";
  const first = header.split(",")[0]?.trim().split(";")[0]?.toLowerCase() ?? "";
  return first.startsWith("pt") ? "pt" : "en";
}

export function localeCookieString(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
