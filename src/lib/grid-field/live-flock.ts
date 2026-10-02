/**
 * Enjambre libre: una bandada (boids, Reynolds 1987) que vaga por la caja, se
 * abre, se junta y rodea el texto; de vez en cuando algo la sobresalta y se
 * parte. Cada ave deja una estela corta, la SUYA: el puntero no deja nada; la
 * bandada lo rodea (curiosa) o le hace lugar (tímida). Sin DOM.
 *
 * Unidades: celdas de media resolución por cuadro (el runner va a 30 fps).
 */

import type { SpriteMask } from './grid-field'
import {
  createPresence,
  followPointer,
  half,
  halfRects,
  writeHalfRes,
  type CellRect,
  type CursorMode,
  type LiveContext,
  type LiveSource,
} from './live'

export interface FlockOptions {
  cursor: () => CursorMode
  random?: () => number
}

/** Aves por celda de media resolución. */
const DENSITY = 0.06
const MIN_BIRDS = 150
const MAX_BIRDS = 900
/** Radio de vecindad y distancia personal. */
const SIGHT = 5
const SPACE = 1.6
const MAX_SPEED = 0.85
const MIN_SPEED = 0.4
/** Pesos de las reglas: alinearse, juntarse, separarse, vagar y seguir el rumbo común. */
const ALIGN = 0.08
const COHERE = 0.004
const SEPARATE = 0.06
const WANDER = 0.05
const ROAM = 0.012
/** Bordes e islas: a qué distancia empiezan a empujar y cuánto. */
const EDGE = 6
const EDGE_PUSH = 0.06
const ISLAND_MARGIN = 1
const ISLAND_REACH = 5
const ISLAND_PUSH = 0.18
/** Curiosa: orbita al puntero a esta distancia (fracción del lado mayor). */
const ORBIT = 0.07
const CURIOUS = 0.05
/** Tímida: le hace lugar en este radio. */
const SHY_RADIUS = 0.14
const SHY = 0.35
/** Sobresaltos: cada cuánto (s), su radio y cuánto empujan. */
const STARTLE_MIN_S = 7
const STARTLE_MAX_S = 13
const STARTLE_RADIUS = 12
const STARTLE_S = 0.7
const STARTLE = 0.5
/** Estela: cuánto queda de un cuadro al siguiente, y su umbral a la máscara. */
const TRAIL_DECAY = 0.8
const TRAIL_LOW = 0.12
const TRAIL_HIGH = 0.9
const GAIN = 0.85
const STILL_STEPS = 120

export function createFlock(options: FlockOptions): LiveSource {
  const random = options.random ?? Math.random

  let cols = 0
  let rows = 0
  let mask: SpriteMask | null = null
  let birds = new Float32Array(0)
  let count = 0
  let trail = new Float32Array(0)
  // Vecindad por cubetas de lado SIGHT: cada ave mira solo las 3 × 3 de alrededor.
  let head = new Int32Array(0)
  let next = new Int32Array(0)
  let bucketCols = 0
  let bucketRows = 0

  const rects: CellRect[] = []
  let islandsSeen = -1
  let settledIslands = -1
  let settledMask: SpriteMask | null = null

  let time = 0
  let nextStartle = 0
  let startleAt = -1
  let startleX = 0
  let startleY = 0
  const presence = createPresence()

  function inIsland(x: number, y: number): boolean {
    for (const rect of rects) {
      if (x >= rect.col && x < rect.col + rect.cols && y >= rect.row && y < rect.row + rect.rows)
        return true
    }
    return false
  }

  function spawn(i: number): void {
    let x = 0
    let y = 0
    for (let attempt = 0; attempt < 32; attempt++) {
      x = EDGE + random() * Math.max(1, cols - EDGE * 2)
      y = EDGE + random() * Math.max(1, rows - EDGE * 2)
      if (!inIsland(x, y)) break
    }
    const angle = random() * Math.PI * 2
    const speed = MIN_SPEED + random() * (MAX_SPEED - MIN_SPEED)
    birds[i * 4] = x
    birds[i * 4 + 1] = y
    birds[i * 4 + 2] = Math.cos(angle) * speed
    birds[i * 4 + 3] = Math.sin(angle) * speed
  }

  function ensure(boxCols: number, boxRows: number, context: LiveContext): void {
    if (!mask || mask.cols !== boxCols || mask.rows !== boxRows) {
      cols = half(boxCols)
      rows = half(boxRows)
      mask = { data: new Float32Array(boxCols * boxRows), cols: boxCols, rows: boxRows }
      trail = new Float32Array(cols * rows)
      count = Math.round(Math.min(MAX_BIRDS, Math.max(MIN_BIRDS, cols * rows * DENSITY)))
      birds = new Float32Array(count * 4)
      next = new Int32Array(count)
      bucketCols = Math.ceil(cols / SIGHT)
      bucketRows = Math.ceil(rows / SIGHT)
      head = new Int32Array(bucketCols * bucketRows)
      islandsSeen = -1
      settledMask = null
    }
    if (islandsSeen !== context.islandsVersion) {
      const first = islandsSeen < 0
      islandsSeen = context.islandsVersion
      halfRects(context.islands, ISLAND_MARGIN, rects)
      for (let i = 0; i < count; i++) {
        if (first || inIsland(birds[i * 4] ?? 0, birds[i * 4 + 1] ?? 0)) spawn(i)
      }
      if (first) nextStartle = time + STARTLE_MIN_S
    }
  }

  function bucketOf(x: number, y: number): number {
    const bx = Math.min(bucketCols - 1, Math.max(0, (x / SIGHT) | 0))
    const by = Math.min(bucketRows - 1, Math.max(0, (y / SIGHT) | 0))
    return bx * bucketRows + by
  }

  function step(dt: number, mode: CursorMode): void {
    time += dt
    if (time >= nextStartle && count > 0) {
      const victim = (random() * count) | 0
      startleX = birds[victim * 4] ?? 0
      startleY = birds[victim * 4 + 1] ?? 0
      startleAt = time
      nextStartle = time + STARTLE_MIN_S + random() * (STARTLE_MAX_S - STARTLE_MIN_S)
    }
    const startling = startleAt >= 0 && time - startleAt < STARTLE_S
    // El rumbo común: un punto que recorre la caja despacio (Lissajous).
    const roamX = cols * (0.5 + 0.36 * Math.sin(time * 0.11))
    const roamY = rows * (0.42 + 0.3 * Math.sin(time * 0.17 + 1.3))
    const level = presence.level
    const px = presence.x
    const py = presence.y
    const side = Math.max(cols, rows)
    const orbit = ORBIT * side
    const shy = SHY_RADIUS * side

    head.fill(-1)
    for (let i = 0; i < count; i++) {
      const b = bucketOf(birds[i * 4] ?? 0, birds[i * 4 + 1] ?? 0)
      next[i] = head[b] ?? -1
      head[b] = i
    }

    for (let i = 0; i < count; i++) {
      const k = i * 4
      const x = birds[k] ?? 0
      const y = birds[k + 1] ?? 0
      let vx = birds[k + 2] ?? 0
      let vy = birds[k + 3] ?? 0
      let ax = 0
      let ay = 0

      // Vecinos: alinearse, juntarse y no chocar.
      let n = 0
      let avx = 0
      let avy = 0
      let cx = 0
      let cy = 0
      let sx = 0
      let sy = 0
      const bx = Math.min(bucketCols - 1, Math.max(0, (x / SIGHT) | 0))
      const by = Math.min(bucketRows - 1, Math.max(0, (y / SIGHT) | 0))
      for (let gx = Math.max(0, bx - 1); gx <= Math.min(bucketCols - 1, bx + 1); gx++) {
        for (let gy = Math.max(0, by - 1); gy <= Math.min(bucketRows - 1, by + 1); gy++) {
          let j = head[gx * bucketRows + gy] ?? -1
          while (j >= 0) {
            if (j !== i) {
              const dx = (birds[j * 4] ?? 0) - x
              const dy = (birds[j * 4 + 1] ?? 0) - y
              const d2 = dx * dx + dy * dy
              if (d2 < SIGHT * SIGHT) {
                n++
                avx += birds[j * 4 + 2] ?? 0
                avy += birds[j * 4 + 3] ?? 0
                cx += dx
                cy += dy
                if (d2 < SPACE * SPACE) {
                  sx -= dx / (d2 + 0.05)
                  sy -= dy / (d2 + 0.05)
                }
              }
            }
            j = next[j] ?? -1
          }
        }
      }
      if (n > 0) {
        ax += (avx / n - vx) * ALIGN + (cx / n) * COHERE + sx * SEPARATE
        ay += (avy / n - vy) * ALIGN + (cy / n) * COHERE + sy * SEPARATE
      }

      ax += (random() - 0.5) * WANDER
      ay += (random() - 0.5) * WANDER
      const rx = roamX - x
      const ry = roamY - y
      const rd = Math.sqrt(rx * rx + ry * ry) + 1e-6
      ax += (rx / rd) * ROAM
      ay += (ry / rd) * ROAM

      // El puntero: rodearlo a distancia, o hacerle lugar.
      if (level > 0.01 && mode !== 'off') {
        const dx = px - x
        const dy = py - y
        const d = Math.sqrt(dx * dx + dy * dy) + 1e-6
        if (mode === 'attract') {
          const pull = d > orbit ? 1 : -0.6
          ax += ((dx / d) * pull - (dy / d) * 0.8) * CURIOUS * level
          ay += ((dy / d) * pull + (dx / d) * 0.8) * CURIOUS * level
        } else if (d < shy) {
          const push = SHY * (1 - d / shy) * level
          ax -= (dx / d) * push
          ay -= (dy / d) * push
        }
      }

      if (startling) {
        const dx = x - startleX
        const dy = y - startleY
        const d2 = dx * dx + dy * dy
        if (d2 < STARTLE_RADIUS * STARTLE_RADIUS) {
          const d = Math.sqrt(d2) + 1e-6
          ax += (dx / d) * STARTLE * (1 - d / STARTLE_RADIUS)
          ay += (dy / d) * STARTLE * (1 - d / STARTLE_RADIUS)
        }
      }

      // Islas: el punto más cercano del rect empuja hacia afuera.
      for (const rect of rects) {
        const qx = Math.min(rect.col + rect.cols, Math.max(rect.col, x))
        const qy = Math.min(rect.row + rect.rows, Math.max(rect.row, y))
        const dx = x - qx
        const dy = y - qy
        const d2 = dx * dx + dy * dy
        if (d2 >= ISLAND_REACH * ISLAND_REACH) continue
        if (d2 < 1e-6) {
          // Adentro (recién medidas las islas): sale por el lado más cercano.
          const left = x - rect.col
          const right = rect.col + rect.cols - x
          const top = y - rect.row
          const bottom = rect.row + rect.rows - y
          const least = Math.min(left, right, top, bottom)
          if (least === left) ax -= 1
          else if (least === right) ax += 1
          else if (least === top) ay -= 1
          else ay += 1
          continue
        }
        const d = Math.sqrt(d2)
        const push = ISLAND_PUSH * (1 - d / ISLAND_REACH)
        ax += (dx / d) * push
        ay += (dy / d) * push
      }

      if (x < EDGE) ax += EDGE_PUSH * (1 - x / EDGE)
      if (x > cols - EDGE) ax -= EDGE_PUSH * (1 - (cols - x) / EDGE)
      if (y < EDGE) ay += EDGE_PUSH * (1 - y / EDGE)
      if (y > rows - EDGE) ay -= EDGE_PUSH * (1 - (rows - y) / EDGE)

      vx += ax
      vy += ay
      const speed = Math.sqrt(vx * vx + vy * vy) + 1e-6
      const clamped = Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed))
      birds[k + 2] = (vx / speed) * clamped
      birds[k + 3] = (vy / speed) * clamped
    }

    for (let i = 0; i < trail.length; i++) trail[i] = (trail[i] ?? 0) * TRAIL_DECAY
    for (let i = 0; i < count; i++) {
      const k = i * 4
      const x = Math.min(cols - 0.001, Math.max(0, (birds[k] ?? 0) + (birds[k + 2] ?? 0)))
      const y = Math.min(rows - 0.001, Math.max(0, (birds[k + 1] ?? 0) + (birds[k + 3] ?? 0)))
      birds[k] = x
      birds[k + 1] = y
      trail[(x | 0) * rows + (y | 0)] = 1
    }
  }

  return {
    frame(boxCols, boxRows, context) {
      ensure(boxCols, boxRows, context)
      const mode = options.cursor()
      followPointer(presence, context, mode !== 'off')
      step(context.dt, mode)
      if (mask) writeHalfRes(trail, rows, mask, TRAIL_LOW, TRAIL_HIGH, GAIN)
      return mask
    },

    still(boxCols, boxRows, context) {
      ensure(boxCols, boxRows, context)
      if (settledMask === mask && settledIslands === islandsSeen) return mask
      for (let i = 0; i < STILL_STEPS; i++) step(1 / 30, 'off')
      if (mask) writeHalfRes(trail, rows, mask, TRAIL_LOW, TRAIL_HIGH, GAIN)
      settledMask = mask
      settledIslands = islandsSeen
      return mask
    },
  }
}
