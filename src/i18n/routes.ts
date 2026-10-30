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

/**
 * La ruta como la muestra el prompt del header (`~/<ruta>`): sin el prefijo del
 * idioma ni las barras de los extremos. La home es la ruta vacía.
 */
export function promptPath(locale: Locale, route: RouteRef | RouteKey): string {
  return pathFor(locale, route).slice(pathFor(locale, 'home').length).replace(/\/$/, '')
}

export function alternates(route: RouteRef): { locale: Locale; path: string }[] {
  return LOCALES.map((locale) => ({ locale, path: pathFor(locale, route) }))
}

/**
 * Al revés que `pathFor`: el idioma y la ruta de un path del sitio
 * (`/en/projects/revra/` → en, project, revra). El sitemap lo usa para sus alternates.
 */
export function routeAt(path: string): { locale: Locale; route: RouteRef } | undefined {
  for (const key of Object.keys(PATHS) as RouteKey[]) {
    for (const locale of LOCALES) {
      const [prefix = '', suffix] = PATHS[key][locale].split('[slug]')
      if (suffix === undefined) {
        if (path === prefix) return { locale, route: { key } }
        continue
      }
      const slug = path.slice(prefix.length, path.length - suffix.length)
      if (path.startsWith(prefix) && path.endsWith(suffix) && /^[^/]+$/.test(slug)) {
        return { locale, route: { key, slug } }
      }
    }
  }
  return undefined
}
