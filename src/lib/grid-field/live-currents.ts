/**
 * Corrientes: partículas que derivan con un viento que cambia lento y dejan
 * líneas de corriente, como humo o algas. El viento RODEA el texto: la función de
 * corriente se resuelve con las islas como obstáculo (una vez por layout, no por
 * cuadro). El puntero, mientras está, es una roca (aparta) o un remolino (atrae);
 * al irse, la corriente se recompone. Sin DOM.
 *
 * Unidades: celdas de la simulación (ver `fineScale`) por cuadro (el runner va a 30 fps).
 */

import type { SpriteMask } from './grid-field'
import {
  createPresence,
  fillRects,
  fineScale,
  followPointer,
  scaled,
  scaledRects,
  writeScaled,
  type CellRect,
  type CursorMode,
  type LiveContext,
  type LiveSource,
} from './live'

export interface CurrentsOptions {
  cursor: () => CursorMode
  random?: () => number
}

/** Velocidad del viento libre. */
const WIND = 0.36
/** Partículas por celda. */
const DENSITY = 0.035
const MIN_PARTICLES = 250
const MAX_PARTICLES = 3200
/** Vida de una partícula, en cuadros. */
const LIFE_MIN = 150
const LIFE_MAX = 320
/** Las que renacen en el borde izquierdo (el resto, en cualquier lugar libre). */
const FROM_LEFT = 0.4
/** Relajación sucesiva (SOR) de la función de corriente: iteraciones y factor. */
const SOR_ITERATIONS = 240
const SOR_OMEGA = 1.85
const ISLAND_MARGIN = 2
/** El viento turbulento se apaga cerca del texto (en celdas) para no meterse. */
const CLEARANCE = 5
/** Turbulencia: ondas de una función de corriente (libre de divergencia). */
const WAVES = [
  { amplitude: 0.55, angle: 0.5, length: 34, speed: 0.22 },
  { amplitude: 0.4, angle: 1.9, length: 22, speed: -0.31 },
  { amplitude: 0.3, angle: 2.8, length: 15, speed: 0.4 },
].map((wave, i) => ({
  amplitude: wave.amplitude,
  kx: ((Math.PI * 2) / wave.length) * Math.cos(wave.angle),
  ky: ((Math.PI * 2) / wave.length) * Math.sin(wave.angle),
  speed: wave.speed,
  phase: i * 2.1,
}))
/** Roca: radio como fracción del lado mayor. Remolino: fuerza y núcleo. */
const STONE = 0.11
const VORTEX = 8
const VORTEX_CORE = 0.06
const MAX_STEP = 1.4
/** Estela: lo que deja cada paso, cuánto queda al siguiente cuadro y su umbral. */
const DEPOSIT = 0.5
const TRAIL_DECAY = 0.945
const TRAIL_LOW = 0.25
const TRAIL_HIGH = 0.9
const GAIN = 0.78
const STILL_STEPS = 160

export function createCurrents(options: CurrentsOptions): LiveSource {
  const random = options.random ?? Math.random

  let cols = 0
  let rows = 0
  let scale = 1
  let mask: SpriteMask | null = null
  let psi = new Float32Array(0)
  let fixed = new Uint8Array(0)
  let blocked = new Uint8Array(0)
  let windX = new Float32Array(0)
  let windY = new Float32Array(0)
  let clearance = new Uint8Array(0)
  let queue = new Int32Array(0)
  let trail = new Float32Array(0)
  let particles = new Float32Array(0)
  let count = 0

  const rects: CellRect[] = []
  let islandsSeen = -1
  let settledIslands = -1
  let settledMask: SpriteMask | null = null
  let time = 0
  const presence = createPresence()

  function ensure(boxCols: number, boxRows: number, context: LiveContext): void {
    const wanted = fineScale(context.cellPx)
    if (!mask || mask.cols !== boxCols || mask.rows !== boxRows || scale !== wanted) {
      scale = wanted
      cols = scaled(boxCols, scale)
      rows = scaled(boxRows, scale)
      const n = cols * rows
      mask = { data: new Float32Array(boxCols * boxRows), cols: boxCols, rows: boxRows }
      psi = new Float32Array(n)
      fixed = new Uint8Array(n)
      blocked = new Uint8Array(n)
      windX = new Float32Array(n)
      windY = new Float32Array(n)
      clearance = new Uint8Array(n)
      queue = new Int32Array(n)
      trail = new Float32Array(n)
      count = Math.round(Math.min(MAX_PARTICLES, Math.max(MIN_PARTICLES, n * DENSITY)))
      particles = new Float32Array(count * 4)
      islandsSeen = -1
      settledMask = null
    }
    if (islandsSeen !== context.islandsVersion) {
      islandsSeen = context.islandsVersion
      solve(scaledRects(context.islands, ISLAND_MARGIN, scale, rects))
      for (let i = 0; i < count; i++) spawn(i, false)
    }
  }

  /**
   * ψ = y es viento uniforme hacia la derecha (u = ∂ψ/∂y). Todo el texto es UN
   * obstáculo con ψ constante (la mitad de su altura): el viento lo rodea por
   * arriba y por abajo, y entre líneas de texto queda quieto en vez de colarse.
   */
  function solve(islands: readonly CellRect[]): void {
    blocked.fill(0)
    fillRects(blocked, cols, rows, islands)
    let top = Infinity
    let bottom = -Infinity
    for (const rect of islands) {
      top = Math.min(top, Math.max(0, rect.row))
      bottom = Math.max(bottom, Math.min(rows, rect.row + rect.rows))
    }
    const inside = (top + bottom) / 2
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const i = x * rows + y
        const edge = x === 0 || y === 0 || x === cols - 1 || y === rows - 1
        if (blocked[i] === 1) {
          psi[i] = inside
          fixed[i] = 1
        } else {
          psi[i] = y
          fixed[i] = edge ? 1 : 0
        }
      }
    }
    for (let iteration = 0; iteration < SOR_ITERATIONS; iteration++) {
      for (let x = 1; x < cols - 1; x++) {
        for (let y = 1; y < rows - 1; y++) {
          const i = x * rows + y
          if (fixed[i] === 1) continue
          const average =
            ((psi[i - 1] ?? 0) + (psi[i + 1] ?? 0) + (psi[i - rows] ?? 0) + (psi[i + rows] ?? 0)) /
            4
          psi[i] = (psi[i] ?? 0) + SOR_OMEGA * (average - (psi[i] ?? 0))
        }
      }
    }
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const i = x * rows + y
        if (blocked[i] === 1) {
          windX[i] = 0
          windY[i] = 0
          continue
        }
        const up = y > 0 ? i - 1 : i
        const down = y < rows - 1 ? i + 1 : i
        const left = x > 0 ? i - rows : i
        const right = x < cols - 1 ? i + rows : i
        windX[i] = (((psi[down] ?? 0) - (psi[up] ?? 0)) / Math.max(1, down - up)) * WIND
        windY[i] =
          (-((psi[right] ?? 0) - (psi[left] ?? 0)) / Math.max(1, (right - left) / rows)) * WIND
      }
    }
    // Distancia al texto (BFS en 4 vecinos), hasta CLEARANCE.
    clearance.fill(CLEARANCE)
    let head = 0
    let tail = 0
    for (let i = 0; i < blocked.length; i++) {
      if (blocked[i] === 1) {
        clearance[i] = 0
        queue[tail++] = i
      }
    }
    const visit = (j: number, d: number) => {
      if (j < 0 || j >= clearance.length || (clearance[j] ?? 0) <= d) return
      clearance[j] = d
      queue[tail++] = j
    }
    while (head < tail) {
      const i = queue[head++] ?? 0
      const d = (clearance[i] ?? 0) + 1
      if (d >= CLEARANCE) continue
      const y = i % rows
      visit(i - rows, d)
      visit(i + rows, d)
      if (y > 0) visit(i - 1, d)
      if (y < rows - 1) visit(i + 1, d)
    }
  }

  function spawn(i: number, fromLeft: boolean): void {
    let x = 0
    let y = 0
    for (let attempt = 0; attempt < 24; attempt++) {
      x = fromLeft ? random() * 2 : random() * cols
      y = random() * rows
      if (blocked[(x | 0) * rows + (y | 0)] !== 1) break
    }
    const life = LIFE_MIN + random() * (LIFE_MAX - LIFE_MIN)
    particles[i * 4] = x
    particles[i * 4 + 1] = y
    // Al empezar, edades repartidas: si no, todas renacen juntas.
    particles[i * 4 + 2] = fromLeft ? 0 : random() * life
    particles[i * 4 + 3] = life
  }

  function sample(field: Float32Array, x: number, y: number): number {
    const fx = Math.min(cols - 1.001, Math.max(0, x))
    const fy = Math.min(rows - 1.001, Math.max(0, y))
    const x0 = fx | 0
    const y0 = fy | 0
    const tx = fx - x0
    const ty = fy - y0
    const i = x0 * rows + y0
    const a = (field[i] ?? 0) + ((field[i + 1] ?? 0) - (field[i] ?? 0)) * ty
    const b = (field[i + rows] ?? 0) + ((field[i + rows + 1] ?? 0) - (field[i + rows] ?? 0)) * ty
    return a + (b - a) * tx
  }

  function step(dt: number, mode: CursorMode): void {
    time += dt
    const level = presence.level
    const side = Math.max(cols, rows)
    const stone = STONE * side
    const core = VORTEX_CORE * side
    const px = presence.x
    const py = presence.y

    for (let p = 0; p < count; p++) {
      const k = p * 4
      let x = particles[k] ?? 0
      let y = particles[k + 1] ?? 0
      let u = sample(windX, x, y)
      let v = sample(windY, x, y)

      const cx = Math.min(cols - 1, Math.max(0, x | 0))
      const cy = Math.min(rows - 1, Math.max(0, y | 0))
      const near = (clearance[cx * rows + cy] ?? 0) / CLEARANCE
      if (near > 0) {
        let tu = 0
        let tv = 0
        for (const wave of WAVES) {
          const c = Math.cos(wave.kx * x + wave.ky * y + wave.speed * time + wave.phase)
          tu += wave.amplitude * wave.ky * c
          tv -= wave.amplitude * wave.kx * c
        }
        u += tu * near * WIND
        v += tv * near * WIND
      }

      if (level > 0.01 && mode !== 'off') {
        const dx = x - px
        const dy = y - py
        const r2 = dx * dx + dy * dy + 1e-6
        if (mode === 'repel') {
          if (r2 < stone * stone) {
            // Adentro de la roca: sale por el borde más cercano.
            const r = Math.sqrt(r2)
            x = px + (dx / r) * stone
            y = py + (dy / r) * stone
          } else {
            // Flujo potencial alrededor de un cilindro: se frena al frente y acelera a los lados.
            const r4 = r2 * r2
            const a2 = stone * stone * WIND * level
            u -= (a2 * (dx * dx - dy * dy)) / r4
            v -= (a2 * 2 * dx * dy) / r4
          }
        } else {
          const q = (VORTEX * level) / (r2 + core * core)
          u += -dy * q - dx * q * 0.12
          v += dx * q - dy * q * 0.12
        }
      }

      const speed = Math.sqrt(u * u + v * v)
      if (speed > MAX_STEP) {
        u *= MAX_STEP / speed
        v *= MAX_STEP / speed
      }
      x += u
      y += v
      const age = (particles[k + 2] ?? 0) + 1
      const cell = (x | 0) * rows + (y | 0)
      if (
        age > (particles[k + 3] ?? 0) ||
        x < 0 ||
        y < 0 ||
        x >= cols ||
        y >= rows ||
        blocked[cell] === 1
      ) {
        spawn(p, random() < FROM_LEFT)
        continue
      }
      particles[k] = x
      particles[k + 1] = y
      particles[k + 2] = age
      trail[cell] = Math.min(1.5, (trail[cell] ?? 0) + DEPOSIT)
    }
    for (let i = 0; i < trail.length; i++) trail[i] = (trail[i] ?? 0) * TRAIL_DECAY
  }

  return {
    frame(boxCols, boxRows, context) {
      ensure(boxCols, boxRows, context)
      const mode = options.cursor()
      followPointer(presence, context, mode !== 'off', scale)
      step(context.dt, mode)
      if (mask) writeScaled(trail, rows, mask, scale, TRAIL_LOW, TRAIL_HIGH, GAIN)
      return mask
    },

    still(boxCols, boxRows, context) {
      ensure(boxCols, boxRows, context)
      if (settledMask === mask && settledIslands === islandsSeen) return mask
      for (let i = 0; i < STILL_STEPS; i++) step(1 / 30, 'off')
      if (mask) writeScaled(trail, rows, mask, scale, TRAIL_LOW, TRAIL_HIGH, GAIN)
      settledMask = mask
      settledIslands = islandsSeen
      return mask
    },
  }
}
