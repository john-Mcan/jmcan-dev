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

| Archivo                             | Qué hace                                                                                       | ¿Toca el DOM?             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------- |
| `lib/grid-field/grid-field.ts`      | Motor: grilla, formas, máscaras, parpadeo, luz por celda y pintado                             | No                        |
| `lib/grid-field/timeline.ts`        | Relojes puros: `holdEnvelope`, `rising`, `sweepRows`                                           | No                        |
| `lib/grid-field/sprites.ts`         | Tipos `Sprite` / `SpriteFrame`, `WORD_MS`, sorteo sin repetición                               | No                        |
| `lib/grid-field/sprite-drawings.ts` | Dibujos (los glifos de proyecto, el sobre, `glitchText`…)                                      | Solo el canvas que recibe |
| `lib/grid-field/sprite-raster.ts`   | Cuadro → máscara de cobertura, caja alineada a la grilla                                       | Canvas fuera de pantalla  |
| `lib/grid-field/runner.ts`          | Runtime: loop rAF, observers, tema, fuentes, escenarios, transiciones                          | Sí                        |
| `lib/grid-field/glyph-keys.ts`      | Claves de glifos válidas en el frontmatter de proyectos                                        | No                        |
| `lib/grid-field/library.ts`         | Los sprites del sitio: glifos por proyecto, contacto, 404                                      | No                        |
| `scripts/grid-field.ts`             | Monta el runner una vez y decide qué escenario suena según la página                           | Sí                        |
| `components/fx/GridField.astro`     | El `<canvas>` fijo, persistente entre navegaciones                                             | —                         |
| `components/fx/Stage.astro`         | Caja vacía con marcas en las esquinas donde se imprime un sprite                               | —                         |
| `styles/global.css`                 | `--grid-field-rgb`, `--grid-field-accent-rgb`, `--grid-field-spread` y CSS de view transitions | —                         |
| `lib/grid-field/live.ts`            | Escenarios vivos: contrato (`LiveSource`, `LiveContext`) y utilidades compartidas              | No                        |
| `lib/grid-field/live-*.ts`          | Los patrones vivos (moho, cosmos, enjambre, corrientes, escarcha, Julia) y su registro         | No                        |
| `lib/grid-field/physarum.ts`        | Simulación del moho (Physarum) que usa `live-mold.ts`                                          | No                        |
| `lib/grid-field/screens.ts`         | Pantallas propias: sprites sostenidos en un canvas dentro de su caja (teléfono)                | Sí                        |
| `lib/grid-field/gravity.ts`         | Gravedad: N-cuerpos de partícula-malla (Poisson por FFT) que usa `live-cosmos.ts`              | No                        |
| `lib/grid-field/grid-field.test.ts` | Tests de los módulos puros (`pnpm test`)                                                       | —                         |

Solo `runner.ts` y `scripts/grid-field.ts` tocan `window`/`document`. Todo lo demás se testea en
Node con un contexto falso.

## 2. Conceptos

**Campo.** Un canvas fijo a pantalla completa con celdas de 2 px cada 6 px (1 px cada 3 px por
debajo de 640 px de ancho). Cada celda tiene una luz base que el parpadeo re-sortea. Hay un solo
campo y un solo loop para todo el sitio: es lo que hace que se lea como una superficie.

La celda fina del teléfono es para los glifos: en sus cajas chicas, un trazo más fino que dos
celdas cae entre ellas. El 2026-10-16 se probó la de escritorio (2 px cada 6) también en el
teléfono, para que el grano se viera igual, y se volvió atrás: en un iPhone y un Android, los glifos
perdían detalle.

**Formas (halo).** Cualquier elemento con `data-grid-shape` hace que las celdas detrás de él se
enciendan («condensar»); el resto del campo queda igual. Con `data-grid-shape="accent"` el halo
pinta con la paleta de señal (ámbar). Las formas se re-miden al hacer scroll, cada segundo y con
`runner.rescan()`, y entran y salen suavizadas (~120 ms).

**Escenarios (`Stage`).** Qué sprite se imprime y dónde. La caja es el rect de un elemento
(`target`), re-medido cada cuadro, así que el sprite sigue al elemento al hacer scroll o si es
sticky. Hay dos programas:

- `hold`: un sprite sostenido mientras dure el escenario. Lo usan los glifos de proyectos, el
  contacto y el 404.
- `live`: una simulación que escribe su máscara en cada cuadro (receta 3.7). Lo usa el hero.

Hubo un tercero, `loop` (un pool de sprites que sonaba en ciclos), para el hero de antes. Se quitó
con él, el 2026-10-15: no lo usaba nadie y la home necesitaba el peso para cosmos.

**Pantallas propias (teléfono).** Bajo `md:` las cajas no son sticky y bajan con la página. El
campo fijo se repinta a 30 fps desde el hilo principal y el scroll va por su cuenta (en el
compositor): el sprite quedaba atrás y se entrecortaba, sobre todo en iOS. Por eso, en un teléfono,
los sprites sostenidos (glifos de proyecto, 404) se dibujan en un canvas dentro de su caja
(`screens.ts`, que se baja solo ahí), con la misma celda, los mismos niveles y el mismo piso con
parpadeo (`spriteLight`, `levelOf`), sin el ruido de fondo. Pueden sonar varias a la vez: en la
lista, cada fila a la vista muestra su glifo, la activa en ámbar y el resto en la paleta de base al
50 %. Solo animan las que están a la vista. El campo sigue con el hero (escenario vivo).

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

**Ganancia de punto.** Un punto de luz sobre negro se lee aunque sea chico; uno de tinta sobre
papel casi desaparece. Por eso cada tema define `--grid-field-spread` (0 en oscuro, 0,5 en claro) y
los puntos crecen desde su centro (`dotSize`), como tinta que se corre:

- **El sprite crece parejo**, en todos sus niveles: la profundidad sigue en la opacidad, como en
  oscuro. Hacerlo crecer con la intensidad engordaba los trazos fuertes y dejaba atrás los tenues
  (los anillos del radar se perdían).
- **El campo solo crece en el pico del barrido** (sobre la luz máxima de un halo): el ruido y los
  halos quedan iguales.

Las celdas del sprite (cobertura > `SPRITE_GLYPH`) van en grupos de pintado propios, junto a los del
campo del mismo nivel: siguen siendo como mucho 48 cambios de `fillStyle`.

**Ganancias.** Hay dos, y multiplican todo, sprite incluido: `gain` (barrido por fila, en
`paintField`) y `presence` (el campo entero, que sube en el fundido de entrada).

**Entrada.** Al montar, el campo entra con un barrido de arriba hacia abajo. Una página con
`data-grid-intro="fade"` (hoy, solo `/lab/cosmosv2`) entra con un fundido de `presence`: espera
a su escenario (a lo sumo 2,5 s) y lo trae ya encendido, así entra con él listo y no a medio llegar.

**Transiciones de página.** `astro:before-preparation` llama a `runner.leave()` (la estructura se
disuelve en 180 ms) y suelta los escenarios. `astro:after-swap` llama a `runner.enter()` (barrido
de escaneo, o fundido si la página nueva lo pide, y la estructura nueva emerge). El contenido HTML
hace su propio fade en pasos (`lib/transitions.ts`). El snapshot viejo del canvas se oculta en
`global.css` para no duplicar puntos.

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
  Aprovecha las simetrías (los discos de `orbit` están a media vuelta) o haz que el final vuelva
  al principio (en `loop`, la cola alcanza a la punta donde empieza la vuelta siguiente).
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

Hoy hay uno por proyecto: `loop` (Revra, una flecha circular que se cierra), `eq` (NEX, un
ecualizador donde una barra gana la ronda), `path` (orientame.cl, pasos hacia una meta), `orbit`
(Fandoms.io, discos en órbita) y `zap` (Chucao, un televisor que cambia de canal). Los de ejemplo
(cubo, globo, osciloscopio, radar, red y anillo) se borraron con los proyectos de ejemplo. Un glifo
debe leerse en tres tamaños: el panel o el detalle (~440 px, celdas de 6 px), la caja del
siguiente proyecto (160 px) y la fila de la lista en un teléfono (96 px, celdas de 3 px). Ninguno
debe quedar muy por debajo de los otros en luz: `path` tenía la mitad que `loop` o `eq` y apenas se
veía en oscuro (2026-10-16); se subió el piso de sus pasos y de la meta.

### 3.4 Un escenario nuevo en una página

1. Pon la caja en la página: `<Stage stage="mi-escenario" class="aspect-square w-full" />`.
2. En `parseStage` (`scripts/grid-field.ts`), traduce el valor a un `Stage` con
   `hold(target, sprite, accent)`.
3. Para cambiar un escenario en vivo (como el formulario: `contact` → `sent`), cambia el atributo
   y dispara `document.dispatchEvent(new Event('grid:refresh'))`.

Valores existentes: `contact`, `sent`, `404`, `glyph:<clave>` y `live:<patrón>` (3.7). Un glifo va
en ámbar (el proyecto que se lee); con `data-grid-tone="base"` (`<Stage tone="base">`), en la
paleta de base: lo usa el siguiente proyecto, al pie del detalle.

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
   celdas del efecto: columna y fila mínimas y máximas). Dentro del loop, salta rápido si la celda
   está fuera de la caja. Decide si multiplica solo la luz base (el término `base` de `cellLight`)
   o la ganancia total, como `gain` (incluye el sprite).
4. **Runner.** Guarda el estado, pásalo en cada `paintField` y expón un método (`ripple(x, y)`) en
   `GridFieldRunner`. Con movimiento reducido, no hagas nada.
5. **Disparo.** Llámalo desde `scripts/grid-field.ts` (un listener de clic, una transición).

Para elegir la forma del efecto, según de qué dependa:

| Depende de…                        | Cálculo                                                        | Ejemplo                |
| ---------------------------------- | -------------------------------------------------------------- | ---------------------- |
| Solo la fila                       | Precalcula un `Float32Array(rows)` por cuadro (como `rowGain`) | Barrido de escaneo     |
| Solo la columna                    | `Float32Array(cols)`                                           | Barrido horizontal     |
| Distancia a un punto               | Caja en celdas + `d²` (sin `sqrt`) solo dentro de la caja      | Onda                   |
| Un hash estable por celda          | Precalcula un `Uint8Array`/`Float32Array` en `measure()`       | Disolución por tramado |
| Desplazar la lectura de la máscara | Cambia `lc`/`lr` por banda de filas                            | Glitch de sprite       |

### 3.7 Un escenario vivo

Un programa `live`: una simulación que escribe su máscara en cada cuadro, en vez de cuadros
rasterizados. Se declara con `data-grid-stage="live:<patrón>"` y `data-grid-cursor`. El contexto, las
reglas (islas, cursor sin rastro, cuadro quieto que se asienta una vez), los patrones y su peso
están en `docs/sesion-2026-10-02-hero-vivo.md`, sección 5. Para uno nuevo:

1. Implementa `LiveSource` (`frame` y `still`) en un `live-<nombre>.ts`, en celdas de unos 6 px
   (`fineScale` con el `cellPx` del contexto), con las utilidades de `live.ts`.
2. Regístralo en `LOADERS` (`live-patterns.ts`) y agrégalo a los tests de «patrones vivos».
3. Pruébalo en `/lab`: una entrada en `src/lab/variants.ts`.

Cada patrón se baja aparte (`import()` en `LOADERS`), solo en la página que lo usa: la home paga
cosmos (4,6 KB gz con la gravedad y `live.ts`) y no los demás del laboratorio.

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
- **Sin velo.** Un efecto suma luz donde marca; nunca atenúa el resto del campo: apagar todo lo
  que no era halo oscurecía la pantalla entera. Tampoco hay brillo bajo el cursor (se quitó a
  propósito).
- **Color.** El ámbar significa estado, foco o interacción. Un sprite decorativo va en `base`.
- **Contraste.** Un sprite llega a 0,92 de opacidad: nunca lo pongas detrás de texto. Las únicas
  excepciones, pedidas: el patrón Julia, que pasa por debajo de las letras al 30 % de su luz, y
  cosmos, al 40 %, en cualquier ancho.
- **Sin frameworks.** El motor es TypeScript plano; no lo envuelvas en React.

## 5. Parámetros

`GRID_FIELD_DEFAULTS` (`runner.ts`):

| Campo                    | Valor      | Efecto                                                 |
| ------------------------ | ---------- | ------------------------------------------------------ |
| `fps`                    | 30         | Tope de cuadros por segundo                            |
| `maxOpacity`             | 0,22       | Luz máxima de una celda de ruido                       |
| `chance`                 | 0,45       | Fracción de celdas re-sorteadas por segundo            |
| `maxCells`               | 90 000     | Presupuesto de celdas; por encima la grilla se engrosa |
| `maxDpr`                 | 2          | Tope del devicePixelRatio                              |
| `restCondense`           | 0,5        | Cuánto destacan los halos en reposo                    |
| `intro`                  | `sweep`    | Entrada al montar: barrido o fundido (`fade`)          |
| `introMs` / `introTauMs` | 1100 / 900 | Barrido que revela el campo y emergencia inicial       |
| `fadeInMs`               | 1200       | Fundido de entrada (`intro: 'fade'`)                   |
| `enterMs` / `enterTauMs` | 650 / 450  | Barrido y emergencia al llegar a otra página           |
| `leaveMs`                | 180        | Disolución al salir de una página                      |
| `fadeMs`                 | 260        | Fade de los sprites y de los cambios de escenario      |

`LOOP_DEFAULTS` (`timeline.ts`): `firstMs` 600, `everyMs` 7000, `spriteMs` 4600, `fadeMs` 260.

Otros: `MIN_BOX_CELLS` = 8 (caja mínima para dibujar), `MIN_RATIO` = 0,3 y `WIDE_QUERY` = 48rem
(desde ahí la lista usa el panel sticky).

Si un móvil modesto no da el ancho, lo primero es `fps: 20`, `maxCells: 40_000` o `maxDpr: 1.5`.

Cosmos tiene un ritmo por forma de caja (`LANDSCAPE_TEMPO` y `PORTRAIT_TEMPO` en `live-cosmos.ts`):
en una caja vertical (un teléfono) la materia arranca más junta y el tornado nace antes. Ver las
secciones 14 (teléfono) y 16 (escritorio) de `docs/sesion-2026-10-02-hero-vivo.md`. La entrada la
marca ese ritmo, no el costo: en escritorio la simulación cuesta ~3 ms por cuadro y corre a tiempo
real.

Para probar otra celda en escritorio sin tocar el código: `<html data-grid-cell="4:2">` (paso y punto,
en px; lo pone la barra de `/lab`). Ignora `maxCells`: a 4 px el cuadro cuesta ~2,5 veces más.

## 6. Ideas pendientes y dónde encajan

| Idea                                       | Dónde                                                                 | Notas                                                                |
| ------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `/lab` para afinar sprites y efectos       | Ruta inyectada solo en `astro dev` (integración en `astro.config.ts`) | Hoy, para previsualizar un sprite, ponlo en un `Stage` de una página |
| Onda al hacer clic en los CTA              | Receta 3.6 (distancia a un punto)                                     |                                                                      |
| Disolución por tramado al navegar          | Hash por celda en `measure()` + progreso en `leave()`                 | Reemplazaría o complementaría la disolución actual                   |
| Glitch de bandas en sprites                | Desplazar `lc` por banda de filas en `paintField`                     | Hoy el glitch del 404 se hace en el dibujo                           |
| Sprites de imagen/SVG (logos de proyectos) | Nuevo tipo de cuadro `{ image }` → `drawImage` en `rasteriseFrame`    | Los logos necesitan formas gruesas                                   |
| Texto vivo (hora, contadores)              | Cuadros generados al vuelo con caché por string                       | El caché actual es por índice de cuadro                              |
| Más de un sprite a la vez                  | Varias máscaras en `FrameInput`                                       | Rompe "un escenario a la vez": pensarlo antes                        |
| Renderer WebGL2                            | Detrás de `paintField`, sin tocar relojes ni sprites                  | Solo si las mediciones en móvil lo piden                             |

## 7. Checklist antes de dar por terminado un cambio

- [ ] `pnpm check`, `pnpm lint` y `pnpm test` en verde; el reloj nuevo tiene su test.
- [ ] Se ve en oscuro y en claro, en escritorio y en móvil (390 px).
- [ ] Con `prefers-reduced-motion` queda un cuadro quieto y legible.
- [ ] El JS de la página sigue bajo ~20 KB gz (revisa `dist/client/_astro` después de `pnpm build`).
- [ ] Ningún sprite cae detrás de texto.
