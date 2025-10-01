
import 'server-only'
import type { Locale } from './i18n-config'

const dictionaries = {
  en: () => import('./dictionaries/en').then((module) => module.default),
  de: () => import('./dictionaries/de').then((module) => module.default),
}

export const getDictionary = async (locale: Locale) => dictionaries[locale]()

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
