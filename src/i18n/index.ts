import { createI18n } from "vue-i18n";
import ua from "@/i18n/locales/ua";
import en from "@/i18n/locales/en";

export const SUPPORTED_LOCALES = ["ua", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_STORAGE_KEY = "todo-locale-v1";
const DEFAULT_LOCALE: Locale = "ua";

const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);

const loadLocale = (): Locale => {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // localStorage unavailable — fall back to the default locale
  }
  return DEFAULT_LOCALE;
};

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: loadLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { ua, en },
});

/** Translate outside of a component setup (e.g. in composables). */
export const t = i18n.global.t;

export const setLocale = (locale: Locale): void => {
  i18n.global.locale.value = locale;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable — selection just won't persist
  }
  document.documentElement.lang = locale;
};

// Reflect the initial locale on the <html> element for accessibility/SEO.
document.documentElement.lang = i18n.global.locale.value;
