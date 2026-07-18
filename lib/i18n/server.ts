import enMessages from "@/messages/en.json";
import ptMessages from "@/messages/pt.json";

export type Locale = "en" | "pt";

type Messages = Record<string, any>;

interface ServerI18nContext {
  t: (key: string, params?: Record<string, string | number>) => string;
}

const messages: Record<Locale, Messages> = {
  en: enMessages,
  pt: ptMessages,
};

/**
 * Get server-side translation function for a given locale.
 * Use this in server actions to return localized error/validation messages.
 *
 * @param locale - The locale to use ('en' or 'pt'). Defaults to 'en'.
 * @returns An object with a t() method for translating keys.
 *
 * @example
 * // In a server action
 * const i18n = await getServerTranslations(locale);
 * return { ok: false, error: i18n.t('validation.required', { field: 'Email' }) };
 */
export async function getServerTranslations(
  locale: Locale = "en"
): Promise<ServerI18nContext> {
  // Helper to get nested translation value with optional variable interpolation and pluralization
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = messages[locale];

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== "string") {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

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

  return { t };
}
