# johnmcan.dev: guía para agentes

Portafolio personal de John Mcan. Astro 7 estático desplegado en Cloudflare Workers; solo
`/api/contact` (formulario, vía Resend) y el 404 de `/en/*` corren en el Worker. Páginas: inicio,
proyectos, detalle de proyecto, contacto y 404, en español e inglés.

## Reglas del proyecto

- **Rendimiento primero.** Sin frameworks de UI: React y similares están bloqueados por ESLint. La
  interactividad va en `<script>` de componentes `.astro`. Presupuesto: ≤ 20 KB gz de JS por
  página (hoy ~14 KB).
- **Idiomas.**
  - Español por defecto, sin prefijo; inglés bajo `/en/`.
  - Español **neutro**: tuteo, sin voseo ni modismos regionales.
  - Los textos de UI viven en `src/i18n/ui/es.ts` (fuente de verdad) y `en.ts` (mismas claves; lo
    valida TypeScript).
  - Las rutas por idioma salen de `src/i18n/routes.ts`; nunca escribas rutas a mano.
- **Temas.**
  - Oscuro por defecto, claro opcional (`data-theme` en `<html>`).
  - Colores solo con los tokens de `src/styles/global.css`.
  - El ámbar (`signal`) marca estado, foco o interacción; nunca decora.
- **Tipografía.** Departure Mono (display) solo en múltiplos de 11 px: usa las clases `text-d1` a
  `text-d6`. Instrument Sans para todo lo demás.
- **Movimiento.**
  - Vive en la grilla de fondo; el contenido HTML queda quieto (sin fade-in por sección).
  - Sin velo ni brillo bajo el cursor: la grilla suma luz donde marca y nunca atenúa el resto.
  - El cursor no deja rastro: un patrón reacciona a su posición y se relaja cuando se va.
  - Respeta `prefers-reduced-motion`.
- **Accesibilidad.** Lo que dibuja la grilla es decoración (`aria-hidden`): toda información debe
  existir en HTML. Foco visible en ámbar e inputs de ≥ 16 px (iOS).
- **Tests.** Mínimos a propósito: solo el motor puro de la grilla (`pnpm test`). Sin CI ni hooks.
- **Commits.** En español, estilo convencional: `feat(alcance): …`, `fix: …`, `chore: …`.

## La grilla de fondo

El motor está en `src/lib/grid-field/` y lo monta `src/scripts/grid-field.ts`. Antes de tocar
efectos, animaciones o sprites, lee **`docs/grid-field-extending.md`**: mapa de archivos,
conceptos, recetas (sprites dibujados y de texto, glifos de proyecto, escenarios, halos, efectos
nuevos), reglas de rendimiento y parámetros.

Las páginas declaran qué imprime la grilla con atributos:

- `data-grid-shape` / `data-grid-shape="accent"`: halo detrás de un elemento (marca el contenido,
  `inline-block`, no el contenedor).
- `data-grid-stage="hero|contact|sent|404|glyph:<clave>"`: caja donde se imprime un sprite
  (componente `Stage.astro`).
- `data-grid-projects` + `data-grid-row`: lista de proyectos con panel narrador.
- `data-grid-stage="live:<patrón>"` + `data-grid-cursor="attract|repel|off"`: escenario vivo (una
  simulación en vez de un sprite: moho, enjambre, corrientes, escarcha, Julia). El contenido dentro
  de su caja es isla (`data-grid-shape` o `data-grid-island`): el patrón no imprime ahí. Hoy solo lo
  usan los heroes de `/lab`; ver `docs/sesion-2026-10-02-hero-vivo.md`.

## Estructura

```
src/
├── components/   fx (grilla), layout, projects, sections/home, contact, ui
├── content/      proyectos en Markdown: projects/{es,en}/<slug>.md (mismo slug en ambos)
├── data/         site.ts (datos personales), experience.ts (trayectoria)
├── i18n/         config, rutas tipadas, textos de UI
├── layouts/      BaseLayout: head/SEO, tema, ClientRouter, fondo persistente
├── lib/          grid-field (motor), projects.ts, transitions.ts
├── pages/        rutas finas por idioma que renderizan views
├── scripts/      montaje de la grilla y sus escenarios
├── styles/       global.css: tokens, temas, componentes base, view transitions
└── views/        cuerpo de cada página, compartido entre idiomas
```

Una página nueva = una view en `src/views/` + un archivo fino por idioma en `src/pages/` + su
entrada en `src/i18n/routes.ts`.

## Pendientes

Estado al 2026-10-02: la base y la landing están listas en `main2`, y hay candidatos para un hero
vivo en `/lab` (solo en `pnpm dev`). Falta, en este orden:

1. **Hero vivo:** elegir el candidato, o cómo usar más de uno a la vez, y pasarlo a producción.
   Candidatos, decisiones y pasos: `docs/sesion-2026-10-02-hero-vivo.md` (secciones 3, 6 y 8).
2. **Header sticky:** diseño acordado y sin implementar. Va el logo como prompt `jm ~/<ruta>▮`,
   compacto en escritorio, escondido al bajar en móvil y sin blur. Detalle en la sección 7 del
   mismo documento.
3. **Contenido real** (hoy es de ejemplo):
   - `src/data/site.ts`: nombre ("John Mcan" salió del dominio), correo (`hola@johnmcan.dev` es
     inventado), cargo y redes (falta LinkedIn).
   - `src/data/experience.ts`: trayectoria.
   - `src/content/projects/{es,en}/*.md`: proyectos reales; Atlas, Relay, Vertex y Beacon son de
     ejemplo.
   - En `src/i18n/ui/*.ts`, los textos de disponibilidad ("desde noviembre") y de tiempo de
     respuesta ("48 horas").
   - La voz: el hero nuevo habla en «nosotros» (la persona y la IA); el resto del sitio, todavía en
     primera persona singular.
4. **Resend:**
   - verificar el dominio en Resend;
   - cargar `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` (`.dev.vars` en local,
     `wrangler secret put` en producción);
   - probar un envío real, que nunca se probó.
5. **Deploy:** `wrangler login`, primer `pnpm deploy` y el dominio `johnmcan.dev` apuntando al
   Worker.
6. **Sin verificar aún:** Safari, Firefox y el rendimiento en un móvil de gama baja, también el de
   los patrones vivos (si no da el ancho, ver la sección 5 de `docs/grid-field-extending.md`).
7. **Opcional:** imagen OG para compartir en redes, sumar a `/lab` vistas para afinar sprites y
   efectos (hoy solo compara heroes), y el resto de las ideas de la sección 6 de
   `docs/grid-field-extending.md`.

## Comandos

| Comando                       | Qué hace                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`                    | Desarrollo (corre sobre workerd); los heroes candidatos, en `/lab/<variante>`  |
| `pnpm build` / `pnpm preview` | Build y preview local; para detener el preview: `pnpm exec astro preview stop` |
| `pnpm check`                  | Tipos, incluidos los `.astro`                                                  |
| `pnpm lint` / `pnpm format`   | ESLint / Prettier                                                              |
| `pnpm test`                   | Tests del motor de la grilla                                                   |
| `pnpm deploy`                 | Build + `wrangler deploy`                                                      |

Secretos del formulario: `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL`. En local van
en `.dev.vars` (plantilla en `.dev.vars.example`); en producción, con `pnpm wrangler secret put`.

## Versiones con restricciones

- **TypeScript 6.0.x, no 7**: typescript-eslint (`<6.1`) y `@astrojs/check` (`^5 || ^6`) aún no
  soportan TS 7.
- **`eslint-plugin-jsx-a11y-x`** (fork) en vez de `eslint-plugin-jsx-a11y`, que no soporta
  ESLint 10.
- **`session: false`** en `astro.config.ts`: sin eso, el adapter de Cloudflare activa sesiones con
  un namespace KV que no se usa.

## Documentación de referencia

Interna:

- `docs/grid-field-extending.md`: cómo funciona y cómo extender la grilla (lectura obligada para
  efectos y sprites).
- `docs/grid-field.md`: la guía original del fondo (histórica; el código ya divergió).
- `docs/sesion-2026-10-02-hero-vivo.md`: la sesión del hero vivo, con los escenarios vivos del
  motor, los candidatos en `/lab`, lo descartado, el diseño acordado del header y los pasos para
  pasar a producción.
- `README.md`: puesta en marcha, Resend y contenido de ejemplo.

Externa:

- Astro: <https://docs.astro.build/en/getting-started/>
  - Adapter de Cloudflare: <https://docs.astro.build/en/guides/integrations-guide/cloudflare/>
  - View transitions / ClientRouter: <https://docs.astro.build/en/guides/view-transitions/>
  - i18n: <https://docs.astro.build/en/guides/internationalization/>
  - Fonts API: <https://docs.astro.build/en/guides/fonts/>
  - Content collections: <https://docs.astro.build/en/guides/content-collections/>
  - Variables de entorno (`astro:env`): <https://docs.astro.build/en/guides/environment-variables/>
- Cloudflare Workers y Wrangler: <https://developers.cloudflare.com/workers/>
- Tailwind CSS v4: <https://tailwindcss.com/docs>
- Resend, envío de correos: <https://resend.com/docs/api-reference/emails/send-email>
- Departure Mono (licencia OFL; nítida en múltiplos de 11 px): <https://departuremono.com>
