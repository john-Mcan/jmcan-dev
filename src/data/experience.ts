import type { Locale } from '@/i18n/config'

export interface ExperienceEntry {
  /** Año de inicio; la primera entrada es el rol actual. */
  year: number
  org: string
  role: Record<Locale, string>
  summary: Record<Locale, string>
}

/** Contenido de ejemplo: reemplazar por la trayectoria real. */
export const EXPERIENCE: readonly ExperienceEntry[] = [
  {
    year: 2024,
    org: 'Empresa actual',
    role: { es: 'Desarrollador full-stack sénior', en: 'Senior full-stack developer' },
    summary: {
      es: 'Producto y arquitectura de una plataforma con tráfico en tiempo real.',
      en: 'Product and architecture for a real-time platform.',
    },
  },
  {
    year: 2021,
    org: 'Empresa anterior',
    role: { es: 'Desarrollador frontend', en: 'Frontend developer' },
    summary: {
      es: 'Interfaces de alto tráfico y el sistema de diseño del equipo.',
      en: 'High-traffic interfaces and the team design system.',
    },
  },
  {
    year: 2019,
    org: 'Primer trabajo',
    role: { es: 'Desarrollador web', en: 'Web developer' },
    summary: {
      es: 'Sitios y tiendas para clientes de distintos rubros.',
      en: 'Sites and stores for clients across industries.',
    },
  },
]
