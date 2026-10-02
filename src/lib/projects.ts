import { getCollection, type CollectionEntry } from 'astro:content'
import type { Locale } from '@/i18n/config'

export interface Project {
  slug: string
  entry: CollectionEntry<'projects'>
}

/** Proyectos de un idioma, ordenados. El slug es el nombre del archivo, igual en ambos idiomas. */
export async function getProjects(locale: Locale): Promise<Project[]> {
  const entries = await getCollection('projects', (entry) => entry.id.startsWith(`${locale}/`))
  return entries
    .map((entry) => ({ slug: entry.id.slice(locale.length + 1), entry }))
    .sort((a, b) => a.entry.data.order - b.entry.data.order)
}
