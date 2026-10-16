import { getCollection, type CollectionEntry } from 'astro:content'
import type { Locale } from '@/i18n/config'

export interface Project {
  slug: string
  entry: CollectionEntry<'projects'>
}

type ProjectData = CollectionEntry<'projects'>['data']

/** Proyectos de un idioma, ordenados. El slug es el nombre del archivo, igual en ambos idiomas. */
export async function getProjects(locale: Locale): Promise<Project[]> {
  const entries = await getCollection('projects', (entry) => entry.id.startsWith(`${locale}/`))
  return entries
    .map((entry) => ({ slug: entry.id.slice(locale.length + 1), entry }))
    .sort((a, b) => a.entry.data.order - b.entry.data.order)
}

/** El año, o el rango si abarca más de uno: `2026`, `2025–2026`. */
export function period({ year, yearEnd }: Pick<ProjectData, 'year' | 'yearEnd'>): string {
  return yearEnd === undefined ? String(year) : `${year}–${yearEnd}`
}

/** El que sigue en la lista; después del último, el primero: el recorrido no termina. */
export function nextProject(projects: Project[], slug: string): Project | undefined {
  const index = projects.findIndex((project) => project.slug === slug)
  if (index < 0 || projects.length < 2) return undefined
  return projects[(index + 1) % projects.length]
}
