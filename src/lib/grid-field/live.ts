/**
 * Escenarios VIVOS: en vez de cuadros rasterizados y cacheados, una simulación
 * que escribe su máscara en cada cuadro. El runner le pasa lo que pasa afuera
 * (puntero e islas); los patrones (moho, enjambre, corrientes) comparten lo de
 * este archivo.
 *
 * Todos viven a MEDIA resolución de la caja (una celda por 2×2 del campo): cuesta
 * la cuarta parte y deja trazos de al menos dos celdas, el piso para que se lean.
 */

import type { SpriteMask } from './grid-field'

/** Un rect en celdas enteras, relativo a la caja del escenario. */
export interface CellRect {
  col: number
  row: number
  cols: number
  rows: number
}

/** Lo que el runner le cuenta a un escenario vivo. Es UN objeto, reusado en cada cuadro. */
export interface LiveContext {
  /** Segundos desde el cuadro anterior. */
  dt: number
  /** Puntero en celdas de la caja; NaN si no hay (o si es táctil y se levantó). */
  pointerCol: number
  pointerRow: number
  /** Islas: el contenido HTML dentro de la caja, donde la grilla no debe imprimir. */
  islands: readonly CellRect[]
  /** Sube cada vez que las islas cambian. */
  islandsVersion: number
}

export interface LiveSource {
  /** Avanza un cuadro y devuelve la máscara de la caja (`cols × rows`). */
  frame(cols: number, rows: number, context: LiveContext): SpriteMask | null
  /** Movimiento reducido: un cuadro ya asentado, sin animar. */
  still(cols: number, rows: number, context: LiveContext): SpriteMask | null
}

/** Qué hace el patrón con el puntero. Cada uno lo interpreta (atraer, estimular…). */
export type CursorMode = 'attract' | 'repel' | 'off'

/** Media resolución de un lado de la caja. */
export function half(cells: number): number {
  return Math.ceil(cells / 2)
}

/** Las islas (celdas de la caja) a media resolución, con margen. Reusa `out`. */
export function halfRects(
  islands: readonly CellRect[],
  margin: number,
  out: CellRect[] = [],
): CellRect[] {
  out.length = 0
  for (const island of islands) {
    const col = Math.floor(island.col / 2) - margin
    const row = Math.floor(island.row / 2) - margin
    out.push({
      col,
      row,
      cols: Math.ceil((island.col + island.cols) / 2) + margin - col,
      rows: Math.ceil((island.row + island.rows) / 2) + margin - row,
    })
  }
  return out
}

/** Marca los rects en una grilla column-major (`x * rows + y`). */
export function fillRects(
  grid: Uint8Array,
  cols: number,
  rows: number,
  rects: readonly CellRect[],
  value = 1,
): void {
  for (const rect of rects) {
    const x0 = Math.max(0, rect.col)
    const x1 = Math.min(cols, rect.col + rect.cols)
    const y0 = Math.max(0, rect.row)
    const y1 = Math.min(rows, rect.row + rect.rows)
    if (y1 <= y0) continue
    for (let x = x0; x < x1; x++) grid.fill(value, x * rows + y0, x * rows + y1)
  }
}

/**
 * Vuelca un buffer de media resolución a la máscara de la caja (2×2 por celda)
 * con un umbral suave entre `low` y `high`: lo tenue queda en 0 (se confundiría
 * con el ruido y lo atenuaría) y lo intenso sube hasta `gain`.
 */
export function writeHalfRes(
  source: Float32Array,
  sourceRows: number,
  mask: SpriteMask,
  low: number,
  high: number,
  gain: number,
): void {
  const data = mask.data
  const span = Math.max(1e-6, high - low)
  for (let c = 0; c < mask.cols; c++) {
    const base = (c >> 1) * sourceRows
    const out = c * mask.rows
    for (let r = 0; r < mask.rows; r++) {
      const t = ((source[base + (r >> 1)] ?? 0) - low) / span
      data[out + r] = t <= 0 ? 0 : t >= 1 ? gain : t * t * (3 - 2 * t) * gain
    }
  }
}

/** Como `writeHalfRes`, pero copia el valor tal cual (recortado a `gain`), sin umbral. */
export function writeHalfDirect(
  source: Float32Array,
  sourceRows: number,
  mask: SpriteMask,
  gain: number,
): void {
  const data = mask.data
  for (let c = 0; c < mask.cols; c++) {
    const base = (c >> 1) * sourceRows
    const out = c * mask.rows
    for (let r = 0; r < mask.rows; r++) data[out + r] = Math.min(gain, source[base + (r >> 1)] ?? 0)
  }
}

/** El puntero, suavizado, en celdas de MEDIA resolución. `level` es cuánto está (0–1). */
export interface Presence {
  x: number
  y: number
  level: number
}

export function createPresence(): Presence {
  return { x: 0, y: 0, level: 0 }
}

const FOLLOW_S = 0.12
const FADE_S = 0.35

/**
 * Sigue al puntero sin saltos y entra o sale suave: un patrón que reacciona de
 * golpe a la llegada del puntero se lee como un error, no como atención.
 */
export function followPointer(presence: Presence, context: LiveContext, active: boolean): void {
  const here = active && Number.isFinite(context.pointerCol)
  const dt = context.dt
  if (here) {
    const x = context.pointerCol / 2
    const y = context.pointerRow / 2
    if (presence.level <= 0.01) {
      presence.x = x
      presence.y = y
    } else {
      const k = 1 - Math.exp(-dt / FOLLOW_S)
      presence.x += (x - presence.x) * k
      presence.y += (y - presence.y) * k
    }
  }
  presence.level += ((here ? 1 : 0) - presence.level) * (1 - Math.exp(-dt / FADE_S))
}
