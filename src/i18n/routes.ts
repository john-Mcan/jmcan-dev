import { LOCALES, type Locale } from './config'

/**
 * Única fuente de las rutas por idioma: links, selector de idioma, hreflang y
 * sitemap salen de aquí. Astro no traduce segmentos (`proyectos` ↔ `projects`),
 * así que cada idioma tiene sus archivos en `src/pages` y este mapa los une.
 */
const PATHS = {
  home: { es: '/', en: '/en/' },
  projects: { es: '/proyectos/', en: '/en/projects/' },
  project: { es: '/proyectos/[slug]/', en: '/en/projects/[slug]/' },
  contact: { es: '/contacto/', en: '/en/contact/' },
  notFound: { es: '/404/', en: '/en/404/' },
} as const satisfies Record<string, Record<Locale, string>>

export type RouteKey = keyof typeof PATHS

export interface RouteRef {
  key: RouteKey
  slug?: string
}

export function pathFor(locale: Locale, route: RouteRef | RouteKey): string {
  const ref = typeof route === 'string' ? { key: route } : route
  const pattern: string = PATHS[ref.key][locale]
  return ref.slug === undefined ? pattern : pattern.replace('[slug]', ref.slug)
}

export function alternates(route: RouteRef): { locale: Locale; path: string }[] {
  return LOCALES.map((locale) => ({ locale, path: pathFor(locale, route) }))
}
