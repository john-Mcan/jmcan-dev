import type { Locale } from './config'
import { en } from './ui/en'
import { es, type Dictionary } from './ui/es'

const DICTIONARIES: Record<Locale, Dictionary> = { es, en }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

/** Reemplaza `{clave}` por su valor: `fill('Ver los {count}', { count: 4 })`. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match))
}

export { DEFAULT_LOCALE, LOCALES, type Locale } from './config'
export { alternates, pathFor, type RouteKey, type RouteRef } from './routes'
