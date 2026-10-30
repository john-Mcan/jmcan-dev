import type { APIRoute } from 'astro'
import { rightsNotice } from '@/data/rights'
import { SITE } from '@/data/site'
import { absolute, plainText, PREVIEW } from '@/lib/seo'

/**
 * Buscadores y asistentes de IA leen y citan las páginas; nadie entrena modelos con
 * ellas, y los agentes de IA no bajan el código ni los estilos (`/_astro/`). Los
 * buscadores sí: los necesitan para renderizar la página.
 */

/** Asistentes y buscadores de IA: consultan páginas para responder y citar. */
const AI_READERS = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'DuckAssistBot',
  'MistralAI-User',
  'meta-externalfetcher',
]

/** Rastreadores que juntan datos para entrenar modelos. */
const AI_TRAINERS = [
  'GPTBot',
  'ClaudeBot',
  'anthropic-ai',
  'CCBot',
  'Applebot-Extended',
  'Bytespider',
  'meta-externalagent',
  'cohere-training-data-crawler',
]

/** https://contentsignals.org: qué se permite hacer con el contenido una vez leído. */
const SIGNALS = 'Content-Signal: search=yes, ai-input=yes, ai-train=no'

export const GET: APIRoute = () => {
  if (PREVIEW) {
    return plainText([
      `# Preview de ${new URL(SITE.url).host}: cada página lleva noindex. El sitio es ${SITE.url}`,
      'User-agent: *',
      'Allow: /',
    ])
  }
  return plainText([
    ...rightsNotice(absolute('/llms.txt'), 86).map((line) => (line ? `# ${line}` : '#')),
    '#',
    '# Content-Signal: search = indexar y mostrar en resultados; ai-input = usar como fuente',
    '# de respuestas de IA; ai-train = entrenar modelos.',
    '',
    'User-agent: *',
    SIGNALS,
    'Allow: /',
    'Disallow: /api/',
    '',
    '# Asistentes y buscadores de IA: leen las páginas, no el código ni los estilos.',
    ...AI_READERS.map((agent) => `User-agent: ${agent}`),
    SIGNALS,
    'Allow: /',
    'Disallow: /_astro/',
    'Disallow: /api/',
    '',
    '# Rastreadores que juntan datos para entrenar modelos.',
    ...AI_TRAINERS.map((agent) => `User-agent: ${agent}`),
    'Disallow: /',
    '',
    `Sitemap: ${absolute('/sitemap-index.xml')}`,
  ])
}
