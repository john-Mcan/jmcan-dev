import type { APIRoute } from 'astro'
import { SITE } from '@/data/site'
import { fill, getDictionary, LOCALES, promptPath, type RouteRef } from '@/i18n'
import { getProjects, period, yearSpan } from '@/lib/projects'
import { ogImagePath, type OgCard } from '@/lib/seo'

/**
 * Lo que imprime la tarjeta para compartir de cada página, con los textos y el
 * contenido del sitio. No se publica: `src/integrations/og-images.ts` la lee al
 * terminar el build, pinta los PNG en `/og/` y la borra.
 */
export const GET: APIRoute = async () => {
  const cards: OgCard[] = []
  for (const locale of LOCALES) {
    const t = getDictionary(locale)
    const projects = await getProjects(locale)
    const card = (route: RouteRef, fields: Omit<OgCard, 'file' | 'prompt'>) =>
      cards.push({
        file: ogImagePath(locale, route).slice(1),
        prompt: promptPath(locale, route),
        ...fields,
      })

    card(
      { key: 'home' },
      { title: SITE.name, lead: t.hero.lead, meta: SITE.jobTitle[locale], art: 'mark' },
    )
    card(
      { key: 'projects' },
      {
        title: t.projects.indexTitle,
        lead: t.projects.indexLead,
        meta: fill(t.projects.indexCount, { count: projects.length, years: yearSpan(projects) }),
        art: { list: projects.map(({ entry }) => entry.data.title) },
      },
    )
    card({ key: 'contact' }, { title: t.contact.title, lead: t.contact.lead, art: 'contact' })
    for (const { slug, entry } of projects) {
      const { data } = entry
      card(
        { key: 'project', slug },
        {
          title: data.title,
          lead: data.summary,
          meta: `${period(data)} · ${t.projects.statuses[data.status]}`,
          art: data.glyph,
        },
      )
    }
  }
  return Response.json(cards)
}
