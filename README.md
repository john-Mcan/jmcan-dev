# johnmcan.dev

Portafolio de John Mcan. Astro 7 (estático) + Cloudflare Workers.

Todos los derechos reservados: el código, el diseño y las animaciones no tienen licencia de uso
(ver [`LICENSE`](./LICENSE)). El texto del sitio puede citarse con un enlace a la página.

## Desarrollo

```bash
pnpm install
cp .dev.vars.example .dev.vars   # claves de Resend para probar el formulario
pnpm dev                         # corre sobre workerd, igual que en producción
```

| Comando                       | Qué hace                         |
| ----------------------------- | -------------------------------- |
| `pnpm build` / `pnpm preview` | Build y preview local en workerd |
| `pnpm check`                  | Tipos (incluye `.astro`)         |
| `pnpm lint` / `pnpm format`   | ESLint / Prettier                |
| `pnpm test`                   | Tests del motor de la grilla     |
| `pnpm deploy`                 | Build + `wrangler deploy`        |
| `pnpm deploy:preview`         | Deploy a `preview.johnmcan.dev`  |

## Formulario de contacto (Resend)

`/api/contact` envía con la API REST de Resend. Necesita tres secretos:

```bash
pnpm wrangler secret put RESEND_API_KEY
pnpm wrangler secret put CONTACT_TO_EMAIL     # dónde llegan los mensajes
pnpm wrangler secret put CONTACT_FROM_EMAIL   # remitente con dominio verificado en Resend
```

Sin ellos, el formulario responde «no se pudo enviar» y deja un error en los logs del Worker.
Funciona también sin JavaScript (redirige de vuelta con un aviso).

## Contenido de ejemplo

Reemplazar antes de publicar:

- `src/data/site.ts`: nombre, correo, cargo y redes.
- `src/data/experience.ts`: trayectoria.
- Textos marcados en `src/i18n/ui/*.ts` (disponibilidad, tiempos de respuesta).

Los proyectos ya son reales: `src/content/projects/{es,en}/<slug>.md` (un archivo por idioma, mismo
nombre) y sus capturas en `src/content/projects/shots/<slug>/`. El schema, con estado, período,
enlaces y capturas, está en `src/content.config.ts`.

## SEO, tarjetas para compartir y agentes de IA

- Cada página lleva canonical, `hreflang` (es, en, x-default), Open Graph, la tarjeta grande de X
  y JSON-LD (`src/lib/seo.ts`). El sitemap trae las versiones de cada página en los dos idiomas.
- Las tarjetas para compartir (1200 × 630, `/og/<ruta>.png`) se pintan al terminar el build con los
  glifos de la grilla (`src/integrations/og-images.ts`; los datos, en `src/pages/og/cards.json.ts`).
  En `pnpm dev` se pintan al pedirlas.
- `robots.txt`, `llms.txt` y `llms-full.txt` se generan con el contenido. Los agentes de IA pueden
  leer y citar el texto, pero no revisar ni copiar el estilo, las animaciones ni el código, y nadie
  puede entrenar modelos con el sitio (`src/data/rights.ts`). El aviso de derechos va también en
  el HTML (antes de `<html>` y al inicio de `<body>`), en la consola y al inicio de cada JS y CSS
  propio.
- `pnpm deploy:preview` construye con `noindex` y con las URL de `preview.johnmcan.dev`.

## Estructura

```
src/
├── components/   fx (grilla), layout, projects, sections/home, contact, ui
├── content/      proyectos en Markdown (es/en)
├── data/         datos del sitio, trayectoria y aviso de derechos
├── i18n/         idiomas, rutas tipadas y textos
├── integrations/ tarjetas para compartir y aviso de derechos en JS y CSS (en el build)
├── layouts/      BaseLayout (head, SEO, tema, ClientRouter, fondo persistente)
├── lib/          grid-field (motor de la grilla), proyectos, SEO, llms.txt, transiciones
├── pages/        rutas finas por idioma → views
├── scripts/      montaje de la grilla y sus escenarios
├── styles/       tokens y estilos globales
└── views/        cuerpo de cada página, compartido entre idiomas
```

## Documentación

- [`AGENTS.md`](./AGENTS.md): reglas del proyecto, estructura y referencias (también la leen los
  agentes; `CLAUDE.md` la importa).
- [`docs/grid-field-extending.md`](./docs/grid-field-extending.md): cómo funciona la grilla de
  fondo y cómo agregar sprites, escenarios y efectos.
- [`docs/grid-field.md`](./docs/grid-field.md): la guía original del fondo (histórica).
