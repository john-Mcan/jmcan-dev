import { RIGHTS } from '@/data/rights'
import { EXPERIENCE, orgName } from '@/data/experience'
import { SITE } from '@/data/site'
import { fill, getDictionary, LOCALES, type Locale } from '@/i18n'
import { getProjects, period, type Project } from '@/lib/projects'
import { absolute, urlFor } from '@/lib/seo'

/**
 * llms.txt (https://llmstxt.org) y su versión completa: el sitio en Markdown para
 * agentes de IA, armado con los mismos textos y contenido que las páginas, y con la
 * política de uso arriba de todo (`src/data/rights.ts`).
 */

/** Lo que estos archivos necesitan y no está en los textos de la interfaz. */
const LABELS = {
  es: {
    language: 'Español',
    languages: 'Sitio en español (por defecto) e inglés (bajo /en/).',
    full: 'Todo el contenido del sitio en un archivo, en español e inglés.',
  },
  en: {
    language: 'English',
    languages: 'Site in Spanish (default) and English (under /en/).',
    full: "The whole site's content in one file, in Spanish and English.",
  },
} as const satisfies Record<Locale, unknown>

function header(): string[] {
  const year = new Date().getFullYear()
  return [
    `# ${SITE.name}`,
    '',
    `> ${getDictionary('es').meta.homeDescription}`,
    '',
    `${getDictionary('en').meta.homeDescription} ${LABELS.es.languages} ${LABELS.en.languages}`,
    '',
    ...LOCALES.flatMap((locale) => [
      `## ${RIGHTS[locale].agentsTitle}`,
      '',
      ...RIGHTS[locale].agents.map((rule) => `- ${rule}`),
      `- © ${year} ${SITE.name}. ${RIGHTS[locale].reserved} ${RIGHTS[locale].copying}`,
      '',
    ]),
  ]
}

function status(locale: Locale, project: Project): string {
  const t = getDictionary(locale)
  const { data } = project.entry
  const label = t.projects.statuses[data.status]
  return data.contributions ? fill(t.projects.contributions, { status: label }) : label
}

/** El índice: qué hay y dónde, con una línea por página y por proyecto. */
export async function llmsIndex(): Promise<string[]> {
  const sections = await Promise.all(
    LOCALES.map(async (locale) => {
      const t = getDictionary(locale)
      const projects = await getProjects(locale)
      return [
        `## ${LABELS[locale].language}`,
        '',
        `- [${t.nav.home}](${urlFor(locale, { key: 'home' })}): ${t.meta.homeDescription}`,
        `- [${t.nav.projects}](${urlFor(locale, { key: 'projects' })}): ${t.meta.projectsDescription}`,
        `- [${t.nav.contact}](${urlFor(locale, { key: 'contact' })}): ${t.meta.contactDescription}`,
        ...projects.map((project) => {
          const { data } = project.entry
          const url = urlFor(locale, { key: 'project', slug: project.slug })
          return `- [${data.title}](${url}): ${data.summary}. ${period(data)} · ${status(locale, project)}.`
        }),
        '',
      ]
    }),
  )
  return [
    ...header(),
    ...sections.flat(),
    '## Optional',
    '',
    `- [llms-full.txt](${absolute('/llms-full.txt')}): ${LABELS.es.full} ${LABELS.en.full}`,
  ]
}

/** Todo el texto del sitio: la home, la trayectoria, cada proyecto completo y el contacto. */
export async function llmsFull(): Promise<string[]> {
  const sections = await Promise.all(
    LOCALES.map(async (locale) => {
      const t = getDictionary(locale)
      const projects = await getProjects(locale)
      const facts = (project: Project) => {
        const { data } = project.entry
        const links = [
          [t.projects.live, data.links.live],
          [t.projects.store, data.links.store],
          [t.projects.repo, data.links.repo],
        ].filter(([, href]) => href !== undefined)
        return [
          `- ${t.projects.period}: ${period(data)}`,
          `- ${t.projects.status}: ${status(locale, project)}`,
          `- ${t.projects.role}: ${data.role}`,
          `- ${t.projects.stack}: ${data.stack.join(', ')}`,
          ...links.map(([label, href]) => `- ${label}: ${href}`),
        ]
      }
      return [
        `## ${LABELS[locale].language}`,
        '',
        `### ${t.nav.home}`,
        '',
        urlFor(locale, { key: 'home' }),
        '',
        `${fill(t.hero.kicker, { name: SITE.name })}. ${t.hero.lead}`,
        '',
        `- ${SITE.jobTitle[locale]}`,
        `- ${t.contact.email}: ${SITE.email}`,
        ...SITE.socials.map((social) => `- ${social.label}: ${social.href}`),
        '',
        `#### ${t.timeline.title}`,
        '',
        ...EXPERIENCE.map(
          (entry) =>
            `- ${entry.year}–${entry.end ?? t.timeline.present} · ${orgName(entry, locale)} · ${entry.role[locale]}: ${entry.summary[locale]}`,
        ),
        '',
        `### ${t.projects.indexTitle}`,
        '',
        urlFor(locale, { key: 'projects' }),
        '',
        t.projects.indexLead,
        '',
        ...projects.flatMap((project) => [
          `#### ${project.entry.data.title}`,
          '',
          urlFor(locale, { key: 'project', slug: project.slug }),
          '',
          `${project.entry.data.summary}.`,
          '',
          ...facts(project),
          '',
          // El texto del proyecto, con sus títulos tres niveles más abajo y sin marcas.
          (project.entry.body ?? '')
            .replace(/<!--[\s\S]*?-->\n*/g, '')
            .replace(/^(#{1,3}) /gm, '###$1 ')
            .trim(),
          '',
        ]),
        `### ${t.contact.title}`,
        '',
        urlFor(locale, { key: 'contact' }),
        '',
        t.contact.lead,
        '',
        `- ${t.contact.email}: ${SITE.email}`,
        '',
      ]
    }),
  )
  return [...header(), ...sections.flat()]
}
