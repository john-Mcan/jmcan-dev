import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import type { AstroIntegration } from 'astro'
import { defineConfig, envField, fontProviders } from 'astro/config'
import { SITE } from './src/data/site'
import { alternates, pathFor, routeAt } from './src/i18n/routes'
import { DEFAULT_LOCALE } from './src/i18n/config'
import { ogImages } from './src/integrations/og-images'
import { rightsBanner } from './src/integrations/rights-banner'

/** `/lab/*`: vistas previas que solo existen en `astro dev`; nunca llegan al build. */
const lab: AstroIntegration = {
  name: 'lab',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command !== 'dev') return
      injectRoute({ pattern: '/lab/[variant]', entrypoint: './src/lab/HeroLab.astro' })
    },
  },
}

/**
 * El sitemap con las versiones de cada página en los dos idiomas (y `x-default`), las
 * mismas que el `hreflang` del head: los segmentos cambian (`proyectos` ↔ `projects`),
 * así que salen de `routes.ts` y no del prefijo del idioma.
 */
const sitemapWithAlternates = sitemap({
  filter: (page) => !/\/404\/?$/.test(page),
  serialize(item) {
    const match = routeAt(new URL(item.url).pathname)
    if (!match) return item
    const url = (path: string) => new URL(path, SITE.url).href
    item.links = [
      ...alternates(match.route).map(({ locale, path }) => ({ lang: locale, url: url(path) })),
      { lang: 'x-default', url: url(pathFor(DEFAULT_LOCALE, match.route)) },
    ]
    return item
  },
})

export default defineConfig({
  site: SITE.url,
  // Todo se prerenderiza; solo /api/contact y el 404 de /en/* corren en el Worker.
  output: 'static',
  adapter: cloudflare({ imageService: 'compile' }),
  // Sin sesiones: el adapter las activaría con un namespace KV que no necesitamos.
  session: false,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [sitemapWithAlternates, ogImages(), rightsBanner(), lab],
  vite: { plugins: [tailwindcss()] },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Departure Mono',
      cssVariable: '--font-departure',
      fallbacks: ['ui-monospace', 'monospace'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/DepartureMono-Regular.woff2'], weight: 400, style: 'normal' },
        ],
      },
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Instrument Sans',
      cssVariable: '--font-instrument',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['sans-serif'],
    },
  ],
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
})
