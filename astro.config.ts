import cloudflare from '@astrojs/cloudflare'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, envField, fontProviders } from 'astro/config'

export default defineConfig({
  site: 'https://johnmcan.dev',
  // Todo se prerenderiza; solo /api/contact y el 404 de /en/* corren en el Worker.
  output: 'static',
  adapter: cloudflare({ imageService: 'compile' }),
  // Sin sesiones: el adapter las activaría con un namespace KV que no necesitamos.
  session: false,
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [sitemap({ filter: (page) => !/\/404\/?$/.test(page) })],
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
