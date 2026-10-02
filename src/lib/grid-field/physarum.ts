/**
 * Physarum (moho mucilaginoso), según Jones (2010): agentes que huelen un rastro
 * adelante, giran hacia donde hay más, avanzan y depositan. El rastro se difunde
 * y se evapora; las venas que emergen son la red que se ve. Sin DOM.
 *
 * Vive en una grilla propia a MEDIA resolución de la caja (una celda de rastro por
 * 2×2 celdas del campo): cuesta la cuarta parte y deja venas de al menos dos
 * celdas, el piso para que un trazo se lea.
 *
 * Índices column-major, como el campo: `x * rows + y`.
 */

import type { SpriteMask } from './grid-field'
import { writeHalfRes, type CellRect } from './live'

export interface PhysarumParams {
  /** Agentes por celda de rastro. */
  density: number
  maxAgents: number
  /** Ángulo entre el sensor central y los laterales (rad). */
  sensorAngle: number
  /** Distancia de los sensores, en celdas de rastro. */
  sensorDistance: number
  /** Cuánto gira un agente por paso (rad). */
  turnAngle: number
  /** Temblor aleatorio del rumbo por paso (rad): sin él, la red se vuelve rígida. */
  jitter: number
  /**
   * Fracción de agentes que renace en un lugar al azar en cada paso. Sin esto la
   * red se consolida en pocas autopistas gruesas y deja de moverse.
   */
  respawn: number
  /** Rastro a partir del cual un agente ya no deposita: frena las autopistas. */
  saturation: number
  /** Avance por paso, en celdas de rastro. */
  speed: number
  deposit: number
  /** Fracción del rastro que se evapora por paso. */
  decay: number
  /** 0 = sin difusión, 1 = media 3×3 completa. */
  diffuse: number
  /** Cuánto pesa la comida al oler, respecto del rastro. */
  foodWeight: number
  /** Rastro que la comida deposita por paso: la red la encuentra y la dibuja. */
  feed: number
  /** Preferencia por bajar (0 = ninguna): el arrecife crece desde el fondo. */
  gravity: number
  /**
   * Los bordes horizontales siempre se envuelven (lo que sale por un lado entra por
   * el otro): una pared junta agentes y la red se pega al borde. Los verticales,
   * solo si esto es true; con gravedad, el fondo tiene que ser suelo.
   */
  wrapY: boolean
}

/**
 * Afinados en una caja de 160 × 85 celdas de rastro (un hero de escritorio). Con
 * menos renacer, temblor o saturación, en 30 s la red colapsa en dos o tres
 * autopistas; con más, se deshace en ruido.
 */
export const PHYSARUM_DEFAULTS: PhysarumParams = {
  density: 0.35,
  maxAgents: 8000,
  sensorAngle: 0.785,
  sensorDistance: 4,
  turnAngle: 0.6,
  jitter: 0.22,
  respawn: 0.008,
  saturation: 9,
  speed: 1,
  deposit: 1,
  decay: 0.15,
  diffuse: 0.3,
  foodWeight: 1.6,
  feed: 0.35,
  gravity: 0,
  wrapY: true,
}

/** Un punto que la red huele sin que quede rastro: positivo atrae, negativo aparta. */
export interface Lure {
  x: number
  y: number
  radius: number
  strength: number
}

export interface Physarum {
  cols: number
  rows: number
  trail: Float32Array
  /** Buffer de la difusión: se intercambia con `trail` en cada paso. */
  spare: Float32Array
  food: Float32Array
  /** 1 = isla: ni agentes ni rastro (el texto). */
  blocked: Uint8Array
  /** x, y, rumbo por agente. */
  agents: Float32Array
  count: number
  /** Desde qué fracción de la altura nacen los agentes (0 = en toda la caja). */
  spawnTop: number
}

const TAU = Math.PI * 2

export function createPhysarum(
  cols: number,
  rows: number,
  params: PhysarumParams,
  spawnTop = 0,
  random: () => number = Math.random,
): Physarum {
  const n = cols * rows
  const count = Math.max(1, Math.min(params.maxAgents, Math.round(n * params.density)))
  const sim: Physarum = {
    cols,
    rows,
    trail: new Float32Array(n),
    spare: new Float32Array(n),
    food: new Float32Array(n),
    blocked: new Uint8Array(n),
    agents: new Float32Array(count * 3),
    count,
    spawnTop,
  }
  for (let a = 0; a < count; a++) placeAgent(sim, a, random)
  return sim
}

function placeAgent(sim: Physarum, a: number, random: () => number): void {
  const { cols, rows, blocked, agents } = sim
  const top = sim.spawnTop * rows
  let x = 0
  let y = 0
  for (let attempt = 0; attempt < 32; attempt++) {
    x = random() * cols
    y = top + random() * (rows - top)
    if ((blocked[(x | 0) * rows + (y | 0)] ?? 1) === 0) break
  }
  agents[a * 3] = x
  agents[a * 3 + 1] = y
  agents[a * 3 + 2] = random() * TAU
}

/**
 * Marca las islas (en celdas de rastro) y reubica a los agentes que quedaron
 * adentro. El rastro de una isla se borra en el siguiente paso.
 */
export function blockRects(
  sim: Physarum,
  rects: readonly CellRect[],
  random: () => number = Math.random,
): void {
  const { cols, rows, blocked, agents } = sim
  blocked.fill(0)
  for (const rect of rects) {
    const x0 = Math.max(0, rect.col)
    const x1 = Math.min(cols, rect.col + rect.cols)
    const y0 = Math.max(0, rect.row)
    const y1 = Math.min(rows, rect.row + rect.rows)
    for (let x = x0; x < x1; x++) blocked.fill(1, x * rows + y0, x * rows + Math.max(y0, y1))
  }
  for (let a = 0; a < sim.count; a++) {
    const x = agents[a * 3] ?? 0
    const y = agents[a * 3 + 1] ?? 0
    if ((blocked[(x | 0) * rows + (y | 0)] ?? 1) === 1) placeAgent(sim, a, random)
  }
}

/** Lo que huele un sensor en (x, y): rastro, comida, gravedad y señuelo. */
function smell(
  sim: Physarum,
  x: number,
  y: number,
  params: PhysarumParams,
  lure: Lure | null,
): number {
  const { cols, rows } = sim
  if (x < 0) x += cols
  else if (x >= cols) x -= cols
  if (y < 0 || y >= rows) {
    if (!params.wrapY) return -1
    y += y < 0 ? rows : -rows
  }
  const i = (x | 0) * rows + (y | 0)
  if (sim.blocked[i] === 1) return -1
  let value = (sim.trail[i] ?? 0) + params.foodWeight * (sim.food[i] ?? 0)
  if (params.gravity !== 0) value += (params.gravity * y) / rows
  if (lure) {
    const dx = x - lure.x
    const dy = y - lure.y
    const r2 = lure.radius * lure.radius
    const d2 = dx * dx + dy * dy
    if (d2 < r2) value += lure.strength * (1 - d2 / r2)
  }
  return value
}

/** Un paso: sentir, girar, avanzar, depositar; después alimentar, difundir y evaporar. */
export function stepPhysarum(
  sim: Physarum,
  params: PhysarumParams,
  lure: Lure | null,
  random: () => number = Math.random,
): void {
  const { cols, rows, blocked, agents, count, food } = sim
  const trail = sim.trail
  const sa = params.sensorAngle
  const so = params.sensorDistance
  const ra = params.turnAngle

  for (let a = 0; a < count; a++) {
    const k = a * 3
    let x = agents[k] ?? 0
    let y = agents[k + 1] ?? 0
    let h = agents[k + 2] ?? 0

    const f = smell(sim, x + Math.cos(h) * so, y + Math.sin(h) * so, params, lure)
    const l = smell(sim, x + Math.cos(h - sa) * so, y + Math.sin(h - sa) * so, params, lure)
    const r = smell(sim, x + Math.cos(h + sa) * so, y + Math.sin(h + sa) * so, params, lure)
    if (f >= l && f >= r) {
      // Adelante es lo mejor: sigue.
    } else if (f < l && f < r) h += random() < 0.5 ? -ra : ra
    else if (l > r) h -= ra
    else h += ra
    h += (random() - 0.5) * 2 * params.jitter
    if (h < 0) h += TAU
    else if (h >= TAU) h -= TAU

    let nx = x + Math.cos(h) * params.speed
    let ny = y + Math.sin(h) * params.speed
    if (nx < 0) nx += cols
    else if (nx >= cols) nx -= cols
    let wall = false
    if (ny < 0 || ny >= rows) {
      if (params.wrapY) ny += ny < 0 ? rows : -rows
      else wall = true
    }
    if (wall || blocked[(nx | 0) * rows + (ny | 0)] === 1) {
      h = random() * TAU
    } else {
      x = nx
      y = ny
      const i = (x | 0) * rows + (y | 0)
      const t = trail[i] ?? 0
      if (t < params.saturation) trail[i] = t + params.deposit
    }
    agents[k] = x
    agents[k + 1] = y
    agents[k + 2] = h
  }

  // Renacer: sortea CUÁLES, sin tirar un dado por agente (como el parpadeo).
  let reborn = params.respawn * count
  while (reborn >= 1 || (reborn > 0 && random() < reborn)) {
    placeAgent(sim, (random() * count) | 0, random)
    reborn--
  }

  const n = cols * rows
  if (params.feed > 0) {
    for (let i = 0; i < n; i++) {
      const value = food[i] ?? 0
      if (value > 0) trail[i] = (trail[i] ?? 0) + value * params.feed
    }
  }

  const keep = 1 - params.decay
  const d = params.diffuse
  const out = sim.spare
  const wrapY = params.wrapY
  for (let x = 0; x < cols; x++) {
    const left = (x > 0 ? x - 1 : cols - 1) * rows
    const mid = x * rows
    const right = (x < cols - 1 ? x + 1 : 0) * rows
    for (let y = 0; y < rows; y++) {
      const i = mid + y
      if (blocked[i] === 1) {
        out[i] = 0
        continue
      }
      // Sin envolver, el borde repite su propia fila: no "pierde" rastro hacia afuera.
      const up = y > 0 ? y - 1 : wrapY ? rows - 1 : y
      const down = y < rows - 1 ? y + 1 : wrapY ? 0 : y
      const sum =
        (trail[left + up] ?? 0) +
        (trail[left + y] ?? 0) +
        (trail[left + down] ?? 0) +
        (trail[mid + up] ?? 0) +
        (trail[i] ?? 0) +
        (trail[mid + down] ?? 0) +
        (trail[right + up] ?? 0) +
        (trail[right + y] ?? 0) +
        (trail[right + down] ?? 0)
      const own = trail[i] ?? 0
      out[i] = (own + (sum / 9 - own) * d) * keep
    }
  }
  sim.spare = trail
  sim.trail = out
}

/**
 * Vuelca el rastro a la máscara de la caja (ver `writeHalfRes`). Sin el umbral,
 * la red se lee como una mancha pareja.
 */
export function writeMask(
  sim: Physarum,
  mask: SpriteMask,
  low: number,
  high: number,
  gain: number,
): void {
  writeHalfRes(sim.trail, sim.rows, mask, low, high, gain)
}
