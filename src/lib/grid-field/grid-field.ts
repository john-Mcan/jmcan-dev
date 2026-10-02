/**
 * Motor puro del campo: sin DOM. Una sola grilla sobre todo el viewport y todas
 * las celdas con el mismo reloj: eso es lo que hace que se lea como UNA
 * superficie y no como N cajas parpadeando desfasadas.
 *
 * Base: docs/grid-field.md §5.1. Cambios respecto de la guía:
 *  - la máscara del sprite es LOCAL a su caja y se ubica con un desplazamiento,
 *    así un sprite anclado a un elemento sigue el scroll sin re-rasterizarse;
 *  - las formas pueden ser de «señal» y pintan con una segunda paleta (ámbar);
 *  - las formas entran y salen suavizadas, no de golpe;
 *  - las formas solo SUMAN luz: el resto del campo no se atenúa (nada de velo);
 *  - ganancia por fila (barrido de escaneo).
 */

export type Rgb = readonly [number, number, number]

export interface FieldRect {
  x: number
  y: number
  w: number
  h: number
}

export interface ShapeRect extends FieldRect {
  accent: boolean
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
  /** Objetivo por celda: 0 nada, 1 forma, 2 forma de señal. */
  shapes: Uint8Array
  /** Nivel suavizado de forma (0–1): sigue a `shapes` en ~120 ms. */
  shapeLevel: Float32Array
  /** 1 si la celda pinta con la paleta de señal; se recuerda mientras la forma se apaga. */
  accent: Uint8Array
}

/** Cobertura de un cuadro del sprite, en celdas de SU caja (column-major local). */
export interface SpriteMask {
  data: Float32Array
  cols: number
  rows: number
}

export interface SpritePlacement {
  mask: SpriteMask
  /** Celda del campo donde cae la esquina superior izquierda de la máscara. */
  col0: number
  row0: number
  accent: boolean
}

export interface FieldPhase {
  /** 0 → ruido uniforme, 1 → las formas emergieron del todo. */
  condense: number
  /** 0 → sin sprite, 1 → sprite a plena intensidad. */
  textAlpha: number
  /** 1 → visible, 0 → invisible. */
  presence: number
}

export interface FrameInput {
  phase: FieldPhase
  sprite: SpritePlacement | null
  /** Ganancia por fila (barrido de escaneo); null = 1 en todas. */
  rowGain: Float32Array | null
  /** Segundos desde el cuadro anterior: suaviza las formas. 0 = salto inmediato. */
  dt: number
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

export interface Palettes {
  base: readonly string[]
  accent: readonly string[]
  /**
   * Ganancia de punto (0–1): cuánto crece un punto con su intensidad, como la
   * tinta que se corre al imprimir. 0 = punto fijo (luz emitida, tema oscuro).
   */
  spread: number
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

export function createField(
  geometry: FieldGeometry,
  random: () => number = Math.random,
): GridField {
  const step = fieldStep(geometry)
  const cols = Math.max(1, Math.ceil(geometry.width / step))
  const rows = Math.max(1, Math.ceil(geometry.height / step))
  const n = cols * rows
  const cells = new Float32Array(n)
  for (let i = 0; i < n; i++) cells[i] = random() * geometry.maxOpacity
  return {
    ...geometry,
    cols,
    rows,
    cells,
    shapes: new Uint8Array(n),
    shapeLevel: new Float32Array(n),
    accent: new Uint8Array(n),
  }
}

/**
 * Pásale los rects del CONTENIDO (un título, un botón), nunca del contenedor:
 * el rect de una tarjeta se enciende como un bloque y la estructura se pierde.
 */
export function markShapes(field: GridField, rects: readonly ShapeRect[]): void {
  field.shapes.fill(0)
  const step = fieldStep(field)
  const pad = 2
  for (const rect of rects) {
    if (rect.w < 1 || rect.h < 1) continue
    const value = rect.accent ? 2 : 1
    const i0 = Math.max(0, Math.floor((rect.x - pad) / step))
    const i1 = Math.min(field.cols - 1, Math.ceil((rect.x + rect.w + pad) / step))
    const j0 = Math.max(0, Math.floor((rect.y - pad) / step))
    const j1 = Math.min(field.rows - 1, Math.ceil((rect.y + rect.h + pad) / step))
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const index = i * field.rows + j
        if ((field.shapes[index] ?? 0) < value) field.shapes[index] = value
      }
    }
  }
}

/**
 * Cobertura por ÁREA, no un píxel por celda: muestrear un solo punto hace que un
 * trazo o se adueñe de la celda o desaparezca, y eso destroza los glifos.
 */
export function buildSpriteMask(
  source: AlphaSource,
  cols: number,
  rows: number,
  step: number,
): SpriteMask {
  const span = Math.max(1, Math.min(step, 4))
  const stride = Math.max(1, Math.floor(step / span))
  const data = new Float32Array(cols * rows)
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      data[i * rows + j] = sampleCoverage(source, i * step, j * step, span, stride)
    }
  }
  return { data, cols, rows }
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
 */
export function flickerCells(
  field: GridField,
  options: { dt: number; chance: number; condense: number },
  random: () => number = Math.random,
): void {
  const chance = options.chance * (1 - options.condense * 0.75)
  const len = field.cells.length
  let n = Math.min(len, Math.round(len * chance * options.dt))
  while (n-- > 0) {
    field.cells[(random() * len) | 0] = random() * field.maxOpacity
  }
}

/**
 * Luz de una celda antes de presencia y barrido. `level` es cuánto está dentro
 * de una forma (0–1, suavizado): la forma enciende sus celdas y deja el resto
 * como está; apagar el resto oscurecía toda la pantalla como un velo. El sprite
 * tiene un PISO propio y solo parpadea alrededor de él: derivarlo del valor de
 * la celda borra media palabra por cuadro.
 */
export function cellLight(
  cell: number,
  level: number,
  glyph: number,
  phase: FieldPhase,
  maxOpacity: number,
): number {
  const base = cell * (1 + 1.6 * phase.condense * level)
  const ta = phase.textAlpha
  if (glyph <= 0 || ta <= 0.01) return base
  return base * (1 - 0.55 * ta) + ta * glyph * (0.45 + (0.55 * cell) / maxOpacity)
}

const LEVELS = 24
const LEVEL_CEILING = 0.92
const MIN_VISIBLE = 0.02
const SKIP = 255
/**
 * Grupos de pintado: nivel × paleta (base, señal) × punto (campo, sprite). El
 * campo y el sprite de un mismo nivel van seguidos y comparten color.
 */
const BUCKETS = LEVELS * 2 * 2
/** Constante de tiempo con que las formas siguen a su objetivo. */
const SHAPE_TAU_S = 0.12
/** Desde cuánta cobertura una celda es del sprite: pinta con su paleta y su punto. */
const SPRITE_GLYPH = 0.15

/** Un `fillStyle` por nivel, nunca por celda: parsear el color es lo que cuesta el cuadro. */
export function levelStyles(rgb: Rgb): string[] {
  const [r, g, b] = rgb
  return Array.from(
    { length: LEVELS },
    (_, i) => `rgba(${r},${g},${b},${(((i + 1) / LEVELS) * LEVEL_CEILING).toFixed(3)})`,
  )
}

/**
 * Los puntos del campo crecen solo por encima de la luz máxima de un halo
 * (0,22 × 1,8): engorda el pico del barrido, no el ruido ni los halos.
 */
const SPREAD_FROM = 0.4
const SPREAD_TO = 0.5

/**
 * Lado de un punto. Sobre papel, un punto chico de tinta se pierde; uno de luz
 * sobre negro no. Con `spread` (tema claro):
 *  - el sprite crece PAREJO en todos sus niveles: la profundidad sigue en la
 *    opacidad, como en oscuro. Hacerlo crecer con el nivel engordaba los trazos
 *    fuertes y dejaba atrás los tenues (los anillos del radar se perdían);
 *  - el campo crece solo en el pico del barrido.
 * Se ajusta a píxeles del dispositivo para no difuminar los bordes.
 */
export function dotSize(
  geometry: Pick<FieldGeometry, 'square' | 'gap'>,
  spread: number,
  level: number,
  sprite: boolean,
  dpr: number,
): number {
  const { square } = geometry
  if (spread <= 0) return square
  let t = 1
  if (!sprite) {
    const opacity = ((level + 1) / LEVELS) * LEVEL_CEILING
    const x = Math.min(1, Math.max(0, (opacity - SPREAD_FROM) / (SPREAD_TO - SPREAD_FROM)))
    t = x * x * (3 - 2 * x)
  }
  return Math.round((square + spread * geometry.gap * t) * dpr) / dpr
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
    counts: new Int32Array(BUCKETS),
    starts: new Int32Array(BUCKETS),
    cursor: new Int32Array(BUCKETS),
  }
}

/**
 * Cuantiza cada celda a uno de 24 niveles por paleta y las pinta agrupadas
 * (counting sort): como mucho 48 cambios de `fillStyle` por cuadro. El tamaño del
 * punto sale del grupo, así que se calcula una vez por grupo y no por celda.
 */
export function paintField(
  ctx: FieldCanvas,
  field: GridField,
  frame: FrameInput,
  buffers: PaintBuffers,
  palettes: Palettes,
  dpr: number,
): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, field.width, field.height)
  const { phase, sprite, rowGain } = frame
  if (phase.presence <= 0) return

  const { levels, order, counts, starts, cursor } = buffers
  const { cols, rows, cells, shapes, shapeLevel, accent, maxOpacity } = field
  const step = fieldStep(field)
  const ease = frame.dt > 0 ? 1 - Math.exp(-frame.dt / SHAPE_TAU_S) : 1

  const mask = sprite && phase.textAlpha > 0.01 ? sprite.mask : null
  const mc0 = sprite?.col0 ?? 0
  const mr0 = sprite?.row0 ?? 0
  const spriteAccent = sprite?.accent ?? false

  counts.fill(0)
  for (let col = 0; col < cols; col++) {
    const lc = col - mc0
    const inMaskCol = mask !== null && lc >= 0 && lc < mask.cols
    for (let row = 0; row < rows; row++) {
      const i = col * rows + row

      const target = shapes[i] ?? 0
      let level = shapeLevel[i] ?? 0
      const goal = target > 0 ? 1 : 0
      if (level !== goal) {
        level += (goal - level) * ease
        if (Math.abs(goal - level) < 0.01) level = goal
        shapeLevel[i] = level
      }
      if (target === 2) accent[i] = 1
      else if (target === 1 || level === 0) accent[i] = 0

      let glyph = 0
      if (inMaskCol) {
        const lr = row - mr0
        if (lr >= 0 && lr < mask.rows) glyph = mask.data[lc * mask.rows + lr] ?? 0
      }

      const gain = rowGain ? (rowGain[row] ?? 1) : 1
      const opacity =
        cellLight(cells[i] ?? 0, level, glyph, phase, maxOpacity) * phase.presence * gain
      if (opacity < MIN_VISIBLE) {
        levels[i] = SKIP
        continue
      }
      const inSprite = glyph > SPRITE_GLYPH
      const useAccent = (accent[i] === 1 && level > 0.02) || (spriteAccent && inSprite)
      const tone = Math.min(LEVELS - 1, ((opacity / LEVEL_CEILING) * LEVELS) | 0)
      const bucket = ((useAccent ? LEVELS : 0) + tone) * 2 + (inSprite ? 1 : 0)
      levels[i] = bucket
      counts[bucket] = (counts[bucket] ?? 0) + 1
    }
  }

  let running = 0
  for (let bucket = 0; bucket < BUCKETS; bucket++) {
    starts[bucket] = running
    cursor[bucket] = running
    running += counts[bucket] ?? 0
  }
  const len = cells.length
  for (let i = 0; i < len; i++) {
    const bucket = levels[i] ?? SKIP
    if (bucket === SKIP) continue
    const at = cursor[bucket] ?? 0
    order[at] = i
    cursor[bucket] = at + 1
  }

  let style = ''
  for (let bucket = 0; bucket < BUCKETS; bucket++) {
    const count = counts[bucket] ?? 0
    if (count === 0) continue
    const tone = (bucket >> 1) % LEVELS
    const styles = bucket >> 1 < LEVELS ? palettes.base : palettes.accent
    const next = styles[tone] ?? ''
    if (next !== style) {
      ctx.fillStyle = next
      style = next
    }
    // El punto crece desde su centro: la grilla no se corre.
    const size = dotSize(field, palettes.spread, tone, (bucket & 1) === 1, dpr)
    const inset = Math.round(((size - field.square) / 2) * dpr) / dpr
    const start = starts[bucket] ?? 0
    for (let k = start; k < start + count; k++) {
      const index = order[k] ?? 0
      const col = (index / rows) | 0
      ctx.fillRect(col * step - inset, (index - col * rows) * step - inset, size, size)
    }
  }
}
