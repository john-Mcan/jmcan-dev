import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { GLYPH_KEYS } from '@/lib/grid-field/glyph-keys'

/** Un archivo por proyecto e idioma: `projects/es/<slug>.md` y `projects/en/<slug>.md`. */
const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    /** Una línea: se muestra en la lista. */
    summary: z.string().max(90),
    year: z.number().int(),
    role: z.string(),
    stack: z.array(z.string()).min(1).max(6),
    /** Figura que la grilla imprime para este proyecto. */
    glyph: z.enum(GLYPH_KEYS),
    featured: z.boolean().default(false),
    /** Orden en las listas (menor primero). */
    order: z.number().int(),
    links: z.object({ live: z.url().optional(), repo: z.url().optional() }).default({}),
  }),
})

export const collections = { projects }
