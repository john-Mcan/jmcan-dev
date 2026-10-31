import type { Locale } from '@/i18n/config'

export interface ExperienceEntry {
  /** Año de inicio; las entradas van de la más reciente a la más antigua. */
  year: number
  /** Año de término; sin él, es un rol actual (puede haber más de uno). */
  end?: number
  org: string
  role: Record<Locale, string>
  summary: Record<Locale, string>
}

export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    year: 2025,
    org: 'Revra · NEX',
    role: {
      es: 'Cofundador y desarrollador full-stack',
      en: 'Co-founder and full-stack developer',
    },
    summary: {
      es: 'Producto y desarrollo de Revra, agentes para las cuentas por cobrar, y de NEX, una radio donde la audiencia elige qué suena.',
      en: 'Product and development for Revra, agents for accounts receivable, and NEX, a radio station where the audience picks what plays next.',
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
