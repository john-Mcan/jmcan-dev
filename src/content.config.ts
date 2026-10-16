import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { GLYPH_KEYS } from '@/lib/grid-field/glyph-keys'
import { PROJECT_STATUSES } from '@/lib/project-status'

/**
 * Un archivo por proyecto e idioma: `projects/es/<slug>.md` y `projects/en/<slug>.md`.
 * Las capturas, compartidas entre idiomas, en `projects/shots/<slug>/`.
 */
const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        /** Una línea: se muestra en la lista. */
        summary: z.string().max(90),
        year: z.number().int(),
        /** El último año, si el proyecto abarca más de uno (2025–2026). */
        yearEnd: z.number().int().optional(),
        role: z.string(),
        stack: z.array(z.string()).min(1).max(6),
        status: z.enum(PROJECT_STATUSES),
        /** El código está publicado y se aceptan aportes (con `links.repo`). */
        contributions: z.boolean().default(false),
        /** Figura que la grilla imprime para este proyecto. */
        glyph: z.enum(GLYPH_KEYS),
        featured: z.boolean().default(false),
        /** Orden en las listas (menor primero). */
        order: z.number().int(),
        links: z
          .object({
            live: z.url().optional(),
            repo: z.url().optional(),
            /** La app en una tienda (App Store, Google Play). */
            store: z.url().optional(),
          })
          .default({}),
        /**
         * Capturas, solo en el detalle. Van donde el texto tenga `<!-- capturas -->`;
         * si no lo tiene, al final.
         */
        shots: z
          .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
          .default([]),
      })
      .refine((data) => data.yearEnd === undefined || data.yearEnd > data.year, {
        message: '`yearEnd` debe ser posterior a `year`',
        path: ['yearEnd'],
      })
      .refine((data) => !data.contributions || data.links.repo !== undefined, {
        message: 'Un proyecto abierto a aportes necesita `links.repo`',
        path: ['contributions'],
      }),
})

export const collections = { projects }
