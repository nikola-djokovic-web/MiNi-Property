import "server-only";
import type { Locale } from "./i18n-config";

const dictionaries = {
  en: () => import("./dictionaries/en").then((m) => m.default),
  de: () => import("./dictionaries/de").then((m) => m.default),
};

export const getDictionary = async (locale: Locale) => {
  try {
    const dictionaryLoader = dictionaries[locale as keyof typeof dictionaries];
    if (!dictionaryLoader) {
      console.warn(`Dictionary not found for locale: ${locale}, falling back to 'en'`);
      return await dictionaries.en();
    }
    return await dictionaryLoader();
  } catch (error) {
    console.error('Error loading dictionary for locale:', locale, error);
    return await dictionaries.en();
  }
};
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
