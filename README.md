# johnmcan.dev

[![Tarjeta de johnmcan.dev](https://johnmcan.dev/og/index.png)](https://johnmcan.dev)

Mi portafolio, en español e inglés: proyectos, trayectoria y contacto. En línea en
**[johnmcan.dev](https://johnmcan.dev)**.

Astro 7 estático sobre Cloudflare Workers: solo el formulario de contacto corre en el Worker. El
fondo es una grilla de puntos animada (motor propio en TypeScript, pintado con WebGL2) y el sitio
no usa frameworks de UI.

Todos los derechos reservados: el código, el diseño y las animaciones no tienen licencia de uso
(ver [`LICENSE`](./LICENSE)). El texto del sitio puede citarse con un enlace a la página.

## Desarrollo

```bash
pnpm install
cp .dev.vars.example .dev.vars   # claves de Resend para probar el formulario
pnpm dev                         # corre sobre workerd, igual que en producción
```

| Comando                       | Qué hace                                       |
| ----------------------------- | ---------------------------------------------- |
| `pnpm build` / `pnpm preview` | Build y preview local en workerd               |
| `pnpm check`                  | Tipos (incluye `.astro`)                       |
| `pnpm lint` / `pnpm format`   | ESLint / Prettier                              |
| `pnpm test`                   | Tests del motor de la grilla                   |
| `pnpm run deploy`             | Build + `wrangler deploy` a johnmcan.dev y www |
| `pnpm deploy:preview`         | Deploy a `preview.johnmcan.dev`                |

`pnpm deploy`, sin `run`, es un comando propio de pnpm (para workspaces): no despliega el sitio.

## Formulario de contacto (Resend)

`/api/contact` envía con la API REST de Resend desde el dominio verificado `email.johnmcan.dev`.
Necesita tres secretos:

```bash
pnpm wrangler secret put RESEND_API_KEY       # clave solo de envío
pnpm wrangler secret put CONTACT_TO_EMAIL     # dónde llegan los mensajes
pnpm wrangler secret put CONTACT_FROM_EMAIL   # remitente en email.johnmcan.dev
```

Para la preview, lo mismo con `--env preview`. Sin ellos, el formulario responde «no se pudo
enviar» y deja un error en los logs del Worker. Funciona también sin JavaScript (redirige de vuelta
con un aviso).

## Contenido

- `src/data/site.ts`: nombre, correo, cargo y redes.
- `src/data/experience.ts`: trayectoria.
- `src/content/projects/{es,en}/<slug>.md`: los proyectos (un archivo por idioma, mismo nombre),
  con sus capturas en `src/content/projects/shots/<slug>/`. El schema, con estado, período,
  enlaces y capturas, está en `src/content.config.ts`.
- `src/i18n/ui/{es,en}.ts`: los textos de la interfaz.

## SEO, tarjetas para compartir y agentes de IA

- Cada página lleva canonical, `hreflang` (es, en, x-default), Open Graph, la tarjeta grande de X
  y JSON-LD (`src/lib/seo.ts`). El sitemap trae las versiones de cada página en los dos idiomas.
- Las tarjetas para compartir (1200 × 630, `/og/<ruta>.png`) se pintan al terminar el build con los
  glifos de la grilla (`src/integrations/og-images.ts`; los datos, en `src/pages/og/cards.json.ts`).
  En `pnpm dev` se pintan al pedirlas.
- `robots.txt`, `llms.txt` y `llms-full.txt` se generan con el contenido. Los agentes de IA pueden
  leer y citar el texto, pero no revisar ni copiar el estilo, las animaciones ni el código, y nadie
  puede entrenar modelos con el sitio (`src/data/rights.ts`). Un aviso corto va también antes de
  `<html>`, en la consola y al inicio de cada JS y CSS propio.
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
