# La grilla de fondo: cómo funciona y cómo extenderla

Guía práctica del motor que vive en `src/lib/grid-field/`. Parte de `docs/grid-field.md` (la guía
original, escrita para Next.js/React), pero el código actual **ya divergió**: no copies código de
esa guía sin contrastarlo con este documento.

**Índice**

1. [Mapa de archivos](#1-mapa-de-archivos)
2. [Conceptos](#2-conceptos)
3. [Recetas](#3-recetas)
4. [Reglas que no se negocian](#4-reglas-que-no-se-negocian)
5. [Parámetros](#5-parámetros)
6. [Ideas pendientes y dónde encajan](#6-ideas-pendientes-y-dónde-encajan)
7. [Checklist antes de dar por terminado un cambio](#7-checklist-antes-de-dar-por-terminado-un-cambio)

---

## 1. Mapa de archivos

| Archivo                             | Qué hace                                                                | ¿Toca el DOM?             |
| ----------------------------------- | ----------------------------------------------------------------------- | ------------------------- |
| `lib/grid-field/grid-field.ts`      | Motor: grilla, formas, máscaras, parpadeo, luz por celda y pintado      | No                        |
| `lib/grid-field/timeline.ts`        | Relojes puros: `loopEnvelope`, `holdEnvelope`, `rising`, `sweepRows`    | No                        |
| `lib/grid-field/sprites.ts`         | Tipos `Sprite` / `SpriteFrame`, `WORD_MS`, sorteo sin repetición        | No                        |
| `lib/grid-field/sprite-drawings.ts` | Dibujos (cubo, globo, osciloscopio, radar, sobre, `glitchText`…)        | Solo el canvas que recibe |
| `lib/grid-field/sprite-raster.ts`   | Cuadro → máscara de cobertura, caja alineada a la grilla                | Canvas fuera de pantalla  |
| `lib/grid-field/runner.ts`          | Runtime: loop rAF, observers, tema, fuentes, escenarios, transiciones   | Sí                        |
| `lib/grid-field/glyph-keys.ts`      | Claves de glifos válidas en el frontmatter de proyectos                 | No                        |
| `lib/grid-field/library.ts`         | Los sprites del sitio: pools, glifos por proyecto, contacto, 404        | No                        |
| `scripts/grid-field.ts`             | Monta el runner una vez y decide qué escenario suena según la página    | Sí                        |
| `components/fx/GridField.astro`     | El `<canvas>` fijo, persistente entre navegaciones                      | —                         |
| `components/fx/Stage.astro`         | Caja vacía con marcas en las esquinas donde se imprime un sprite        | —                         |
| `styles/global.css`                 | `--grid-field-rgb`, `--grid-field-accent-rgb` y CSS de view transitions | —                         |
| `lib/grid-field/grid-field.test.ts` | Tests de los módulos puros (`pnpm test`)                                | —                         |

Solo `runner.ts` y `scripts/grid-field.ts` tocan `window`/`document`. Todo lo demás se testea en
Node con un contexto falso.

## 2. Conceptos

**Campo.** Un canvas fijo a pantalla completa con celdas de 2 px cada 6 px (1 px cada 3 px por
debajo de 640 px de ancho). Cada celda tiene una luz base que el parpadeo re-sortea. Hay un solo
campo y un solo loop para todo el sitio: es lo que hace que se lea como una superficie.

**Formas (halo).** Cualquier elemento con `data-grid-shape` hace que las celdas detrás de él se
enciendan y que el resto se apague un poco («condensar»). Con `data-grid-shape="accent"` el halo
pinta con la paleta de señal (ámbar). Las formas se re-miden al hacer scroll, cada segundo y con
`runner.rescan()`, y entran y salen suavizadas (~120 ms).

**Escenarios (`Stage`).** Qué sprite se imprime y dónde. La caja es el rect de un elemento
(`target`), re-medido cada cuadro, así que el sprite sigue al elemento al hacer scroll o si es
sticky. Hay dos programas:

- `loop`: un pool de sprites que suena en ciclos (aparece, se sostiene y calla). El primero del
  pool abre siempre y después se sortea sin repetir. Lo usa el hero.
- `hold`: un sprite sostenido mientras dure el escenario. Lo usan los glifos de proyectos, el
  contacto y el 404.

**Hay un solo escenario a la vez** (una sola máscara). Al cambiarlo, el sprite actual se desvanece
antes de que entre el nuevo. `scripts/grid-field.ts` decide cuál gana:

1. La fila de proyecto con hover o foco.
2. La fila activa de la lista de proyectos, si la lista está en la franja central del viewport
   (`rootMargin -25%`). La fila activa es la que cruza el 10 % central (`-45%`).
3. La caja `data-grid-stage` más visible, si se ve al menos un 30 % (`MIN_RATIO`).

**Sprites.** Cada cuadro es un texto (se rasteriza con Departure Mono) o una función de dibujo.
Se rasteriza en blanco, se promedia la cobertura alfa por celda y se cachea por cuadro **solo para
el sprite actual**. Mover la caja es gratis (cambia el desplazamiento); cambiarle el tamaño obliga
a re-rasterizar.

**Paletas.** `base` (blanco en oscuro, tinta en claro) y `accent` (señal). Las dos salen de
variables CSS y se re-leen al cambiar `data-theme`. Los dibujos nunca eligen color: pintan en
blanco y el campo pone el color.

**Ganancias.** Multiplicadores por celda calculados en `paintField`:

- `boost` (puntero): multiplica solo la luz base (ruido y halo), no el sprite.
- `gain` (barrido por fila): multiplica todo, sprite incluido.

**Transiciones de página.** `astro:before-preparation` llama a `runner.leave()` (la estructura se
disuelve en 180 ms) y suelta los escenarios. `astro:after-swap` llama a `runner.enter()` (barrido
de escaneo y la estructura nueva emerge). El contenido HTML hace su propio fade en pasos
(`lib/transitions.ts`). El snapshot viejo del canvas se oculta en `global.css` para no duplicar
puntos.

## 3. Recetas

### 3.1 Un sprite dibujado nuevo

1. En `sprite-drawings.ts`, escribe un `Painter`: `(ctx, box, turn, fontFamily) => void`, con
   `turn` en `[0, 1)`.
2. Usa `squareIn(box)` para centrar y medir por el lado corto, `stroke(unit, fracción)` para los
   grosores (aplica el piso de 6 px) y `shade(alpha)` para la intensidad.
3. Expórtalo con `drawnFrames(cuadros, painter)`: 24–40 cuadros es lo habitual.
4. Regístralo en `library.ts` dentro de un `Sprite` (`frameMs` de 50–90 ms para dibujos).

Reglas de dibujo (medidas en el original; no son de estilo):

- **Trazos de al menos dos celdas**: ~12 px en escritorio y ~6 px en móvil. `stroke()` ya aplica
  el piso.
- **Nada fuera de la caja**: lo que queda afuera se pierde.
- **El loop debe cerrar**: lo que dibujas en `turn → 1` tiene que empalmar con `turn = 0`.
  Aprovecha las simetrías (el cubo gira un cuarto de vuelta, el globo lo que separa dos
  meridianos).
- **La profundidad es intensidad**: el campo solo lee cobertura, así que lo que está "atrás" se
  dibuja más tenue (`shade(0.3)`), nunca oculto.
- **Tinta sobre tinta no se ve**: para recortar un símbolo dentro de una forma usa
  `globalCompositeOperation = 'destination-out'`.
- **Ruido determinista**: si un cuadro necesita azar (como el glitch), usa `hash(cuadro)` y no
  `Math.random()`, o el loop cambia en cada vuelta.

### 3.2 Un sprite de texto

```ts
const MI_TEXTO: Sprite = { frames: ['hola', 'hola_'], frameMs: WORD_MS, textScale: 0.5 }
```

- Hasta ~22 caracteres. Bloques y letras sólidas se leen; los detalles finos y los emojis no.
- El tamaño sale del cuadro **más ancho**, para que un texto que "se tipea" no bombee.
- `textScale` es el alto máximo como fracción de la caja (0,38 por defecto). Súbelo para textos
  cortos en cajas cuadradas.
- Departure Mono no siempre se lee bien en la grilla: el `@` parecía una "a" y se cambió por un
  dibujo. Si un glifo no se lee, dibújalo.
- Si el texto depende del idioma, define un `Record<Locale, Sprite>` (ver `GREETING` o
  `SENT_SPRITE`).

### 3.3 Un glifo para un proyecto

1. Agrega la clave a `GLYPH_KEYS` en `glyph-keys.ts`.
2. Asóciale un `Sprite` en `GLYPHS` (`library.ts`); TypeScript exige que estén todas.
3. Úsala en el frontmatter: `glyph: <clave>`. El schema (`content.config.ts`) la valida.

### 3.4 Un escenario nuevo en una página

1. Pon la caja en la página: `<Stage stage="mi-escenario" class="aspect-square w-full" />`.
2. En `parseStage` (`scripts/grid-field.ts`), traduce el valor a un `Stage` con
   `hold(target, sprite, accent)` o un programa `loop`.
3. Para cambiar un escenario en vivo (como el formulario: `contact` → `sent`), cambia el atributo
   y dispara `document.dispatchEvent(new Event('grid:refresh'))`.

Valores existentes: `hero`, `contact`, `sent`, `404`, `glyph:<clave>`.

### 3.5 Halos

- Marca el **contenido**, no el contenedor: un `<span class="inline-block" data-grid-shape>`
  dentro del `<h1>`. Un bloque a todo el ancho se enciende como una franja.
- Los botones (`Button.astro`) ya traen `data-grid-shape`.
- `accent` solo para estado (la fila activa). Si cambias un atributo desde un script, llama a
  `runner.rescan()`; el controlador ya lo hace con las filas.

### 3.6 Un efecto nuevo del motor (onda, disolución, glitch…)

Un efecto es una ganancia por celda que entra en el loop de `paintField`. Ejemplo: una onda que
sale de un clic.

1. **Estado del cuadro.** Agrega el campo a `FrameInput` (`grid-field.ts`), por ejemplo
   `ripple: { x; y; radius; width; strength } | null`.
2. **Reloj puro.** En `timeline.ts`, una función del tiempo transcurrido que devuelva ese estado
   (o `null` cuando terminó). Testéala en `grid-field.test.ts`.
3. **Pintado.** En `paintField`, calcula _antes_ del loop lo que no depende de la celda (la caja en
   celdas del efecto, igual que `pc0…pr1` del puntero). Dentro del loop, salta rápido si la celda
   está fuera de la caja. Decide si multiplica `boost` (solo luz base) o la ganancia total (incluye
   el sprite).
4. **Runner.** Guarda el estado, pásalo en cada `paintField` y expón un método (`ripple(x, y)`) en
   `GridFieldRunner`. Con movimiento reducido, no hagas nada.
5. **Disparo.** Llámalo desde `scripts/grid-field.ts` (un listener de clic, una transición).

Para elegir la forma del efecto, según de qué dependa:

| Depende de…                        | Cálculo                                                        | Ejemplo                |
| ---------------------------------- | -------------------------------------------------------------- | ---------------------- |
| Solo la fila                       | Precalcula un `Float32Array(rows)` por cuadro (como `rowGain`) | Barrido de escaneo     |
| Solo la columna                    | `Float32Array(cols)`                                           | Barrido horizontal     |
| Distancia a un punto               | Caja en celdas + `d²` (sin `sqrt`) solo dentro de la caja      | Puntero, onda          |
| Un hash estable por celda          | Precalcula un `Uint8Array`/`Float32Array` en `measure()`       | Disolución por tramado |
| Desplazar la lectura de la máscara | Cambia `lc`/`lr` por banda de filas                            | Glitch de sprite       |

## 4. Reglas que no se negocian

- **Cero asignaciones por cuadro.** Los buffers se reservan en `measure()`. Nada de arrays nuevos,
  closures ni objetos dentro de `tick`/`paintField`.
- **Como mucho 48 cambios de `fillStyle` por cuadro** (24 niveles × 2 paletas). Una tercera paleta
  sube `BUCKETS` a 72: justifícalo.
- **Nada caro por celda fuera de su caja.** El campo tiene entre 30 y 90 mil celdas a 30 fps.
- **Identidad estable.** Pools, sprites y escenarios son constantes de módulo o están cacheados: el
  runner compara por identidad y un objeto nuevo reinicia el sprite.
- **Movimiento reducido.** Sin loop: un cuadro quieto (`paintStill`) con el halo en reposo y el
  primer cuadro del sprite. Todo efecto nuevo queda apagado.
- **Accesibilidad.** El fondo es `aria-hidden` y `pointer-events: none`. Las cajas `Stage` también
  son `aria-hidden`: lo que dibuja la grilla es decoración y su información debe existir en HTML.
- **Color.** El ámbar significa estado, foco o interacción. Un sprite decorativo va en `base`.
- **Contraste.** Un sprite llega a 0,92 de opacidad: nunca lo pongas detrás de texto.
- **Sin frameworks.** El motor es TypeScript plano; no lo envuelvas en React.

## 5. Parámetros

`GRID_FIELD_DEFAULTS` (`runner.ts`):

| Campo                    | Valor      | Efecto                                                       |
| ------------------------ | ---------- | ------------------------------------------------------------ |
| `fps`                    | 30         | Tope de cuadros por segundo                                  |
| `maxOpacity`             | 0,22       | Luz máxima de una celda de ruido                             |
| `chance`                 | 0,45       | Fracción de celdas re-sorteadas por segundo                  |
| `maxCells`               | 90 000     | Presupuesto de celdas; por encima la grilla se engrosa       |
| `maxDpr`                 | 2          | Tope del devicePixelRatio                                    |
| `restCondense`           | 0,5        | Cuánto destacan los halos en reposo                          |
| `introMs` / `introTauMs` | 1100 / 900 | Barrido que revela el campo y emergencia inicial             |
| `enterMs` / `enterTauMs` | 650 / 450  | Barrido y emergencia al llegar a otra página                 |
| `leaveMs`                | 180        | Disolución al salir de una página                            |
| `fadeMs`                 | 260        | Fade de los sprites y de los cambios de escenario            |
| `pointer`                | true       | Brillo bajo el puntero (solo mouse, sin movimiento reducido) |

`LOOP_DEFAULTS` (`timeline.ts`): `firstMs` 600, `everyMs` 7000, `spriteMs` 4600, `fadeMs` 260.

Otros: `MIN_BOX_CELLS` = 8 (caja mínima para dibujar), `MIN_RATIO` = 0,3 y `WIDE_QUERY` = 48rem
(desde ahí la lista usa el panel sticky).

Si un móvil modesto no da el ancho, lo primero es `fps: 20`, `maxCells: 40_000` o `maxDpr: 1.5`.

## 6. Ideas pendientes y dónde encajan

| Idea                                       | Dónde                                                                 | Notas                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `/lab` para afinar sprites y efectos       | Ruta inyectada solo en `astro dev` (integración en `astro.config.ts`) | Hoy, para previsualizar un sprite, ponlo en un `Stage` de una página o en `HERO_POOL` |
| Onda al hacer clic en los CTA              | Receta 3.6 (distancia a un punto)                                     |                                                                                       |
| Disolución por tramado al navegar          | Hash por celda en `measure()` + progreso en `leave()`                 | Reemplazaría o complementaría la disolución actual                                    |
| Glitch de bandas en sprites                | Desplazar `lc` por banda de filas en `paintField`                     | Hoy el glitch del 404 se hace en el dibujo                                            |
| Sprites de imagen/SVG (logos de proyectos) | Nuevo tipo de cuadro `{ image }` → `drawImage` en `rasteriseFrame`    | Los logos necesitan formas gruesas                                                    |
| Texto vivo (hora, contadores)              | Cuadros generados al vuelo con caché por string                       | El caché actual es por índice de cuadro                                               |
| Más de un sprite a la vez                  | Varias máscaras en `FrameInput`                                       | Rompe "un escenario a la vez": pensarlo antes                                         |
| Renderer WebGL2                            | Detrás de `paintField`, sin tocar relojes ni sprites                  | Solo si las mediciones en móvil lo piden                                              |

## 7. Checklist antes de dar por terminado un cambio

- [ ] `pnpm check`, `pnpm lint` y `pnpm test` en verde; el reloj nuevo tiene su test.
- [ ] Se ve en oscuro y en claro, en escritorio y en móvil (390 px).
- [ ] Con `prefers-reduced-motion` queda un cuadro quieto y legible.
- [ ] El JS de la página sigue bajo ~20 KB gz (revisa `dist/client/_astro` después de `pnpm build`).
- [ ] Ningún sprite cae detrás de texto.
