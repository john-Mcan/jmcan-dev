export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'es'

export const LOCALE_TAGS: Record<Locale, string> = { es: 'es', en: 'en' }
export const OG_LOCALES: Record<Locale, string> = { es: 'es_419', en: 'en_US' }

export function isLocale(value: string | undefined): value is Locale {
  return value === 'es' || value === 'en'
}
