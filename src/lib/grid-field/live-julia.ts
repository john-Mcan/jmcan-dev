/**
 * Julia que respira: el conjunto de Julia de z² + c, con c meciéndose despacio
 * sobre el borde de la cardioide principal del conjunto de Mandelbrot (justo en
 * el borde, la Julia es una dendrita: filamentos que se ramifican). Se dibuja el
 * borde (el tiempo de escape suavizado), fino, con lo tenue aclarado; el
 * interior y lo lejano quedan oscuros. El puntero guía c (atrae: su posición elige
 * la forma) o lo invierte (aparta: lo lleva al lado opuesto); sin puntero, la
 * forma se queda en su lugar, respira y va cambiando de estructura. Sin DOM.
 *
 * Es la excepción a «nada detrás del texto»: la forma pasa por debajo de las
 * letras, atenuada (`UNDER_TEXT`), en vez de cortarse en un rectángulo.
 *
 * A resolución COMPLETA de la caja (los filamentos se pierden a media), en líneas
 * alternadas: cada cuadro recalcula la mitad de las filas.
 */

import type { SpriteMask } from './grid-field'
import {
  createPresence,
  fillRects,
  fineScale,
  followPointer,
  type CellRect,
  type CursorMode,
  type LiveContext,
  type LiveSource,
} from './live'

export interface JuliaOptions {
  cursor: () => CursorMode
  random?: () => number
}

/**
 * c sobre la cardioide: ángulo central y escala (1 = el borde). Sin puntero, c
 * recorre el borde con dos vaivenes, uno amplio (~37 s) y uno corto (~13 s), y la
 * forma cambia de estructura: erguida y con espirales hacia 1,85, tendida hacia
 * 2,45. Más allá de 2,6 se acuesta y se vuelve la «basílica», de bulbos gruesos.
 * La escala no pasa de ~1,006: más afuera del borde, en varios ángulos, el escape
 * se vuelve lento en zonas anchas y la forma se rellena de gris.
 */
const ANGLE = 2.15
const ANGLE_SWAY = 0.3
const ANGLE_SWAY_SPEED = 0.17
const ANGLE_RIPPLE = 0.07
const ANGLE_RIPPLE_SPEED = 0.47
const SCALE = 1
const SCALE_SWAY = 0.006
const SCALE_SWAY_SPEED = 0.2
const MAX_ITERATIONS = 40
const BAILOUT = 16
/** Largo de la forma en el plano complejo (de punta a punta, a lo largo de su eje). */
const SPAN = 3.4
/** Esta dendrita se inclina respecto del eje real: se compensa para que su espina siga la diagonal. */
const TILT = 0.44
/** En móvil: dónde va el eje (fracción del ancho) y cuánto desborda la forma, arriba y abajo (fracción del alto). */
const PORTRAIT_X = 0.62
const PORTRAIT_OVERFLOW = 0.1
/** Cuánto respira (zoom lento). */
const BREATH = 0.02
const BREATH_SPEED = 0.3
/** El puntero mueve el ángulo de c hasta ±STEER_TURN y su escala entre estas dos. */
const STEER_TURN = 0.6
const SCALE_MIN = 0.95
const SCALE_MAX = 1.02
const STEER_S = 0.6
/** Normalización del escape: piso y cuánto sigue al cuadro (ver `peak`). */
const MIN_PEAK = 6
const PEAK_FOLLOW = 0.2
/**
 * Luz: el escape (en escala log, 0–1) bajo EDGE es exterior lejano y queda oscuro;
 * de ahí al borde se reparte con GAMMA < 1, que aclara lo tenue sin engrosarlo.
 */
const EDGE = 0.5
const GAMMA = 0.75
const GAIN = 0.9
/** Debajo del texto la forma sigue, pero a esta fracción de su luz: el texto se lee. */
const UNDER_TEXT = 0.3
const ISLAND_MARGIN = 1

export function createJulia(options: JuliaOptions): LiveSource {
  let cols = 0
  let rows = 0
  /** Celdas del campo por cálculo, de lado (ver `fineScale`): los trazos miden lo mismo en móvil. */
  let block = 1
  let mask: SpriteMask | null = null
  let under = new Uint8Array(0)
  const rects: CellRect[] = []
  let islandsSeen = -1
  let settledIslands = -1
  let settledMask: SpriteMask | null = null

  let time = 0
  let parity = 0
  let cx = (Math.cos(ANGLE) / 2 - Math.cos(2 * ANGLE) / 4) * SCALE
  let cy = (Math.sin(ANGLE) / 2 - Math.sin(2 * ANGLE) / 4) * SCALE
  // El escape más lento del cuadro anterior es el brillo pleno: con c lejos del
  // borde todo escapa rápido y, contra MAX_ITERATIONS, casi nada se vería.
  let peak = MAX_ITERATIONS
  const presence = createPresence()

  function ensure(boxCols: number, boxRows: number, context: LiveContext): void {
    block = fineScale(context.cellPx)
    if (!mask || mask.cols !== boxCols || mask.rows !== boxRows) {
      cols = boxCols
      rows = boxRows
      mask = { data: new Float32Array(cols * rows), cols, rows }
      under = new Uint8Array(cols * rows)
      islandsSeen = -1
      settledMask = null
    }
    if (islandsSeen !== context.islandsVersion) {
      islandsSeen = context.islandsVersion
      under.fill(0)
      // Islas a resolución completa, con margen (en celdas del campo).
      rects.length = 0
      for (const island of context.islands) {
        rects.push({
          col: island.col - ISLAND_MARGIN,
          row: island.row - ISLAND_MARGIN,
          cols: island.cols + ISLAND_MARGIN * 2,
          rows: island.rows + ISLAND_MARGIN * 2,
        })
      }
      fillRects(under, cols, rows, rects)
    }
  }

  /** c: el vaivén, y hacia donde lo lleve el puntero mientras está. */
  function steer(dt: number, mode: CursorMode): void {
    time += dt
    let angle =
      ANGLE +
      ANGLE_SWAY * Math.sin(time * ANGLE_SWAY_SPEED) +
      ANGLE_RIPPLE * Math.sin(time * ANGLE_RIPPLE_SPEED + 1.3)
    let scale = SCALE + SCALE_SWAY * Math.cos(time * SCALE_SWAY_SPEED)
    const level = mode === 'off' ? 0 : presence.level
    if (level > 0.01) {
      const fx = presence.x / cols - 0.5
      const fy = presence.y / rows
      const sign = mode === 'attract' ? 1 : -1
      angle += sign * fx * 2 * STEER_TURN * level
      scale += (SCALE_MIN + (SCALE_MAX - SCALE_MIN) * fy - scale) * level
    }
    // La cardioide: c = e^{iθ}/2 − e^{2iθ}/4, escalada un poco hacia adentro.
    const tx = (Math.cos(angle) / 2 - Math.cos(2 * angle) / 4) * scale
    const ty = (Math.sin(angle) / 2 - Math.sin(2 * angle) / 4) * scale
    const k = dt > 0 ? 1 - Math.exp(-dt / STEER_S) : 1
    cx += (tx - cx) * k
    cy += (ty - cy) * k
  }

  function render(all: boolean): void {
    if (!mask) return
    const data = mask.data
    // Dónde vive la forma: en una caja apaisada, a lo largo de la diagonal que va
    // del centro abajo a la esquina de arriba a la derecha (el texto queda a la
    // izquierda); en una vertical (móvil), de arriba abajo y corrida a la derecha,
    // más larga que la caja: desborda arriba, abajo y por el costado.
    const landscape = cols >= rows
    const fromX = landscape ? cols * 0.51 : cols * PORTRAIT_X
    const fromY = landscape ? rows : rows * (1 + PORTRAIT_OVERFLOW)
    const toX = landscape ? cols * 0.92 : cols * PORTRAIT_X
    const toY = landscape ? 0 : -rows * PORTRAIT_OVERFLOW
    const centerX = (fromX + toX) / 2
    const centerY = (fromY + toY) / 2
    const axis = Math.atan2(toY - fromY, toX - fromX) + TILT
    const along = Math.cos(axis)
    const across = Math.sin(axis)
    const zoom = 1 + BREATH * Math.sin(time * BREATH_SPEED)
    const scale = (SPAN / Math.hypot(toX - fromX, toY - fromY)) * zoom
    const bail2 = BAILOUT * BAILOUT
    const ln2 = Math.log(2)
    // Escala logarítmica: el escape tiene una cola larga y, lineal, solo se vería una franja finísima.
    const norm = Math.log1p(Math.max(MIN_PEAK, peak))
    let slowest = 0
    for (let r = all ? 0 : parity * block; r < rows; r += block * (all ? 1 : 2)) {
      const dy = r - centerY
      for (let c = 0; c < cols; c += block) {
        const i = c * rows + r
        const dx = c - centerX
        // El eje real de la forma va a lo largo de la diagonal.
        let x = (dx * along + dy * across) * scale
        let y = (-dx * across + dy * along) * scale
        let n = 0
        let m2 = x * x + y * y
        while (n < MAX_ITERATIONS && m2 < bail2) {
          const t = x * x - y * y + cx
          y = 2 * x * y + cy
          x = t
          m2 = x * x + y * y
          n++
        }
        if (n >= MAX_ITERATIONS) {
          fill(data, c, r, block, 0)
          continue
        }
        // Escape suavizado: sin escalones entre una iteración y la siguiente.
        const smooth = n + 1 - Math.log(Math.log(m2) / 2 / ln2) / ln2
        if (smooth > slowest) slowest = smooth
        const t = Math.max(0, Math.min(1, Math.log1p(Math.max(0, smooth)) / norm))
        let value = t <= EDGE ? 0 : Math.pow((t - EDGE) / (1 - EDGE), GAMMA) * GAIN
        if (under[i] === 1) value *= UNDER_TEXT
        fill(data, c, r, block, value)
      }
    }
    parity ^= 1
    peak += (slowest - peak) * (all ? 1 : PEAK_FOLLOW)
  }

  function fill(data: Float32Array, c: number, r: number, block: number, value: number): void {
    for (let x = c; x < Math.min(cols, c + block); x++) {
      for (let y = r; y < Math.min(rows, r + block); y++) data[x * rows + y] = value
    }
  }

  return {
    frame(boxCols, boxRows, context) {
      ensure(boxCols, boxRows, context)
      const mode = options.cursor()
      followPointer(presence, context, mode !== 'off', 1)
      steer(context.dt, mode)
      render(false)
      return mask
    },

    still(boxCols, boxRows, context) {
      ensure(boxCols, boxRows, context)
      if (settledMask === mask && settledIslands === islandsSeen) return mask
      steer(0, 'off')
      render(true)
      render(true)
      settledMask = mask
      settledIslands = islandsSeen
      return mask
    },
  }
}
