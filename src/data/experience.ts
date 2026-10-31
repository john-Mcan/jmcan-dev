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
      es: 'Construyo dos productos de punta a punta: Revra, agentes para las cuentas por cobrar (con un socio), y NEX, una experiencia en vivo donde la audiencia elige qué suena, con web y app para iOS y Android.',
      en: 'I build two products end to end: Revra, agents for accounts receivable (with a partner), and NEX, a live experience where the audience picks what plays next, on the web and on iOS and Android.',
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
    org: 'Hotel Monticello',
    role: { es: 'Recepcionista', en: 'Front desk agent' },
    summary: {
      es: 'Atención y registro de huéspedes en la recepción.',
      en: 'Guest service and check-in at the front desk.',
    },
  },
]

/** El nombre de la organización en el idioma pedido. */
export function orgName(entry: ExperienceEntry, locale: Locale): string {
  return typeof entry.org === 'string' ? entry.org : entry.org[locale]
}
