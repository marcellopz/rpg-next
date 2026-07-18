import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "pt"] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale: localeParam }) => {
  const locale = (localeParam || "en") as Locale;
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: "UTC",
    now: new Date(),
  };
});
