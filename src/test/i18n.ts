import { i18n, setLocale, type Locale } from "@/i18n";

/**
 * Shared mount options that install the real app-wide i18n instance, so
 * components that call `useI18n()` and helpers that call `setLocale()` operate
 * on the same instance.
 */
export const globalMountOptions = {
  plugins: [i18n],
};

/** Reset the active locale between tests for deterministic assertions. */
export const resetLocale = (locale: Locale = "ua"): void => {
  setLocale(locale);
};
