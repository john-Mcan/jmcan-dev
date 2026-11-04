import type { Locale } from '@/i18n/config'

export interface ExperienceEntry {
  /** Año que muestra la línea de tiempo: el de inicio (en el rol más reciente, el año en curso). */
  year: number
  /** Año de término; sin él, es un rol actual (puede haber más de uno). */
  end?: number
  /** La organización: un nombre propio vale igual en los dos idiomas. */
  org: string | Record<Locale, string>
  role: Record<Locale, string>
  summary: Record<Locale, string>
}

export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    year: 2026,
    org: { es: 'Proyectos propios', en: 'Independent projects' },
    role: {
      es: 'Desarrollador full-stack',
      en: 'Full-stack developer',
    },
    summary: {
      es: 'Revra, operaciones financieras autónomas con agentes de IA (aplicación web). NEX, una experiencia en vivo donde la audiencia elige qué suena (web, apps nativas iOS y Android).',
      en: 'Revra, autonomous financial operations with AI agents (web app). NEX, a live experience where the audience picks what plays next (web, native iOS and Android apps).',
    },
  },
  {
    year: 2024,
    org: 'UPG',
    role: {
      es: 'Desarrollador full-stack y asistente comercial',
      en: 'Full-stack developer and sales assistant',
    },
    summary: {
      es: 'Desarrollo web full-stack y apoyo al área comercial.',
      en: 'Full-stack web development and support for the sales team.',
    },
  },
  {
    year: 2019,
    end: 2024,
    org: 'Freelance',
    role: { es: 'Desarrollador front-end', en: 'Front-end developer' },
    summary: {
      es: 'Desarrollo de interfaces web y móviles en Figma y código front-end.',
      en: 'Web and mobile interface development in Figma and front-end code.',
    },
  },
]

/** El nombre de la organización en el idioma pedido. */
export function orgName(entry: ExperienceEntry, locale: Locale): string {
  return typeof entry.org === 'string' ? entry.org : entry.org[locale]
}
