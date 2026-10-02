# johnmcan.dev

Portafolio de John Mcan. Astro 7 (estático) + Cloudflare Workers.

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
- `src/content/projects/{es,en}/*.md`: proyectos (un archivo por idioma, mismo nombre).
- Textos marcados en `src/i18n/ui/*.ts` (disponibilidad, tiempos de respuesta).

## Estructura

```
src/
├── components/   fx (grilla), layout, projects, sections/home, contact, ui
├── content/      proyectos en Markdown (es/en)
├── data/         datos del sitio y trayectoria
├── i18n/         idiomas, rutas tipadas y textos
├── layouts/      BaseLayout (head, SEO, tema, ClientRouter, fondo persistente)
├── lib/          grid-field (motor de la grilla), proyectos, transiciones
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
