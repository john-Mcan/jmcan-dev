# Grid Field: fondo animado de grilla para Next.js / React

> **Referencia histórica.** Esta es la guía original con la que arrancó el fondo del sitio. El
> código actual (`src/lib/grid-field/`) ya divergió: es TypeScript plano sin React, con escenarios,
> paleta de señal y transiciones de página. Para trabajar en el sitio, lee
> [`grid-field-extending.md`](./grid-field-extending.md).

Guía para reproducir en otro sitio el loader de pantalla completa del dashboard de zxen
(`apps/console/src/components/loading/`), adaptado para usarse **principalmente como fondo
decorativo** y, además, **como loader**.

Todo el código de esta guía está completo y se verificó antes de escribirla (ver
[§13 Verificación](#13-verificación-realizada)): basta con copiar los archivos de la §5.

**Índice**

1. [Qué es](#1-qué-es)
2. [Requisitos y dependencias](#2-requisitos-y-dependencias)
3. [Cómo funciona](#3-cómo-funciona)
4. [Estructura de archivos](#4-estructura-de-archivos)
5. [El código](#5-el-código)
6. [Usarlo como fondo en Next.js](#6-usarlo-como-fondo-en-nextjs)
7. [Usarlo como loader](#7-usarlo-como-loader)
8. [Referencia de props](#8-referencia-de-props)
9. [Crear sprites propios](#9-crear-sprites-propios)
10. [Rendimiento, accesibilidad y SSR](#10-rendimiento-accesibilidad-y-ssr)
11. [Tests](#11-tests)
12. [Problemas comunes](#12-problemas-comunes)
13. [Verificación realizada](#13-verificación-realizada)
14. [Extensión opcional: brillo que sigue al puntero](#14-extensión-opcional-brillo-que-sigue-al-puntero)
15. [Anexo: correspondencia con el original](#anexo-correspondencia-con-el-original)

---

## 1. Qué es

Un `<canvas>` con una grilla fina de cuadritos (2 px con 4 px de separación) que parpadean en
tonos tenues. Sobre ese ruido se combinan tres capas:

1. **Ruido.** Cada celda tiene una luz aleatoria que se vuelve a sortear: por defecto, el 45 % de
   las celdas por segundo.
2. **Formas.** Elementos marcados con `data-grid-shape`. Las celdas que caen encima se encienden
   más y el resto se apaga; a eso se le llama «condensar». En el loader es la silueta de la vista
   que viene; en el fondo, un halo detrás de títulos y botones reales.
3. **Sprite.** Una palabra, un kaomoji o un dibujo animado (anillo que respira, puntos, órbita…)
   que se rasteriza sobre la grilla cuadro a cuadro.

No usa ninguna librería: solo Canvas 2D y APIs estándar del navegador.

### Qué cambia respecto del original

| | Original (dashboard) | Esta adaptación |
|---|---|---|
| Ciclo | Una espera: aparece, juega un sprite 3 s, condensa y se va | **`ambient`**: loop infinito (un sprite cada 12 s y halo en reposo). **`loader`**: igual que el original |
| Color | Blanco fijo | Prop `rgb` o variable CSS `--grid-field-rgb`; sigue el tema |
| Coste por cuadro | Crea 24 arrays por cuadro (aceptable durante 1 s) | Buffers reservados una sola vez, tope de FPS (30) y pausa con la pestaña oculta o fuera de pantalla |
| Pantallas grandes | Paso fijo | Presupuesto de celdas (`maxCells`) que engrosa la grilla |
| Formas | 5 siluetas fijas (arquetipos) | Silueta propia (`children`) **o** elementos reales del documento, re-medidos al hacer scroll |
| Posición del sprite | Centrado en toda el área | `spriteArea`, una región configurable |
| Caché de máscaras | Todo el sprite (un sprite por espera) | Solo el sprite actual, porque un fondo puede correr horas |
| Fuentes | La del body | Espera a `document.fonts`; prop `fontFamily` |

---

## 2. Requisitos y dependencias

**Dependencias de runtime: ninguna.** Solo `react` y `react-dom`, que el proyecto ya tiene.

| Requisito | Versión | Nota |
|---|---|---|
| React | ≥ 18 (verificado con 19.2) | Usa `useState`, `useEffect`, `useRef`, `useCallback` y `createContext` |
| Next.js | App Router ≥ 13.4 | Los componentes son Client Components (`'use client'`). Con Pages Router también funciona; lo único propio de App Router es `loading.tsx` (§7.2) |
| TypeScript | ≥ 5 | Compila con `strict` y `noUncheckedIndexedAccess`. `lib` debe incluir `dom` y `dom.iterable` (el `tsconfig` que genera Next ya los trae) |
| Navegador | Baseline actual | Canvas 2D, `requestAnimationFrame`, `ResizeObserver`, `IntersectionObserver`, `MutationObserver`, `matchMedia`, `document.fonts` |
| Tailwind | Opcional | Los componentes usan estilos inline; funcionan con o sin Tailwind |

Solo si quieres los tests de la §11:

```bash
pnpm add -D vitest
```

Los tests cubren los módulos puros. jsdom no implementa canvas, así que el pintado se prueba con un
contexto falso y no hace falta `jsdom` ni `canvas`.

---

## 3. Cómo funciona

### 3.1 La grilla

- El área se mide con `getBoundingClientRect` (px CSS). El paso es `square + gap`: **2 + 4 = 6 px** en
  escritorio y **1 + 2 = 3 px** por debajo de 640 px de ancho. La razón es Nyquist: un trazo más fino
  que dos celdas cae entre ellas y desaparece, y en un área angosta el texto se dibuja más chico.
- Las celdas viven en un `Float32Array` column-major (`índice = col * rows + row`). Un área de
  1440×810 son 240×135 = 32.400 celdas.
- Si `cols × rows` supera `maxCells` (90.000 por defecto), el paso crece en proporción.
- El canvas se dimensiona a `ancho × dpr`, con `dpr` limitado por `maxDpr` (2).

### 3.2 La opacidad de una celda

```
base  = cells[i]                                  // 0 … maxOpacity (0,22), re-sorteada por el parpadeo
forma = celda dentro de una forma ? 1 + 1,6·condense : 1 − 0,97·condense

sin glifo:  opacidad = base · forma · presence
con glifo:  opacidad = ( base · forma · (1 − 0,55·textAlpha)                   // el fondo se atenúa alrededor
                       + textAlpha · glifo · (0,45 + 0,55·base/maxOpacity) )   // piso propio: el texto no parpadea a medias
                       · presence
```

Después se cuantiza a **24 niveles** (techo 0,92; por debajo de 0,02 no se pinta) y se pinta agrupado
por nivel con un counting sort. Así hay 24 cambios de `fillStyle` por cuadro y no uno por celda: asignar
`fillStyle` obliga a parsear un string de color, y eso es lo caro.

### 3.3 El parpadeo

`flickerCells` no tira un dado por celda: sortea **cuáles** cambian, `n = celdas × chance × dt`. Con
`condense` alto el parpadeo baja hasta un 75 % para que la estructura se pueda leer.

### 3.4 Los sprites

1. Cada cuadro (un texto o una función de dibujo) se pinta **en blanco** sobre un canvas oculto del
   tamaño del área.
2. Se lee el canal alfa con `getImageData` y se promedia por celda (cobertura por área, hasta 4×4
   muestras). El resultado es una máscara `Float32Array`.
3. Las máscaras se cachean por cuadro del sprite actual: cada cuadro se rasteriza una sola vez por
   ciclo de sprite.

El texto se dibuja en bold 700 con la fuente del body, con relleno más un trazo del 5 % del tamaño (sin
el trazo, los glifos de símbolos son líneas demasiado finas). El tamaño sale del cuadro **más ancho**
del sprite, para que un texto que «se tipea» no cambie de tamaño en cada cuadro.

### 3.5 Las líneas de tiempo

**Modo `ambient`** (fondo):

```
0         1,2 s  1,5 s            4,5 s                          13,5 s           16,5 s
├─ intro ──┤      ├── sprite 1 ───┤─────────── reposo ────────────┤── sprite 2 ───┤ …
presence 0→1      textAlpha 0→1→0  condense = restCondense (halo)    (nunca repite el anterior)
```

Durante un sprite el halo baja a 0 (`condense = restCondense · (1 − textAlpha)`). El sprite y la
estructura quedan excluidos **por construcción**: cuando se superponen, ninguno de los dos se lee.

**Modo `loader`** (idéntico al original):

```
0       180 ms                      3 s                       llega el contenido    +200 ms
├─ nada ─┤──────── sprite ───────────┤── la estructura emerge ───┤───── fade ─────┤ se desmonta
```

- Por debajo de 180 ms no se dibuja nada. Si el contenido llega antes, el loader se va sin fade: el
  destello costaría más de lo que informa.
- La estructura emerge de forma asintótica (`1 − e^(−t/900 ms)`), porque nada sabe cuánto falta.
- Con movimiento reducido no hay parpadeo y el loader se va sin fade. En `ambient`, el fondo queda
  como un único cuadro quieto.

---

## 4. Estructura de archivos

```
components/grid-field/
├── grid-field.ts               motor puro: grilla, formas, máscaras, parpadeo, pintado
├── timeline.ts                 relojes puros: ambientPhase (fondo) y loaderPhase (loader)
├── sprites.ts                  tipos, pool por defecto, sorteo sin repetición
├── sprite-drawings.ts          sprites dibujados (red, anillo, puntos, órbita, barras, moneda)
├── sprite-raster.ts            cuadro → cobertura alfa
├── runner.ts                   runtime imperativo: canvas, rAF, observers, tema, pausas
├── grid-field-background.tsx   <GridFieldBackground />          'use client'
├── grid-field-loader.tsx       <GridFieldLoader active />       'use client'
├── route-loading.tsx           provider + overlay + claim       'use client'
├── route-claim.tsx             default export de los loading.tsx 'use client'
└── grid-field.test.ts          tests (opcional)
```

Solo los `.tsx` llevan `'use client'`. Los `.ts` son módulos planos que importan los componentes
cliente. Solo tocan `window` y `document` dentro de funciones, así que importarlos no rompe el SSR.

---

## 5. El código

Copia cada archivo tal cual. Los imports son relativos dentro de `components/grid-field/`.

### 5.1 `grid-field.ts`: el motor

Sin React y sin DOM; todo se puede testear con un contexto falso.

```ts
/**
 * Motor puro del campo: sin React y sin DOM. Una sola grilla sobre toda el área,
 * todas las celdas con el mismo reloj — eso es lo que hace que se lea como UNA
 * superficie y no como N cajas parpadeando desfasadas.
 */

export type Rgb = readonly [number, number, number]

export interface FieldRect {
  x: number
  y: number
  w: number
  h: number
}

export interface FieldGeometry {
  width: number
  height: number
  /** Lado de un cuadro encendido, en px CSS. */
  square: number
  /** Espacio oscuro entre cuadros. `square + gap` es el paso del que deriva todo. */
  gap: number
  maxOpacity: number
}

export interface GridField extends FieldGeometry {
  cols: number
  rows: number
  /** Luz base por celda; el parpadeo la re-sortea. */
  cells: Float32Array
  /** 1 donde la celda cae sobre una forma (`data-grid-shape`). */
  shapes: Uint8Array
  /** Cobertura del glifo/dibujo por celda, 0–1. Null si no hay sprite. */
  text: Float32Array | null
}

export interface FieldPhase {
  /** 0 → ruido uniforme, 1 → las formas emergieron del todo. */
  condense: number
  /** 0 → sin sprite, 1 → sprite a plena intensidad. */
  textAlpha: number
  /** 1 → visible, 0 → invisible (fade de entrada/salida). */
  presence: number
}

/** Solo lo que el pintado usa del contexto 2D: permite testear con un doble. */
export type FieldCanvas = Pick<
  CanvasRenderingContext2D,
  'setTransform' | 'clearRect' | 'fillRect' | 'fillStyle'
>

/** Canal alfa rasterizado, tal como lo entrega `getImageData`. */
export interface AlphaSource {
  data: Uint8ClampedArray
  width: number
  height: number
}

export const FIELD_DEFAULTS = { maxOpacity: 0.22, chance: 0.45 } as const

export function fieldStep(geometry: Pick<FieldGeometry, 'square' | 'gap'>): number {
  return geometry.square + geometry.gap
}

/**
 * Tamaño de celda para un área. NYQUIST: un trazo más fino que dos celdas cae
 * entre ellas y desaparece, así que un área angosta (texto más chico) necesita
 * celdas más finas. Un viewport grande se engrosa hasta caber en `maxCells`.
 */
export function fieldGeometryFor(
  width: number,
  height: number,
  maxCells: number,
): Pick<FieldGeometry, 'square' | 'gap'> {
  const base = width < 640 ? { square: 1, gap: 2 } : { square: 2, gap: 4 }
  const baseStep = fieldStep(base)
  const cells = (width / baseStep) * (height / baseStep)
  if (cells <= maxCells) return base
  const step = Math.ceil(baseStep * Math.sqrt(cells / maxCells))
  const square = Math.max(1, Math.round(step / 3))
  return { square, gap: step - square }
}

export function createField(geometry: FieldGeometry): GridField {
  const step = fieldStep(geometry)
  const cols = Math.max(1, Math.ceil(geometry.width / step))
  const rows = Math.max(1, Math.ceil(geometry.height / step))
  const cells = new Float32Array(cols * rows)
  for (let i = 0; i < cells.length; i++) cells[i] = Math.random() * geometry.maxOpacity
  return { ...geometry, cols, rows, cells, shapes: new Uint8Array(cols * rows), text: null }
}

/**
 * Pásale los rects del CONTENIDO (un título, una fila), nunca del contenedor:
 * el rect de una tarjeta se enciende como un bloque y la estructura se pierde.
 * Índice column-major: `col * rows + row`.
 */
export function markShapes(field: GridField, rects: readonly FieldRect[]): void {
  field.shapes.fill(0)
  const step = fieldStep(field)
  const pad = 2
  for (const rect of rects) {
    if (rect.w < 1 || rect.h < 1) continue
    const i0 = Math.max(0, Math.floor((rect.x - pad) / step))
    const i1 = Math.min(field.cols - 1, Math.ceil((rect.x + rect.w + pad) / step))
    const j0 = Math.max(0, Math.floor((rect.y - pad) / step))
    const j1 = Math.min(field.rows - 1, Math.ceil((rect.y + rect.h + pad) / step))
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) field.shapes[i * field.rows + j] = 1
    }
  }
}

/**
 * Cobertura por ÁREA, no un píxel por celda: muestrear un solo punto hace que un
 * trazo o se adueñe de la celda o desaparezca, y eso destroza los glifos. Las
 * celdas a medio encender en los bordes son el antialiasing de la grilla.
 */
export function buildTextMask(field: GridField, source: AlphaSource): void {
  const step = fieldStep(field)
  const span = Math.max(1, Math.min(step, 4))
  const stride = Math.max(1, Math.floor(step / span))
  const mask = new Float32Array(field.cols * field.rows)
  for (let i = 0; i < field.cols; i++) {
    for (let j = 0; j < field.rows; j++) {
      mask[i * field.rows + j] = sampleCoverage(source, i * step, j * step, span, stride)
    }
  }
  field.text = mask
}

function sampleCoverage(
  source: AlphaSource,
  x: number,
  y: number,
  span: number,
  stride: number,
): number {
  let sum = 0
  let n = 0
  for (let dx = 0; dx < span; dx++) {
    const px = x + dx * stride
    if (px >= source.width) break
    for (let dy = 0; dy < span; dy++) {
      const py = y + dy * stride
      if (py >= source.height) break
      sum += source.data[(py * source.width + px) * 4 + 3] ?? 0
      n++
    }
  }
  return n > 0 ? sum / (n * 255) : 0
}

/**
 * Sortea CUÁLES celdas cambian en vez de preguntarle a cada una: con decenas de
 * miles de celdas, tirar un dado por celda gasta casi todo en rechazos.
 * `chance` = fracción de celdas re-sorteadas por segundo.
 */
export function flickerCells(
  field: GridField,
  options: { dt: number; chance: number; condense: number },
): void {
  const chance = options.chance * (1 - options.condense * 0.75)
  const len = field.cells.length
  let n = Math.min(len, Math.round(len * chance * options.dt))
  while (n-- > 0) {
    field.cells[(Math.random() * len) | 0] = Math.random() * field.maxOpacity
  }
}

/**
 * El sprite tiene un PISO propio y solo parpadea alrededor de él: derivarlo del
 * valor de la celda borra media palabra en cada cuadro.
 */
export function cellOpacity(field: GridField, index: number, phase: FieldPhase): number {
  if (phase.presence <= 0) return 0

  const cell = field.cells[index] ?? 0
  const shape = field.shapes[index] ? 1 + phase.condense * 1.6 : 1 - phase.condense * 0.97
  const glyph = phase.textAlpha > 0.01 ? (field.text?.[index] ?? 0) : 0
  if (glyph <= 0) return cell * shape * phase.presence

  const dimmed = cell * shape * (1 - 0.55 * phase.textAlpha)
  const stroke = phase.textAlpha * glyph * (0.45 + (0.55 * cell) / field.maxOpacity)
  return (dimmed + stroke) * phase.presence
}

const LEVELS = 24
const LEVEL_CEILING = 0.92
const MIN_VISIBLE = 0.02
const SKIP = 255

/** Un `fillStyle` por nivel, nunca por celda: parsear el color es lo que cuesta el cuadro. */
export function levelStyles(rgb: Rgb): string[] {
  const [r, g, b] = rgb
  return Array.from(
    { length: LEVELS },
    (_, i) => `rgba(${r},${g},${b},${(((i + 1) / LEVELS) * LEVEL_CEILING).toFixed(3)})`,
  )
}

/** Memoria del pintado, reservada UNA vez por tamaño: el loop no asigna nada. */
export interface PaintBuffers {
  levels: Uint8Array
  order: Int32Array
  counts: Int32Array
  starts: Int32Array
  cursor: Int32Array
}

export function createPaintBuffers(field: GridField): PaintBuffers {
  const n = field.cells.length
  return {
    levels: new Uint8Array(n),
    order: new Int32Array(n),
    counts: new Int32Array(LEVELS),
    starts: new Int32Array(LEVELS),
    cursor: new Int32Array(LEVELS),
  }
}

/**
 * Cuantiza cada celda a uno de 24 niveles y las pinta agrupadas por nivel
 * (counting sort): 24 cambios de `fillStyle` por cuadro en vez de uno por celda.
 */
export function paintField(
  ctx: FieldCanvas,
  field: GridField,
  phase: FieldPhase,
  buffers: PaintBuffers,
  styles: readonly string[],
  dpr: number,
): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, field.width, field.height)
  if (phase.presence <= 0) return

  const { levels, order, counts, starts, cursor } = buffers
  const len = field.cells.length
  counts.fill(0)
  for (let i = 0; i < len; i++) {
    const opacity = cellOpacity(field, i, phase)
    if (opacity < MIN_VISIBLE) {
      levels[i] = SKIP
      continue
    }
    const level = Math.min(LEVELS - 1, ((opacity / LEVEL_CEILING) * LEVELS) | 0)
    levels[i] = level
    counts[level] = (counts[level] ?? 0) + 1
  }

  let running = 0
  for (let level = 0; level < LEVELS; level++) {
    starts[level] = running
    cursor[level] = running
    running += counts[level] ?? 0
  }
  for (let i = 0; i < len; i++) {
    const level = levels[i] ?? SKIP
    if (level === SKIP) continue
    const at = cursor[level] ?? 0
    order[at] = i
    cursor[level] = at + 1
  }

  const step = fieldStep(field)
  const rows = field.rows
  for (let level = 0; level < LEVELS; level++) {
    const count = counts[level] ?? 0
    if (count === 0) continue
    ctx.fillStyle = styles[level] ?? ''
    const start = starts[level] ?? 0
    for (let k = start; k < start + count; k++) {
      const index = order[k] ?? 0
      const col = (index / rows) | 0
      ctx.fillRect(col * step, (index - col * rows) * step, field.square, field.square)
    }
  }
}
```

### 5.2 `timeline.ts`: los relojes

Son funciones puras del tiempo transcurrido. `ambientPhase` es nueva; `loaderPhase` reproduce el
`loading-phases.ts` original.

```ts
import type { FieldPhase } from './grid-field'

/**
 * Los relojes del campo, como funciones PURAS del tiempo transcurrido: se testean
 * sin canvas y sin requestAnimationFrame.
 */

export interface SpriteClock {
  frameCount: number
  /** Cuánto se sostiene un cuadro del sprite. */
  frameMs: number
}

// ─── Modo ambient (fondo decorativo, en loop) ────────────────────────────────

export interface AmbientTimeline {
  /** Fade-in del campo completo al montar. */
  introMs: number
  /** Espera antes del primer sprite. */
  firstSpriteMs: number
  /** Período entre el inicio de un sprite y el del siguiente. 0 = sin sprites. */
  spriteEveryMs: number
  /** Cuánto dura un sprite en pantalla (debe ser < spriteEveryMs). */
  spriteMs: number
  /** Fade de entrada/salida del sprite. */
  fadeMs: number
  /** Cuánto destacan las formas en reposo (0–1). 1 apaga el ruido fuera de ellas. */
  restCondense: number
  /** Constante de tiempo de la emergencia inicial de las formas. */
  condenseTauMs: number
}

export const AMBIENT_DEFAULTS: AmbientTimeline = {
  introMs: 1200,
  firstSpriteMs: 1500,
  spriteEveryMs: 12_000,
  spriteMs: 3000,
  fadeMs: 260,
  restCondense: 0.45,
  condenseTauMs: 900,
}

export interface AmbientPhase extends FieldPhase {
  /** Índice del ciclo de sprite en curso; -1 antes del primero. */
  cycle: number
  /** Cuadro del sprite a dibujar, o -1 si no hay sprite sonando. */
  frameIndex: number
}

export function ambientPhase(
  elapsed: number,
  clock: SpriteClock,
  timeline: AmbientTimeline,
  hasShapes: boolean,
): AmbientPhase {
  const presence = timeline.introMs > 0 ? clamp(elapsed / timeline.introMs) : 1
  const since = elapsed - timeline.firstSpriteMs
  const cycle = since < 0 || timeline.spriteEveryMs <= 0 ? -1 : Math.floor(since / timeline.spriteEveryMs)
  const local = cycle < 0 ? -1 : since - cycle * timeline.spriteEveryMs
  const playing = local >= 0 && local <= timeline.spriteMs && clock.frameCount > 0
  const fade = Math.max(1, timeline.fadeMs)

  const textAlpha = playing
    ? Math.min(clamp(local / fade), clamp((timeline.spriteMs - local) / fade))
    : 0
  const frameIndex =
    playing && clock.frameMs > 0 ? Math.floor(local / clock.frameMs) % clock.frameCount : -1

  // Excluidos por CONSTRUCCIÓN, no por afinar dos rampas para que no se crucen:
  // cuando se superponen, ni el sprite ni la estructura se leen.
  const rising = 1 - Math.exp(-elapsed / timeline.condenseTauMs)
  const condense = hasShapes ? timeline.restCondense * rising * (1 - textAlpha) : 0

  return { presence, condense, textAlpha, frameIndex, cycle }
}

// ─── Modo loader (una espera, igual que el original) ─────────────────────────

/** Bajo este umbral una espera no vale la pena dibujarla: el flash cuesta más de lo que informa. */
export const APPEAR_THRESHOLD_MS = 180
/** Cuánto tarda el campo en desvanecerse una vez que llegó el contenido. */
export const HANDOFF_MS = 200
const LOADER_FADE_MS = 260
/** Cuánto suena el sprite antes de cederle las celdas a la estructura. */
const LOADER_SPRITE_MS = 3000
const LOADER_TAU_MS = 900

export interface LoaderPhase extends FieldPhase {
  visible: boolean
  frameIndex: number
  done: boolean
}

/**
 * Nada aquí sabe cuánto dura una espera, así que la estructura emerge de forma
 * ASINTÓTICA en vez de interpolar hacia un plazo inventado: una barra de
 * progreso que predice es una barra de progreso que miente.
 */
export function loaderPhase(
  elapsed: number,
  handoffElapsed: number | null,
  clock: SpriteClock,
): LoaderPhase {
  const handoff = handoffElapsed === null ? 0 : clamp(handoffElapsed / HANDOFF_MS)
  const textAlpha =
    clock.frameCount <= 0
      ? 0
      : Math.min(clamp(elapsed / LOADER_FADE_MS), clamp((LOADER_SPRITE_MS - elapsed) / LOADER_FADE_MS))
  const rising = clamp(1 - Math.exp(-Math.max(0, elapsed - APPEAR_THRESHOLD_MS) / LOADER_TAU_MS))
  const frameIndex =
    clock.frameCount <= 0 || clock.frameMs <= 0
      ? -1
      : Math.floor(elapsed / clock.frameMs) % clock.frameCount
  const visible = elapsed >= APPEAR_THRESHOLD_MS

  return {
    visible,
    presence: visible ? 1 - handoff : 0,
    condense: rising * (1 - textAlpha),
    textAlpha,
    frameIndex,
    done: handoffElapsed !== null && handoff >= 1,
  }
}

function clamp(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}
```

### 5.3 `sprites.ts`: tipos y pool

El pool del dashboard tenía chistes internos (`HODL ₿`, `to the moon`…). Aquí va uno neutral; cámbialo
por el tuyo (§9).

```ts
import { BREATHING_RING, FOLDING_BARS, NETWORK_PULSE, ORBITING_DISCS, PULSING_DOTS } from './sprite-drawings'

/**
 * Lo que mide si un sprite se lee (no es estilo): una celda mide 6px en desktop y
 * 3px en móvil, así que cada glifo recibe un puñado de ellas. Palabras de hasta
 * ~22 caracteres y bloques sólidos se leen; `ʕ•ᴥ•ʔ` se vuelve papilla y un emoji
 * cae como una mancha (su detalle vive en el color, y el campo solo lee cobertura).
 */

/** Texto, o un dibujo cuando la forma no debe depender de una fuente. */
export type SpriteFrame =
  | string
  | ((ctx: CanvasRenderingContext2D, width: number, height: number) => void)

export interface Sprite {
  frames: readonly SpriteFrame[]
  /** Cuánto se sostiene cada cuadro. Los bloques se MIRAN, las palabras se LEEN. */
  frameMs: number
}

/** Medio segundo alcanza para leer dos o tres palabras. */
export const WORD_MS = 500
export const BLOCK_MS = 90

/** Defínelo a nivel de módulo, nunca dentro de un render: el runner compara por identidad. */
export const DEFAULT_SPRITES: readonly Sprite[] = [
  { frames: ['hola', 'hola.', 'hola..', 'hola...'], frameMs: WORD_MS },
  { frames: ['o_O', 'O_o'], frameMs: WORD_MS },
  { frames: ['(-_-)', '(-_-)', '(-_-)', '(o_o)'], frameMs: WORD_MS },
  { frames: ['z', 'zz', 'zzZ', 'zzZ'], frameMs: WORD_MS },
  { frames: ['¯\\_(ツ)_/¯'], frameMs: WORD_MS },
  { frames: ['4 0 4', '4 0 4', 'era chiste'], frameMs: WORD_MS },
  { frames: NETWORK_PULSE, frameMs: 70 },
  { frames: BREATHING_RING, frameMs: 70 },
  { frames: PULSING_DOTS, frameMs: 60 },
  { frames: ORBITING_DISCS, frameMs: 60 },
  { frames: FOLDING_BARS, frameMs: 70 },
]

/**
 * El siguiente sprite al azar, nunca el que acaba de sonar: una repetición
 * inmediata es el único resultado que se lee como roto y no como azar.
 * @param exclude índice recién usado, o -1 si no ha sonado ninguno.
 * @returns -1 si el pool está vacío.
 */
export function randomSpriteIndex(total: number, exclude: number): number {
  if (total <= 0) return -1
  if (total === 1) return 0
  if (exclude < 0 || exclude >= total) return Math.floor(Math.random() * total)
  const roll = Math.floor(Math.random() * (total - 1))
  return roll >= exclude ? roll + 1 : roll
}
```

### 5.4 `sprite-drawings.ts`: sprites dibujados

```ts
/**
 * Sprites DIBUJADOS: formas que ninguna línea de caracteres puede hacer.
 *
 * Dos reglas para cualquier dibujo nuevo:
 *  1. Nada fuera del área recibida (el campo no recorta: simplemente lo pierde).
 *  2. Ningún trazo más fino que dos celdas (~12px), o el muestreo lo pierde.
 * Se pinta en blanco: el campo solo lee el canal ALFA, el color lo pone él.
 */

type Draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => void
type Painter = (ctx: CanvasRenderingContext2D, box: Box, turn: number) => void

interface Box {
  width: number
  height: number
}

const TAU = Math.PI * 2

/** Abierto arriba (`i / count`): un loop que también dibujara turn=1 tartamudearía una vez por vuelta. */
export function drawnFrames(count: number, paint: Painter): readonly Draw[] {
  return Array.from(
    { length: count },
    (_, i): Draw =>
      (ctx, width, height) =>
        paint(ctx, { width, height }, i / count),
  )
}

function shade(alpha: number): string {
  return `rgba(255,255,255,${alpha.toFixed(3)})`
}

/** Dimensionado por el lado CORTO: el área puede ser vertical u horizontal. */
function squareIn(box: Box): { cx: number; cy: number; unit: number } {
  return { cx: box.width / 2, cy: box.height / 2, unit: Math.min(box.width, box.height) }
}

const NODES: readonly (readonly [number, number])[] = [
  [0.28, 0.5], [0.44, 0.24], [0.44, 0.5], [0.44, 0.76], [0.6, 0.34], [0.6, 0.66], [0.76, 0.5],
]
const EDGES: readonly (readonly [number, number])[] = [
  [0, 1], [0, 2], [0, 3], [1, 4], [2, 4], [2, 5], [3, 5], [4, 6], [5, 6],
]

function networkPulse(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const at = (node: readonly [number, number]): [number, number] => [
    cx + ((node[0] - 0.52) / 0.48) * unit * 0.42,
    cy + ((node[1] - 0.5) / 0.52) * unit * 0.42,
  ]
  const head = 0.2 + turn * 0.72
  ctx.lineCap = 'round'
  for (const [a, b] of EDGES) {
    const from = NODES[a]
    const to = NODES[b]
    if (!from || !to) continue
    const lit = Math.max(0, 1 - Math.abs(head - (from[0] + to[0]) / 2) * 6)
    ctx.strokeStyle = shade(0.22 + 0.78 * lit)
    ctx.lineWidth = unit * (0.045 + 0.025 * lit)
    ctx.beginPath()
    ctx.moveTo(...at(from))
    ctx.lineTo(...at(to))
    ctx.stroke()
  }
  for (const node of NODES) {
    const lit = Math.max(0, 1 - Math.abs(head - node[0]) * 7)
    ctx.fillStyle = shade(0.3 + 0.7 * lit)
    ctx.beginPath()
    ctx.arc(...at(node), unit * 0.05 * (1 + 0.5 * lit), 0, TAU)
    ctx.fill()
  }
}

function breathingRing(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const ring = unit * 0.36
  const breath = Math.sin(turn * TAU)
  ctx.strokeStyle = shade(0.92)
  ctx.lineWidth = unit * (0.05 + 0.022 * breath)
  ctx.beginPath()
  ctx.arc(cx, cy, ring * (1 + 0.1 * breath), 0, TAU)
  ctx.stroke()
  ctx.fillStyle = shade(0.55 - 0.35 * breath)
  ctx.beginPath()
  ctx.arc(cx, cy, ring * (0.42 - 0.16 * breath), 0, TAU)
  ctx.fill()
}

function pulsingDots(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  for (let i = 0; i < 3; i++) {
    const lift = Math.max(0, Math.sin(((turn - i * 0.16 + 1) % 1) * TAU))
    ctx.fillStyle = shade(0.32 + 0.68 * lift)
    ctx.beginPath()
    ctx.arc(cx + (i - 1) * unit * 0.31, cy - lift * unit * 0.07, unit * (0.085 + 0.04 * lift), 0, TAU)
    ctx.fill()
  }
}

function orbitingDiscs(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  ctx.fillStyle = shade(0.9)
  ctx.beginPath()
  ctx.arc(cx, cy, unit * 0.11, 0, TAU)
  ctx.fill()
  for (const offset of [0, 0.5]) {
    const angle = (turn + offset) * TAU
    // La profundidad es la única pista posible: el campo lee cobertura, así que
    // un disco detrás del núcleo solo puede ser más tenue y chico, nunca ocultarse.
    const depth = (Math.sin(angle) + 1) / 2
    ctx.fillStyle = shade(0.35 + 0.6 * depth)
    ctx.beginPath()
    ctx.arc(
      cx + Math.cos(angle) * unit * 0.42,
      cy + Math.sin(angle) * unit * 0.17,
      unit * (0.045 + 0.03 * depth),
      0,
      TAU,
    )
    ctx.fill()
  }
}

const BAR_COUNT = 7

function foldingBars(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const spread = Math.abs(Math.cos(turn * Math.PI))
  for (let i = 0; i < BAR_COUNT; i++) {
    const offset = (i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2)
    const half = unit * (0.1 + 0.22 * (1 - Math.abs(offset)) * (1 - spread * 0.4))
    ctx.fillStyle = shade(0.45 + 0.55 * (1 - Math.abs(offset)))
    ctx.fillRect(cx + offset * spread * unit * 0.44 - unit * 0.035, cy - half, unit * 0.07, half * 2)
  }
}

/** Moneda que gira; el símbolo se RECORTA del disco (`destination-out`), porque tinta sobre tinta no se ve en el alfa. */
export function coinFace(symbol: string): Painter {
  return (ctx, box, turn) => {
    const { cx, cy, unit } = squareIn(box)
    const radius = unit * 0.42
    const half = Math.abs(Math.cos(turn * TAU)) * radius
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.ellipse(cx, cy, Math.max(radius * 0.04, half), radius, 0, 0, TAU)
    ctx.fill()
    if (half < radius * 0.45) return
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.translate(cx, cy)
    ctx.scale(half / radius, 1)
    ctx.font = `700 ${radius * 1.3}px ${getComputedStyle(document.body).fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(symbol, 0, 0)
    ctx.restore()
  }
}

export const NETWORK_PULSE = drawnFrames(24, networkPulse)
export const BREATHING_RING = drawnFrames(28, breathingRing)
export const PULSING_DOTS = drawnFrames(24, pulsingDots)
export const ORBITING_DISCS = drawnFrames(30, orbitingDiscs)
export const FOLDING_BARS = drawnFrames(26, foldingBars)
```

### 5.5 `sprite-raster.ts`: de cuadro a cobertura

```ts
import type { AlphaSource, GridField } from './grid-field'
import type { Sprite, SpriteFrame } from './sprites'

/** Región del campo donde se dibuja el sprite, en FRACCIONES (0–1) del área. */
export interface SpriteArea {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Convierte un cuadro en la cobertura que el campo muestrea. Se dibuja en blanco
 * sobre un canvas fuera de pantalla (reutilizado: crear uno por cuadro cuesta) y
 * se devuelve el ImageData, del que solo importa el alfa.
 */
export function rasteriseFrame(
  scratch: HTMLCanvasElement,
  field: GridField,
  frame: SpriteFrame,
  sprite: Sprite,
  area: SpriteArea,
  fontFamily: string,
): AlphaSource | null {
  const width = Math.max(1, Math.floor(field.width))
  const height = Math.max(1, Math.floor(field.height))
  // Asignar width/height limpia el canvas aunque el valor no cambie: solo si cambió.
  if (scratch.width !== width) scratch.width = width
  if (scratch.height !== height) scratch.height = height
  const ctx = scratch.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.clearRect(0, 0, width, height)
  const box = { x: area.x * width, y: area.y * height, w: area.w * width, h: area.h * height }

  if (typeof frame !== 'string') {
    ctx.save()
    ctx.translate(box.x, box.y)
    frame(ctx, box.w, box.h)
    ctx.restore()
    return ctx.getImageData(0, 0, width, height)
  }

  const size = fontSizeFor(ctx, sprite, fontFamily, box.w, box.h)
  ctx.font = `700 ${size}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  // Trazo además de relleno: los glifos de bloques/símbolos son líneas finísimas
  // que ningún peso engrosa, y solas caen bajo el piso del muestreo.
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = size * 0.05
  ctx.lineJoin = 'round'
  const x = box.x + box.w / 2
  const y = box.y + box.h * 0.46
  ctx.strokeText(frame, x, y)
  ctx.fillText(frame, x, y)
  return ctx.getImageData(0, 0, width, height)
}

/**
 * Tamaño según el cuadro MÁS ANCHO del sprite, no el que se dibuja: escalar por
 * cuadro hace que un sprite que se "tipea" bombee de tamaño en cada vuelta.
 */
function fontSizeFor(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  family: string,
  width: number,
  height: number,
): number {
  ctx.font = `700 100px ${family}`
  let widest = 1
  for (const frame of sprite.frames) {
    if (typeof frame !== 'string') continue
    widest = Math.max(widest, ctx.measureText(frame).width)
  }
  return Math.min((100 * width * 0.86) / widest, height * 0.38)
}
```

### 5.6 `runner.ts`: el runtime

Todo el estado mutable vive aquí, fuera de React. Un cambio de props nunca reinicia el campo y el loop
siempre lee las opciones más recientes. El runner se encarga de:

- medir y re-medir con `ResizeObserver`;
- mantener el loop de `requestAnimationFrame` con tope de FPS;
- pausar con la pestaña oculta (`visibilitychange`) o fuera de pantalla (`IntersectionObserver`);
- respetar `prefers-reduced-motion`, también si cambia en vivo;
- seguir el tema: `class`, `style` o `data-theme` de `<html>` y `prefers-color-scheme`;
- esperar a las webfonts antes de rasterizar texto;
- re-escanear las formas al hacer scroll y cada segundo con `shapeScope="document"`;
- elegir el sprite de cada ciclo sin repetir el anterior;
- en `loader`: umbral de aparición, handoff, fade y `onFinished`.

```ts
import {
  buildTextMask,
  createField,
  createPaintBuffers,
  fieldGeometryFor,
  flickerCells,
  levelStyles,
  markShapes,
  paintField,
  FIELD_DEFAULTS,
  type FieldPhase,
  type FieldRect,
  type GridField,
  type PaintBuffers,
  type Rgb,
} from './grid-field'
import { rasteriseFrame, type SpriteArea } from './sprite-raster'
import { DEFAULT_SPRITES, randomSpriteIndex, type Sprite } from './sprites'
import { ambientPhase, AMBIENT_DEFAULTS, loaderPhase, type AmbientTimeline } from './timeline'

/** Marca un elemento como forma sobre la que se condensa la grilla. */
export const SHAPE_ATTRIBUTE = 'data-grid-shape'

export interface GridFieldOptions {
  mode: 'ambient' | 'loader'
  /** Pool de sprites. Constante de módulo: se compara por identidad. `[]` = sin sprites. */
  sprites: readonly Sprite[]
  /** Color de los cuadros. null → lee `--grid-field-rgb` del CSS (ej. `255 255 255`). */
  rgb: Rgb | null
  /** Fuente de los sprites de texto. null → la del `<body>`. */
  fontFamily: string | null
  /** Tope de cuadros por segundo. El parpadeo se ve igual a 30 que a 60. */
  fps: number
  maxOpacity: number
  /** Fracción de celdas re-sorteadas por segundo. */
  chance: number
  /** Presupuesto de celdas: un viewport más grande engrosa la grilla. */
  maxCells: number
  maxDpr: number
  spriteArea: SpriteArea
  /** Dónde buscar `[data-grid-shape]`: dentro del propio fondo, en todo el documento, o en ningún lado. */
  shapeScope: 'local' | 'document' | 'none'
  timeline: AmbientTimeline
  /** Solo loader: el campo terminó de desvanecerse. */
  onFinished?: () => void
  /** Solo loader: la espera superó el umbral y empezó a dibujarse. */
  onVisible?: () => void
}

export const GRID_FIELD_DEFAULTS: GridFieldOptions = {
  mode: 'ambient',
  sprites: DEFAULT_SPRITES,
  rgb: null,
  fontFamily: null,
  fps: 30,
  maxOpacity: FIELD_DEFAULTS.maxOpacity,
  chance: FIELD_DEFAULTS.chance,
  maxCells: 90_000,
  maxDpr: 2,
  spriteArea: { x: 0, y: 0, w: 1, h: 1 },
  shapeScope: 'local',
  timeline: AMBIENT_DEFAULTS,
}

export type GridFieldInput = Partial<Omit<GridFieldOptions, 'timeline'>> & {
  timeline?: Partial<AmbientTimeline>
}

/** Mezcla con los defaults ignorando `undefined` (un spread normal los pisaría). */
export function resolveOptions(input: GridFieldInput): GridFieldOptions {
  const defined = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<GridFieldOptions>
  return {
    ...GRID_FIELD_DEFAULTS,
    ...defined,
    timeline: { ...AMBIENT_DEFAULTS, ...input.timeline },
  }
}

export interface GridFieldRunner {
  update(options: GridFieldOptions): void
  /** Solo loader: el contenido llegó; desvanecer y luego `onFinished`. */
  handoff(): void
  destroy(): void
}

const FALLBACK_RGB: Rgb = [255, 255, 255]

/**
 * Todo el estado vive aquí, fuera de React: un cambio de props nunca reinicia el
 * campo, y el loop lee siempre las opciones más recientes.
 */
export function createGridFieldRunner(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  initial: GridFieldOptions,
): GridFieldRunner {
  const ctx = canvas.getContext('2d')
  const scratch = document.createElement('canvas')
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const schemeQuery = window.matchMedia('(prefers-color-scheme: dark)')

  let options = initial
  let field: GridField | null = null
  let buffers: PaintBuffers | null = null
  let dpr = 1
  let styles = levelStyles(readRgb())

  // Solo se cachean los cuadros del sprite ACTUAL: cachear todos los sprites de
  // un fondo que corre horas puede llegar a cientos de MB (una máscara = 4 bytes × celdas).
  const masks = new Map<number, Float32Array>()
  let spriteIndex = -1
  let spriteCycle = -1
  let appliedFrame = -1

  let hasShapes = false
  let shapesDirty = true
  let lastShapeScan = 0

  const opened = performance.now()
  let handingAt: number | null = null
  let drew = false
  let finished = false

  let raf = 0
  let running = false
  let lastTick = 0
  let pageVisible = document.visibilityState !== 'hidden'
  let onScreen = true
  let reduced = motionQuery.matches
  // Una webfont que aún no cargó se rasterizaría con la fuente de respaldo, y esa
  // máscara quedaría cacheada: no se rasteriza texto hasta que las fuentes estén.
  let fontsReady = !('fonts' in document)

  function readRgb(): Rgb {
    if (options.rgb) return options.rgb
    const raw = getComputedStyle(canvas).getPropertyValue('--grid-field-rgb').trim()
    const [r = NaN, g = NaN, b = NaN] = raw.split(/[\s,]+/).map(Number)
    return [r, g, b].every(Number.isFinite) ? [r, g, b] : FALLBACK_RGB
  }

  function resetMasks(): void {
    masks.clear()
    appliedFrame = -1
    if (field) field.text = null
  }

  function measure(): void {
    const box = host.getBoundingClientRect()
    if (box.width < 1 || box.height < 1) {
      field = null
      buffers = null
      return
    }
    dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr)
    canvas.width = Math.floor(box.width * dpr)
    canvas.height = Math.floor(box.height * dpr)
    field = createField({
      width: box.width,
      height: box.height,
      ...fieldGeometryFor(box.width, box.height, options.maxCells),
      maxOpacity: options.maxOpacity,
    })
    buffers = createPaintBuffers(field)
    resetMasks()
    shapesDirty = true
    paintStill()
  }

  function scanShapes(): void {
    shapesDirty = false
    if (!field) return
    if (options.shapeScope === 'none') {
      field.shapes.fill(0)
      hasShapes = false
      return
    }
    const root: ParentNode = options.shapeScope === 'document' ? document : host
    const origin = host.getBoundingClientRect()
    const rects: FieldRect[] = []
    for (const node of root.querySelectorAll(`[${SHAPE_ATTRIBUTE}]`)) {
      const r = node.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      if (r.right < origin.left || r.left > origin.right) continue
      if (r.bottom < origin.top || r.top > origin.bottom) continue
      rects.push({ x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height })
    }
    markShapes(field, rects)
    hasShapes = rects.length > 0
  }

  function currentSprite(): Sprite | null {
    return options.sprites[spriteIndex] ?? null
  }

  function clockOf(sprite: Sprite | null) {
    return { frameCount: sprite?.frames.length ?? 0, frameMs: sprite?.frameMs ?? 0 }
  }

  function chooseSprite(): void {
    spriteIndex = randomSpriteIndex(options.sprites.length, spriteIndex)
    resetMasks()
  }

  function applyFrame(frameIndex: number): void {
    if (!field || frameIndex === appliedFrame) return
    const sprite = currentSprite()
    const frame = frameIndex >= 0 ? sprite?.frames[frameIndex] : undefined
    if (!sprite || frame === undefined) {
      field.text = null
      appliedFrame = -1
      return
    }
    if (typeof frame === 'string' && !fontsReady) return
    appliedFrame = frameIndex
    const cached = masks.get(frameIndex)
    if (cached) {
      field.text = cached
      return
    }
    const family = options.fontFamily ?? getComputedStyle(document.body).fontFamily
    const source = rasteriseFrame(scratch, field, frame, sprite, options.spriteArea, family)
    if (!source) return
    buildTextMask(field, source)
    if (field.text) masks.set(frameIndex, field.text)
  }

  function ambientFrame(elapsed: number): FieldPhase {
    let phase = ambientPhase(elapsed, clockOf(currentSprite()), options.timeline, hasShapes)
    if (phase.cycle >= 0 && phase.cycle !== spriteCycle) {
      spriteCycle = phase.cycle
      chooseSprite()
      phase = ambientPhase(elapsed, clockOf(currentSprite()), options.timeline, hasShapes)
    }
    applyFrame(phase.frameIndex)
    return phase
  }

  function loaderFrame(now: number, elapsed: number): FieldPhase | null {
    if (spriteIndex < 0 && options.sprites.length > 0) chooseSprite()
    const phase = loaderPhase(elapsed, handingAt === null ? null : now - handingAt, clockOf(currentSprite()))
    // La espera terminó antes de dibujar nada: salir SIN fade, o la carga
    // instantánea sería justo la que destella. Con movimiento reducido, tampoco.
    if (handingAt !== null && (!drew || reduced)) {
      finish()
      return null
    }
    if (phase.visible && !drew) {
      drew = true
      options.onVisible?.()
    }
    if (phase.done) {
      finish()
      return null
    }
    applyFrame(phase.frameIndex)
    if (!reduced) return phase
    return { ...phase, condense: 1, textAlpha: phase.textAlpha > 0 ? 1 : 0 }
  }

  function tick(now: number): void {
    raf = requestAnimationFrame(tick)
    if (now - lastTick < 1000 / options.fps - 2) return
    const dt = Math.min((now - lastTick) / 1000, 0.1)
    lastTick = now
    if (!field || !buffers || !ctx) return

    if (shapesDirty || (options.shapeScope === 'document' && now - lastShapeScan > 1000)) {
      scanShapes()
      lastShapeScan = now
    }

    const elapsed = now - opened
    const phase = options.mode === 'loader' ? loaderFrame(now, elapsed) : ambientFrame(elapsed)
    if (!phase) return
    if (!reduced) flickerCells(field, { dt, chance: options.chance, condense: phase.condense })
    paintField(ctx, field, phase, buffers, styles, dpr)
  }

  /** Movimiento reducido en ambient: un único cuadro quieto, sin loop. */
  function paintStill(): void {
    if (finished || running || options.mode !== 'ambient' || !reduced) return
    if (!field || !buffers || !ctx) return
    scanShapes()
    const condense = hasShapes ? options.timeline.restCondense : 0
    paintField(ctx, field, { presence: 1, condense, textAlpha: 0 }, buffers, styles, dpr)
  }

  function shouldRun(): boolean {
    if (finished || !pageVisible || !onScreen) return false
    return !(reduced && options.mode === 'ambient')
  }

  function sync(): void {
    const want = shouldRun()
    if (want && !running) {
      running = true
      lastTick = 0
      raf = requestAnimationFrame(tick)
    } else if (!want && running) {
      running = false
      cancelAnimationFrame(raf)
    }
    paintStill()
  }

  function finish(): void {
    if (finished) return
    finished = true
    running = false
    cancelAnimationFrame(raf)
    ctx?.setTransform(1, 0, 0, 1, 0, 0)
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    options.onFinished?.()
  }

  // ─── Suscripciones ─────────────────────────────────────────────────────────
  const resizeObserver = new ResizeObserver(() => measure())
  resizeObserver.observe(host)

  const intersection = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true
    sync()
  })
  intersection.observe(host)

  const onVisibility = () => {
    pageVisible = document.visibilityState !== 'hidden'
    sync()
  }
  document.addEventListener('visibilitychange', onVisibility)

  const onMotion = () => {
    reduced = motionQuery.matches
    sync()
  }
  motionQuery.addEventListener('change', onMotion)

  let stillQueued = false
  const onScroll = () => {
    if (options.shapeScope !== 'document') return
    shapesDirty = true
    if (running || stillQueued) return
    stillQueued = true
    requestAnimationFrame(() => {
      stillQueued = false
      paintStill()
    })
  }
  window.addEventListener('scroll', onScroll, { passive: true, capture: true })

  // Tema: `class`/`data-theme` en <html> (next-themes) o el esquema del sistema.
  const onTheme = () => {
    styles = levelStyles(readRgb())
    paintStill()
  }
  const themeObserver = new MutationObserver(onTheme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  })
  schemeQuery.addEventListener('change', onTheme)

  const onFonts = () => {
    fontsReady = true
    resetMasks()
  }
  if ('fonts' in document) {
    void document.fonts.ready.then(onFonts)
    document.fonts.addEventListener('loadingdone', onFonts)
  }

  measure()
  sync()

  return {
    update(next) {
      const prev = options
      options = next
      if (next.sprites !== prev.sprites) {
        spriteIndex = -1
        spriteCycle = -1
        resetMasks()
      }
      if (!sameArea(next.spriteArea, prev.spriteArea) || next.fontFamily !== prev.fontFamily) {
        resetMasks()
      }
      if (!sameRgb(next.rgb, prev.rgb)) styles = levelStyles(readRgb())
      if (
        next.maxCells !== prev.maxCells ||
        next.maxDpr !== prev.maxDpr ||
        next.maxOpacity !== prev.maxOpacity
      ) {
        measure()
      }
      if (next.shapeScope !== prev.shapeScope) shapesDirty = true
      sync()
    },
    handoff() {
      if (handingAt !== null) return
      handingAt = performance.now()
      // Con el loop en pausa (pestaña oculta) nadie vería el fade: terminar ya.
      if (!running) finish()
    },
    destroy() {
      finished = true
      running = false
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      intersection.disconnect()
      themeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotion)
      schemeQuery.removeEventListener('change', onTheme)
      window.removeEventListener('scroll', onScroll, { capture: true })
      if ('fonts' in document) document.fonts.removeEventListener('loadingdone', onFonts)
    },
  }
}

function sameArea(a: SpriteArea, b: SpriteArea): boolean {
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h
}

function sameRgb(a: Rgb | null, b: Rgb | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}
```

### 5.7 `grid-field-background.tsx`: el fondo

```tsx
'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import {
  createGridFieldRunner,
  resolveOptions,
  type GridFieldInput,
  type GridFieldRunner,
} from './runner'

export interface GridFieldBackgroundProps extends Omit<GridFieldInput, 'mode' | 'onFinished' | 'onVisible'> {
  /** `fixed` cubre el viewport; `absolute` cubre el ancestro posicionado más cercano. */
  position?: 'fixed' | 'absolute'
  /** Intensidad global (opacity CSS del canvas: no cuesta nada). */
  opacity?: number
  className?: string
  style?: CSSProperties
  /** Silueta invisible: elementos con `data-grid-shape` sobre los que se condensa la grilla. */
  children?: ReactNode
}

export function GridFieldBackground({
  position = 'fixed',
  opacity = 1,
  className,
  style,
  children,
  ...input
}: GridFieldBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runnerRef = useRef<GridFieldRunner | null>(null)
  const options = resolveOptions({ ...input, mode: 'ambient' })
  const latest = useRef(options)

  // Declarado ANTES que el de montaje: en el primer commit corre primero y deja
  // `latest` listo para que el runner nazca con las opciones correctas.
  useEffect(() => {
    latest.current = options
    runnerRef.current?.update(options)
  })

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const runner = createGridFieldRunner(host, canvas, latest.current)
    runnerRef.current = runner
    return () => {
      runner.destroy()
      runnerRef.current = null
    }
  }, [])

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={className}
      style={{
        position,
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        contain: 'strict',
        opacity,
        ...style,
      }}
    >
      {children ? (
        <div style={{ position: 'absolute', inset: 0, visibility: 'hidden' }}>{children}</div>
      ) : null}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
    </div>
  )
}
```

### 5.8 `grid-field-loader.tsx`: el loader

```tsx
'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  createGridFieldRunner,
  resolveOptions,
  type GridFieldInput,
  type GridFieldRunner,
} from './runner'

export interface GridFieldLoaderProps
  extends Omit<GridFieldInput, 'mode' | 'onFinished' | 'onVisible' | 'timeline'> {
  /** true mientras se espera. Al pasar a false, el campo se desvanece sobre el contenido. */
  active: boolean
  /** Lo que oye un lector de pantalla (el canvas no le dice nada). */
  label?: string
  className?: string
  style?: CSSProperties
  /** Silueta de la vista que viene, con `data-grid-shape`. */
  children?: ReactNode
}

interface Wait {
  id: number
  handing: boolean
}

/**
 * Se monta ENCIMA del contenido (absolute) y no en su lugar: un fallback de
 * Suspense se desmonta en cuanto llega el contenido, y así nunca podría
 * desvanecerse sobre él.
 */
export function GridFieldLoader({ active, ...rest }: GridFieldLoaderProps) {
  // Derivado durante el render, no en un efecto: un efecto pintaría un cuadro
  // del estado anterior. `seen` arranca en false para que un `active` inicial cuente.
  const [seen, setSeen] = useState(false)
  const [opened, setOpened] = useState(0)
  const [wait, setWait] = useState<Wait | null>(null)
  if (active !== seen) {
    setSeen(active)
    if (active) {
      setOpened(opened + 1)
      setWait({ id: opened + 1, handing: false })
    } else {
      setWait((current) => (current ? { ...current, handing: true } : null))
    }
  }

  if (!wait) return null
  const id = wait.id
  return (
    // Keyed por espera: una navegación nueva durante el fade de la anterior
    // necesita un campo nuevo, no uno con el reloj ya gastado.
    <LoaderField
      key={id}
      handing={wait.handing}
      onFinished={() => setWait((current) => (current?.id === id ? null : current))}
      {...rest}
    />
  )
}

function LoaderField({
  handing,
  onFinished,
  label = 'Cargando',
  className,
  style,
  children,
  ...input
}: Omit<GridFieldLoaderProps, 'active'> & { handing: boolean; onFinished: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runnerRef = useRef<GridFieldRunner | null>(null)
  const [announced, setAnnounced] = useState(false)
  const options = resolveOptions({
    ...input,
    mode: 'loader',
    onFinished,
    onVisible: () => setAnnounced(true),
  })
  const latest = useRef(options)

  useEffect(() => {
    latest.current = options
    runnerRef.current?.update(options)
  })

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const runner = createGridFieldRunner(host, canvas, latest.current)
    runnerRef.current = runner
    return () => {
      runner.destroy()
      runnerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (handing) runnerRef.current?.handoff()
  }, [handing])

  return (
    <div
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, ...style }}
    >
      <div ref={hostRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit' }}>
        {children ? (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, visibility: 'hidden' }}>
            {children}
          </div>
        ) : null}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      </div>
      <p role="status" style={VISUALLY_HIDDEN}>
        {announced ? label : ''}
      </p>
    </div>
  )
}

const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}
```

### 5.9 `route-loading.tsx` y `route-claim.tsx`: loader entre rutas

Solo hacen falta si quieres el loader de pantalla completa al navegar (§7.2).

```tsx
'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { GridFieldLoader, type GridFieldLoaderProps } from './grid-field-loader'

/**
 * El campo vive en el LAYOUT, no en `loading.tsx`: Suspense desmonta el fallback
 * en el instante en que llega el contenido, así que un campo dibujado ahí nunca
 * podría desvanecerse sobre la pantalla que tapaba. El fallback solo RECLAMA una
 * espera, y que el reclamo desaparezca es lo que dispara el fade.
 */

/** Registra una espera y devuelve cómo soltarla. */
type Claim = () => () => void

const ClaimContext = createContext<Claim | null>(null)
const PendingContext = createContext(false)

export function RouteLoadingProvider({ children }: { children: ReactNode }) {
  // Contado, no booleano: un fallback anidado que se desmonta mientras otro se
  // monta devolvería el área por un cuadro y el loader parpadearía.
  const [claims, setClaims] = useState(0)
  const claim = useCallback<Claim>(() => {
    setClaims((n) => n + 1)
    return () => setClaims((n) => n - 1)
  }, [])
  return (
    <ClaimContext.Provider value={claim}>
      <PendingContext.Provider value={claims > 0}>{children}</PendingContext.Provider>
    </ClaimContext.Provider>
  )
}

/** Móntalo dentro del contenedor que debe cubrir (o con `style={{ position: 'fixed' }}`). */
export function RouteLoadingOverlay(props: Omit<GridFieldLoaderProps, 'active'>) {
  const pending = useContext(PendingContext)
  return <GridFieldLoader active={pending} {...props} />
}

/** Lo que renderiza cada `loading.tsx`. Su DESMONTAJE es lo que avisa la llegada. */
export function LoadingClaim() {
  const claim = useContext(ClaimContext)
  useEffect(() => claim?.(), [claim])
  return null
}
```

```tsx
'use client'

import { LoadingClaim } from './route-loading'

/** Lo que re-exporta cada `loading.tsx`: no pinta nada. */
export default function RouteClaim() {
  return <LoadingClaim />
}
```

---

## 6. Usarlo como fondo en Next.js

### 6.1 Un wrapper cliente (obligatorio con sprites propios)

Las funciones no pueden pasar de un Server Component a un Client Component. Si `layout.tsx` (que es
Server Component) le pasa `sprites` con dibujos, Next falla con *«Functions cannot be passed directly
to Client Components»*. Define el fondo del sitio en un módulo cliente:

```tsx
// components/site-background.tsx
'use client'

import { useSyncExternalStore } from 'react'
import { GridFieldBackground } from '@/components/grid-field/grid-field-background'
import { BREATHING_RING, PULSING_DOTS, coinFace, drawnFrames } from '@/components/grid-field/sprite-drawings'
import { WORD_MS, type Sprite } from '@/components/grid-field/sprites'

// Constante de MÓDULO: el runner compara el pool por identidad.
const SPRITES: readonly Sprite[] = [
  { frames: ['hola', 'hola.', 'hola..', 'hola...'], frameMs: WORD_MS },
  { frames: BREATHING_RING, frameMs: 70 },
  { frames: PULSING_DOTS, frameMs: 60 },
  { frames: drawnFrames(14, coinFace('$')), frameMs: 90 },
]

const WIDE = '(min-width: 768px)'

/** En móvil, el sprite en la mitad derecha queda diminuto: se baja a una franja inferior. */
function useWide(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = matchMedia(WIDE)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => matchMedia(WIDE).matches,
    () => true,
  )
}

export function SiteBackground() {
  const wide = useWide()
  return (
    <GridFieldBackground
      sprites={SPRITES}
      shapeScope="document"
      spriteArea={wide ? { x: 0.5, y: 0.1, w: 0.5, h: 0.8 } : { x: 0, y: 0.55, w: 1, h: 0.4 }}
      timeline={{ spriteEveryMs: 15_000 }}
    />
  )
}
```

`spriteArea` se compara por valor, así que un objeto inline no vacía la caché en cada render.

### 6.2 `layout.tsx` y el orden de apilado

```tsx
// app/layout.tsx  (Server Component)
import { SiteBackground } from '@/components/site-background'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SiteBackground />
        <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        {/* con Tailwind: <div className="relative z-10">{children}</div> */}
      </body>
    </html>
  )
}
```

Por qué así:

- **El fondo** es `position: fixed; inset: 0; z-index: 0; pointer-events: none`, y **el contenido**
  `position: relative; z-index: 1`. El fondo de `<body>` queda debajo de ambos.
- **No uses `z-index: -1`.** Si `<html>` y `<body>` tienen fondo propio, el del body se pinta encima
  de un hijo con z-index negativo y la grilla desaparece.
- **Un fondo opaco tapa la grilla.** Es intencional. Si quieres que se vea a través de una tarjeta,
  usa fondos semitransparentes (`bg-black/60`, `backdrop-blur`).

### 6.3 Color y tema

```css
/* app/globals.css */
:root { --grid-field-rgb: 20 20 20; }              /* tema claro: cuadros oscuros */
.dark { --grid-field-rgb: 255 255 255; }           /* next-themes con attribute="class" */

@media (prefers-color-scheme: dark) {
  :root:not(.light) { --grid-field-rgb: 255 255 255; }
}
```

- **Formato:** tres números separados por espacios o comas. No acepta hex ni `hsl()`.
- **Cambios de tema:** el runner vuelve a leer la variable cuando cambian `class`, `style` o
  `data-theme` de `<html>`, y cuando cambia el esquema del sistema.
- **Color fijo:** `rgb={[0, 200, 255]}` ignora el CSS.
- **Tema claro:** en las pruebas se usó `maxOpacity={0.3}`; ajústalo a gusto.
- **Intensidad global:** `opacity` (es la opacidad CSS del canvas y no cuesta nada).

### 6.4 Formas: el halo detrás del contenido

**`shapeScope="document"`.** Marca elementos reales:

```tsx
<h1 data-grid-shape className="inline-block">Un fondo vivo</h1>
<p data-grid-shape className="inline-block">La grilla se condensa detrás del contenido real.</p>
<button data-grid-shape>Empezar</button>
```

- Marca elementos del **ancho de su contenido** (`inline-block`, `w-fit`). Un `<h1>` en bloque ocupa
  todo el ancho y se enciende como una franja.
- Las formas se re-miden al hacer scroll (en fase de captura, así que también sirven scrollers
  internos) y cada segundo, por si el layout cambia sin scroll (imágenes que cargan).

**`shapeScope="local"`** (por defecto). Una silueta propia como `children`, invisible pero medida:

```tsx
<GridFieldBackground>
  <div style={{ position: 'absolute', right: '8%', top: '30%', display: 'grid', gap: 16 }}>
    <span data-grid-shape style={{ display: 'block', width: 280, height: 28 }} />
    <span data-grid-shape style={{ display: 'block', width: 200, height: 14 }} />
    <span data-grid-shape style={{ display: 'block', width: 240, height: 14 }} />
  </div>
</GridFieldBackground>
```

**`shapeScope="none"`** desactiva las formas. Sin formas no hay condensación: solo apagaría el fondo.

**`timeline.restCondense`** controla cuánto destacan las formas en reposo. Con `0.45` (por defecto) el
halo es sutil; desde `0.8` el ruido fuera de las formas casi se apaga.

### 6.5 Solo en una sección

```tsx
<section style={{ position: 'relative', minHeight: 600, overflow: 'hidden' }}>
  <GridFieldBackground position="absolute" />
  <div style={{ position: 'relative', zIndex: 1 }}>…</div>
</section>
```

Se pausa solo cuando la sección sale de pantalla. Cada instancia tiene su propio loop: prefiere una por
área visible y no decenas.

---

## 7. Usarlo como loader

### 7.1 Loader controlado

```tsx
'use client'

import { GridFieldLoader } from '@/components/grid-field/grid-field-loader'

export function Orders({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', minHeight: 400, borderRadius: 16 }}>
      {children}
      <GridFieldLoader active={loading} label="Cargando pedidos">
        {/* silueta opcional de lo que viene */}
        <div style={{ padding: 24 }}>
          <span data-grid-shape style={{ display: 'block', width: 220, height: 28 }} />
          <span data-grid-shape style={{ display: 'block', width: 160, height: 14, marginTop: 22 }} />
          <span data-grid-shape style={{ display: 'block', width: 200, height: 14, marginTop: 22 }} />
        </div>
      </GridFieldLoader>
    </div>
  )
}
```

- Con `active={true}`, el loader empieza a dibujar a los 180 ms.
- Con `active={false}`, se desvanece en 200 ms **encima** del contenido (que ya debe estar montado
  debajo) y luego se desmonta.
- Si vuelve a activarse durante el fade, monta un campo nuevo.
- Para pantalla completa, pasa `style={{ position: 'fixed' }}`.
- `label` se anuncia por `role="status"` solo una vez que el loader es visible.
- El `border-radius` del contenedor se respeta (`borderRadius: 'inherit'`).

### 7.2 Loader de pantalla completa entre rutas (`loading.tsx`)

Es el patrón del dashboard.

**1. Provider y overlay** en el layout que envuelve las rutas:

```tsx
// app/(site)/layout.tsx
import { RouteLoadingOverlay, RouteLoadingProvider } from '@/components/grid-field/route-loading'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteLoadingProvider>
      {children}
      <RouteLoadingOverlay label="Abriendo la página" style={{ position: 'fixed' }} />
    </RouteLoadingProvider>
  )
}
```

Si quieres que el header quede visible y usable, como en el dashboard, monta el overlay sin `fixed`
dentro del contenedor del contenido (que debe tener `position: relative`).

**2. Cada `loading.tsx`** es una línea:

```tsx
// app/(site)/loading.tsx, app/(site)/blog/loading.tsx, …
export { default } from '@/components/grid-field/route-claim'
```

**3. La regla que hace que funcione:** debe haber un `loading.tsx` en **cada carpeta cuyos hijos son
rutas**. App Router reutiliza los segmentos que comparten el origen y el destino, y solo suspende por
debajo del más profundo en común. Para navegar de `/blog/a` a `/blog/b` hace falta
`app/(site)/blog/loading.tsx` (o uno en `[slug]/`); el de la raíz no se dispara. Sin ese archivo nada
falla: la pantalla simplemente abre sin loader, con la anterior todavía encima. En el dashboard un
test de commit lo vigila (`.githooks/gates/console-loading-boundaries.test.ts`); vale la pena copiarlo
si el sitio tiene muchas rutas.

**4. Por qué el fallback no pinta nada:** Suspense desmonta el fallback en el instante en que llega el
contenido, así que un campo dibujado ahí no podría desvanecerse sobre la pantalla nueva. El fallback
solo *reclama* la espera, y su desmontaje dispara el fade del campo que vive en el layout.

**Mejora opcional:** el dashboard empieza el loader **al hacer clic** y no cuando Next monta el
fallback. Para eso lee `useLinkStatus()` (Next ≥ 15.3) dentro de cada link de navegación y le pasa
el destino al provider. Referencia: `apps/console/src/components/layout/navigation-progress.tsx` en
zxen-v2.

---

## 8. Referencia de props

### `<GridFieldBackground />`

| Prop | Tipo | Default | Efecto |
|---|---|---|---|
| `position` | `'fixed' \| 'absolute'` | `'fixed'` | Cubre el viewport o el ancestro posicionado |
| `opacity` | `number` | `1` | Intensidad global (opacidad CSS) |
| `sprites` | `readonly Sprite[]` | `DEFAULT_SPRITES` | Pool de sprites; `[]` desactiva los sprites. **Constante de módulo** |
| `rgb` | `[r, g, b] \| null` | `null` | Color de los cuadros; `null` lee `--grid-field-rgb` (y si no existe, blanco) |
| `fontFamily` | `string \| null` | `null` | Fuente de los sprites de texto; `null` usa la del `<body>` |
| `fps` | `number` | `30` | Tope de cuadros por segundo |
| `maxOpacity` | `number` | `0.22` | Luz máxima de una celda de ruido |
| `chance` | `number` | `0.45` | Fracción de celdas re-sorteadas por segundo |
| `maxCells` | `number` | `90000` | Presupuesto de celdas; por encima la grilla se engrosa |
| `maxDpr` | `number` | `2` | Tope del devicePixelRatio del canvas |
| `spriteArea` | `{ x, y, w, h }` (0–1) | `{0, 0, 1, 1}` | Región donde se dibuja el sprite |
| `shapeScope` | `'local' \| 'document' \| 'none'` | `'local'` | Dónde buscar `[data-grid-shape]` |
| `timeline` | `Partial<AmbientTimeline>` | ver abajo | Ritmo del loop; se mezcla con los defaults |
| `children` | `ReactNode` | — | Silueta invisible (con `shapeScope="local"`) |
| `className`, `style` | — | — | Sobre el contenedor; `style` puede pisar `position`, `zIndex`, etc. |

### `timeline` (solo `ambient`)

| Campo | Default | Efecto |
|---|---|---|
| `introMs` | `1200` | Fade-in del campo al montar |
| `firstSpriteMs` | `1500` | Espera antes del primer sprite |
| `spriteEveryMs` | `12000` | Período entre sprites (0 = sin sprites) |
| `spriteMs` | `3000` | Duración de cada sprite (debe ser menor que `spriteEveryMs`) |
| `fadeMs` | `260` | Fade de entrada y salida del sprite |
| `restCondense` | `0.45` | Cuánto destacan las formas en reposo |
| `condenseTauMs` | `900` | Velocidad con que emergen las formas al inicio |

### `<GridFieldLoader />`

Acepta las mismas props que el fondo, salvo `position`, `opacity` y `timeline` (su ritmo es fijo,
como el del original). Además:

| Prop | Tipo | Default | Efecto |
|---|---|---|---|
| `active` | `boolean` | — | `true` mientras se espera; al pasar a `false`, fade y desmontaje |
| `label` | `string` | `'Cargando'` | Texto para lectores de pantalla |

`RouteLoadingOverlay` acepta las mismas props que `GridFieldLoader` salvo `active`, que toma del
provider.

---

## 9. Crear sprites propios

Estas reglas se midieron en el original; no son de estilo.

- **Texto.** Hasta unos 22 caracteres. Las letras sólidas y los bloques se leen; los detalles finos
  (`ʕ•ᴥ•ʔ`) se vuelven papilla y un emoji cae como una mancha, porque el campo solo lee cobertura y
  no color.
- **Cuadros de distinto largo** están bien: el tamaño se fija con el más ancho.
- **`frameMs`.** 500 ms para palabras (alcanza para leer 2 o 3), entre 60 y 90 ms para dibujos. Por
  debajo de ~16 ms la pantalla se salta cuadros.
- **Dibujos:**
  - en blanco: solo cuenta el alfa y el color lo pone el campo;
  - todo dentro del `width × height` recibido, porque lo que queda fuera se pierde;
  - trazos de al menos dos celdas (~12 px);
  - medidas relativas a `Math.min(width, height)`;
  - para recortar un símbolo dentro de una forma, `globalCompositeOperation = 'destination-out'`
    (como hace `coinFace`).
- **`drawnFrames(count, paint)`** llama a `paint` con `turn` en `[0, 1)`. El intervalo es abierto a
  propósito: si incluyera el 1, el loop sostendría la misma imagen dos cuadros y tartamudearía.

Ejemplo:

```ts
import { drawnFrames } from '@/components/grid-field/sprite-drawings'
import { WORD_MS, type Sprite } from '@/components/grid-field/sprites'

const SPINNING_SQUARE = drawnFrames(24, (ctx, box, turn) => {
  const unit = Math.min(box.width, box.height)
  ctx.save()
  ctx.translate(box.width / 2, box.height / 2)
  ctx.rotate((turn * Math.PI) / 2) // un cuarto de vuelta: el cuadrado es simétrico y el loop cierra
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = unit * 0.06
  ctx.strokeRect(-unit * 0.25, -unit * 0.25, unit * 0.5, unit * 0.5)
  ctx.restore()
})

export const MY_SPRITES: readonly Sprite[] = [
  { frames: ['tu marca', 'tu marca.', 'tu marca..'], frameMs: WORD_MS },
  { frames: SPINNING_SQUARE, frameMs: 60 },
]
```

---

## 10. Rendimiento, accesibilidad y SSR

### Rendimiento

| Mecanismo | Detalle |
|---|---|
| Tope de FPS | 30 por defecto; el parpadeo se ve igual que a 60 y cuesta la mitad |
| Pausas | Pestaña oculta (`visibilitychange`) y fuera de pantalla (`IntersectionObserver`) |
| Cero asignaciones por cuadro | Counting sort sobre buffers reservados al medir |
| 24 `fillStyle` por cuadro | En vez de uno por celda |
| `maxCells` / `maxDpr` | Acotan el trabajo en pantallas 4K y móviles con DPR 3 |
| Memoria de máscaras | 4 bytes × celdas por cuadro: con 32.400 celdas son ~130 KB, y un dibujo de 30 cuadros ~3,9 MB. Se libera al cambiar de sprite |
| Rasterizado | `getImageData` solo la primera vez que suena cada cuadro del sprite actual |

Medido en Chromium headless a 1440×810 (32.400 celdas): el intervalo de rAF quedó estable, con p50 y
p95 ≈ 13,4 ms (el intervalo nativo del navegador de prueba) y sin picos. **No se midió en móviles de
gama baja.** Si hiciera falta, usa `fps={20}`, `maxCells={40_000}` o `maxDpr={1.5}`.

### Accesibilidad

- **Fondo:** `aria-hidden` y `pointer-events: none`. Es invisible para los lectores de pantalla y no
  intercepta clics.
- **Loader:** `role="status"` con `label`, que se anuncia solo cuando el loader se hace visible
  (pasados 180 ms).
- **`prefers-reduced-motion`:** el fondo queda como un cuadro quieto (halo sin parpadeo y sin
  sprites); el loader no parpadea y se va sin fade. Reacciona si la preferencia cambia en vivo.
- **Contraste:** en reposo el ruido es tenue (máximo 0,22 por celda), pero un sprite llega a 0,92.
  Pon `spriteArea` lejos del texto, como en el ejemplo: texto a la izquierda y sprite a la derecha.

### SSR e hidratación

- El servidor renderiza un `div` y un `canvas` vacíos, y todo ocurre en `useEffect`. No hay
  desajustes de hidratación ni hace falta `dynamic(..., { ssr: false })`.
- En desarrollo, StrictMode monta, desmonta y vuelve a montar: el runner se destruye y se recrea
  limpio (se verificó en StrictMode).

---

## 11. Tests

```ts
import { describe, expect, it } from 'vitest'
import {
  cellOpacity,
  createField,
  createPaintBuffers,
  fieldGeometryFor,
  fieldStep,
  levelStyles,
  markShapes,
  paintField,
  type FieldCanvas,
} from './grid-field'
import { ambientPhase, AMBIENT_DEFAULTS, loaderPhase } from './timeline'
import { randomSpriteIndex } from './sprites'

function fakeCanvas() {
  const calls = { fillRect: 0, styles: new Set<string>(), styleSets: 0 }
  let style = ''
  const ctx: FieldCanvas = {
    setTransform: () => {},
    clearRect: () => {},
    fillRect: () => {
      calls.fillRect++
    },
    get fillStyle() {
      return style
    },
    set fillStyle(value) {
      style = String(value)
      calls.styleSets++
      calls.styles.add(style)
    },
  }
  return { ctx, calls }
}

const clock = { frameCount: 4, frameMs: 500 }

describe('ambientPhase', () => {
  it('nunca muestra sprite y estructura a la vez', () => {
    for (let t = 0; t < 40_000; t += 37) {
      const phase = ambientPhase(t, clock, AMBIENT_DEFAULTS, true)
      if (phase.textAlpha >= 0.999) expect(phase.condense).toBe(0)
    }
  })

  it('suena un sprite por ciclo y calla entre ciclos', () => {
    const t = AMBIENT_DEFAULTS
    const mid = t.firstSpriteMs + t.spriteMs / 2
    expect(ambientPhase(mid, clock, t, false).textAlpha).toBe(1)
    expect(ambientPhase(mid + t.spriteEveryMs, clock, t, false).cycle).toBe(1)
    expect(ambientPhase(t.firstSpriteMs + t.spriteMs + 1000, clock, t, false).frameIndex).toBe(-1)
  })

  it('sin formas no condensa (condensar sin formas solo apagaría el fondo)', () => {
    expect(ambientPhase(9000, clock, AMBIENT_DEFAULTS, false).condense).toBe(0)
  })
})

describe('loaderPhase', () => {
  it('no se ve bajo el umbral y termina tras el handoff', () => {
    expect(loaderPhase(100, null, clock).visible).toBe(false)
    expect(loaderPhase(1000, 250, clock).done).toBe(true)
  })
})

describe('randomSpriteIndex', () => {
  it('nunca repite el anterior y alcanza todos', () => {
    const seen = new Set<number>()
    let last = -1
    for (let i = 0; i < 2000; i++) {
      const next = randomSpriteIndex(5, last)
      expect(next).not.toBe(last)
      seen.add(next)
      last = next
    }
    expect(seen.size).toBe(5)
    expect(randomSpriteIndex(0, -1)).toBe(-1)
  })
})

describe('paintField', () => {
  it('pinta una vez por celda visible y cambia fillStyle como mucho 24 veces', () => {
    const field = createField({ width: 600, height: 300, square: 2, gap: 4, maxOpacity: 0.22 })
    const phase = { presence: 1, condense: 0.4, textAlpha: 0 }
    markShapes(field, [{ x: 50, y: 50, w: 200, h: 30 }])
    const visible = Array.from(field.cells.keys()).filter((i) => cellOpacity(field, i, phase) >= 0.02).length
    const { ctx, calls } = fakeCanvas()
    paintField(ctx, field, phase, createPaintBuffers(field), levelStyles([255, 255, 255]), 1)
    expect(calls.fillRect).toBe(visible)
    expect(calls.styleSets).toBeLessThanOrEqual(24)
  })

  it('las formas destacan sobre el ruido al condensar', () => {
    const field = createField({ width: 120, height: 60, square: 2, gap: 4, maxOpacity: 0.22 })
    field.cells.fill(0.1)
    markShapes(field, [{ x: 0, y: 0, w: 30, h: 30 }])
    const phase = { presence: 1, condense: 1, textAlpha: 0 }
    expect(cellOpacity(field, 0, phase)).toBeGreaterThan(cellOpacity(field, field.cells.length - 1, phase) * 10)
  })
})

describe('fieldGeometryFor', () => {
  it('respeta el presupuesto de celdas en pantallas grandes', () => {
    const g = fieldGeometryFor(3840, 2160, 90_000)
    const cells = Math.ceil(3840 / fieldStep(g)) * Math.ceil(2160 / fieldStep(g))
    expect(cells).toBeLessThanOrEqual(90_000 * 1.05)
    expect(fieldGeometryFor(390, 844, 90_000)).toEqual({ square: 1, gap: 2 })
  })
})
```

Se ejecutan con `npx vitest run components/grid-field`. El entorno `node` por defecto alcanza.

---

## 12. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| No se ve nada | El contenido no tiene `position: relative; z-index: 1`, o un fondo opaco tapa la grilla | §6.2 |
| No se ve nada (2) | `--grid-field-rgb` del mismo color que el fondo, o escrita en hex | Tres números: `255 255 255` |
| Con `position="absolute"` no aparece | El padre no tiene posición ni altura | `position: relative` y una altura |
| *Functions cannot be passed directly to Client Components* | Sprites con dibujos pasados desde un Server Component | Wrapper cliente (§6.1) |
| El sprite sale con otra fuente | La fuente del body no es la que quieres | Prop `fontFamily` (las webfonts se esperan solas) |
| El sprite se reinicia o cambia a cada rato | Array de sprites creado dentro del render | Constante de módulo |
| El halo es una franja ancha | Se marcó un elemento en bloque a todo el ancho | `inline-block` o `w-fit` |
| El loader no aparece al navegar | Falta `loading.tsx` en la carpeta adecuada, o la navegación tardó menos de 180 ms | §7.2 punto 3 |
| El loader tapa el header | Overlay `fixed` con `zIndex: 10` | Montarlo sin `fixed` dentro del contenedor del contenido |
| Va lento en móviles modestos | Demasiadas celdas | `fps={20}`, `maxCells={40_000}`, `maxDpr={1.5}` |

---

## 13. Verificación realizada

Antes de escribir esta guía, el código de la §5 se puso a prueba en un proyecto aislado:

- **TypeScript 5 en modo estricto** (`strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`): sin
  errores, incluidos los snippets de las §6, §7.1 y §9.
- **Tests de la §11:** 8/8 en verde con vitest 4.
- **Chromium headless (React 19, StrictMode):**
  - fondo con sprite de texto, con sprite dibujado y halo detrás de títulos y botones reales;
  - tema claro y móvil (390×844 con DPR 3);
  - loader condensando sobre su silueta oculta y desmontándose tras el fade;
  - flujo `Suspense` → `LoadingClaim`: el campo sigue encima mientras el contenido llega y desaparece
    200 ms después;
  - `prefers-reduced-motion`: dos capturas seguidas idénticas, es decir, un cuadro quieto;
  - cero errores en consola.
- **No probado:** Safari, Firefox, ni un build real de Next.js. Las APIs que usa son baseline y no hay
  nada específico de un bundler.

---

## 14. Extensión opcional: brillo que sigue al puntero

> No forma parte del código verificado. Es un parche pequeño por si quieres interacción.

En `grid-field.ts`, agrega el puntero a la fase y multiplícalo en `cellOpacity`:

```ts
export interface FieldPointer {
  x: number
  y: number
  radius: number
  strength: number
}

// En FieldPhase:  pointer?: FieldPointer | null

function pointerBoost(field: GridField, index: number, pointer: FieldPointer | null | undefined): number {
  if (!pointer) return 1
  const step = fieldStep(field)
  const col = (index / field.rows) | 0
  const dx = col * step - pointer.x
  const dy = (index - col * field.rows) * step - pointer.y
  const d2 = dx * dx + dy * dy
  const r2 = pointer.radius * pointer.radius
  return d2 >= r2 ? 1 : 1 + pointer.strength * (1 - d2 / r2)
}

// En cellOpacity, multiplica ambos `return` por pointerBoost(field, index, phase.pointer)
```

En `runner.ts`, escucha el puntero en `window` (el fondo tiene `pointer-events: none`) y pásalo al
pintar:

```ts
let pointer: FieldPointer | null = null
const onPointer = (event: PointerEvent) => {
  const origin = host.getBoundingClientRect()
  pointer = { x: event.clientX - origin.left, y: event.clientY - origin.top, radius: 160, strength: 2.5 }
}
window.addEventListener('pointermove', onPointer, { passive: true })
// en tick():    paintField(ctx, field, { ...phase, pointer }, buffers, styles, dpr)
// en destroy(): window.removeEventListener('pointermove', onPointer)
```

Desactívalo con `prefers-reduced-motion` y en dispositivos táctiles (`matchMedia('(pointer: fine)')`).

---

## Anexo: correspondencia con el original

| Original (`apps/console/src/components/loading/`) | Esta adaptación |
|---|---|
| `grid-field.ts` | `grid-field.ts`: color parametrizable, pintado sin asignaciones, presupuesto de celdas |
| `loading-phases.ts` | `timeline.ts`: `loaderPhase` equivalente más el nuevo `ambientPhase` |
| `loading-sprites.ts` | `sprites.ts`: pool neutral y `randomSpriteIndex(total, exclude)` |
| `sprite-drawings.ts` | `sprite-drawings.ts`: sin el tipo `DrawTarget`; moneda con símbolo parametrizable |
| `sprite-raster.ts` | `sprite-raster.ts`: canvas reutilizado y `spriteArea` |
| `loading-field.tsx` | `runner.ts` (motor imperativo) más `grid-field-background.tsx` y `grid-field-loader.tsx` |
| `loading-archetypes.tsx` | `children` con `data-grid-shape`, o `shapeScope="document"` |
| `loading-layer.tsx` + `route-claim.tsx` | `route-loading.tsx` + `route-claim.tsx` |
| `loading-copy.ts` | La prop `label` |
| `components/layout/navigation-progress.tsx` | No incluido; ver la mejora opcional de la §7.2 |