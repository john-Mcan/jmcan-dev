import { SITE } from '@/data/site'
import { LOCALES, pathFor, type Locale, type RouteRef } from '@/i18n'
import type { GlyphKey } from '@/lib/grid-field/glyph-keys'
import { getProjects } from '@/lib/projects'

/**
 * SEO del sitio: URL absolutas, la tarjeta para compartir de cada página y los nodos
 * de datos estructurados (JSON-LD) que junta `BaseLayout`.
 *
 * La preview (`pnpm deploy:preview`, que construye con `--mode preview`) usa su propio
 * origen y lleva `noindex`: sus tarjetas se ven al compartir un enlace y no compite con
 * producción en los buscadores.
 */
export const PREVIEW = import.meta.env.MODE === 'preview'
export const ORIGIN: string = PREVIEW ? SITE.previewUrl : SITE.url

export function absolute(path: string): string {
  return new URL(path, ORIGIN).href
}

export function urlFor(locale: Locale, route: RouteRef): string {
  return absolute(pathFor(locale, route))
}

/** robots.txt y llms.txt: texto plano en UTF-8, una línea por elemento. */
export function plainText(lines: string[]): Response {
  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

// ─── Tarjetas para compartir (Open Graph) ────────────────────────────────────

/** El tamaño que piden Open Graph y la tarjeta grande de X. */
export const OG_SIZE = { width: 1200, height: 630 } as const

/** La tarjeta de una página: `/og/proyectos/revra.png`; la home, `/og/index.png`. El 404 usa la de la home. */
export function ogImagePath(locale: Locale, route: RouteRef): string {
  const page: RouteRef = route.key === 'notFound' ? { key: 'home' } : route
  return `/og/${pathFor(locale, page).replace(/^\/|\/$/g, '') || 'index'}.png`
}

/** Lo que imprime una tarjeta (`src/pages/og/cards.json.ts`); la pinta `src/integrations/og-images.ts`. */
export interface OgCard {
  /** El PNG, relativo a la raíz del sitio. */
  file: string
  /** La ruta del prompt del header: `jm ~/<prompt>`. */
  prompt: string
  title: string
  lead: string
  /** Una línea corta bajo la bajada: el período y el estado, el cargo… */
  meta?: string
  /** A la derecha, lo que la grilla imprime (un glifo, el sobre o la marca `jm`) o una lista numerada. */
  art: GlyphKey | 'contact' | 'mark' | { list: string[] }
}

// ─── Datos estructurados (schema.org) ────────────────────────────────────────

type SchemaNode = Record<string, unknown>

const PERSON_ID = `${ORIGIN}/#person`
const WEBSITE_ID = `${ORIGIN}/#website`

/** Para citar a la persona desde otro nodo sin repetirla. */
export const PERSON_REF = { '@id': PERSON_ID }

/** Quién firma el sitio; `knowsAbout`, las tecnologías de sus proyectos. */
export async function personNode(locale: Locale): Promise<SchemaNode> {
  const stack = new Set((await getProjects(locale)).flatMap(({ entry }) => entry.data.stack))
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: SITE.name,
    url: absolute('/'),
    email: `mailto:${SITE.email}`,
    jobTitle: SITE.jobTitle[locale],
    knowsAbout: [...stack],
    sameAs: SITE.socials.map((social) => social.href),
  }
}

export function websiteNode(): SchemaNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: absolute('/'),
    name: SITE.name,
    inLanguage: [...LOCALES],
    publisher: PERSON_REF,
  }
}

/** Una página: su tipo (`ProfilePage`, `CollectionPage`, `ContactPage`…) y lo propio de ella. */
export function pageNode(
  type: string,
  locale: Locale,
  route: RouteRef,
  fields: SchemaNode,
): SchemaNode {
  const url = urlFor(locale, route)
  return {
    '@type': type,
    '@id': `${url}#page`,
    url,
    inLanguage: locale,
    isPartOf: { '@id': WEBSITE_ID },
    ...fields,
  }
}

/** Las migas desde el inicio: los buscadores las muestran en vez de la URL. */
export function breadcrumbs(
  locale: Locale,
  trail: { name: string; route: RouteRef }[],
): SchemaNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(({ name, route }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: urlFor(locale, route),
    })),
  }
}

/** El grafo de una página, listo para `<script type="application/ld+json">` (sin `</script>` posible). */
export async function schemaGraph(locale: Locale, nodes: SchemaNode[]): Promise<string> {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [websiteNode(), await personNode(locale), ...nodes],
  }
  return JSON.stringify(graph).replace(/</g, '\\u003c')
}
