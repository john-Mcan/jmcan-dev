/**
 * Moho: un Physarum que vive en toda la caja del escenario y esquiva las islas
 * (el texto). Huele la POSICIÓN del puntero (se estira hacia él o se aparta) sin
 * dejar rastro: cuando el puntero se va, la red se relaja. Sin DOM.
 */

import type { SpriteMask } from './grid-field'
import {
  createPresence,
  fineScale,
  followPointer,
  scaled,
  scaledRects,
  type CellRect,
  type CursorMode,
  type LiveContext,
  type LiveSource,
} from './live'
import {
  blockRects,
  createPhysarum,
  PHYSARUM_DEFAULTS,
  stepPhysarum,
  writeMask,
  type Lure,
  type Physarum,
  type PhysarumParams,
} from './physarum'

/**
 * `open`: la red llena la caja. `reef`: crece desde el fondo, como un arrecife
 * (solo en cajas apaisadas; ver `habitatFor`).
 */
export type Habitat = 'open' | 'reef'

export interface MoldOptions {
  habitat: Habitat
  /** Se lee en cada cuadro: el laboratorio lo cambia en vivo. */
  cursor: () => CursorMode
  random?: () => number
}

const HABITATS: Record<Habitat, { params: PhysarumParams; spawnTop: number }> = {
  open: { params: PHYSARUM_DEFAULTS, spawnTop: 0 },
  reef: {
    params: { ...PHYSARUM_DEFAULTS, wrapY: false, gravity: 2, shunIslands: true },
    spawnTop: 0.65,
  },
}

/** Umbral rastro → cobertura (ver `writeScaled`): bajo LOW nada, sobre HIGH pleno. */
const TRAIL_LOW = 2
const TRAIL_HIGH = 6.5
const GAIN = 0.72
/** Margen de las islas, en celdas de rastro (2 celdas del campo cada una). */
const ISLAND_MARGIN = 1
/** Radio del señuelo como fracción del lado mayor de la caja. */
const LURE_RADIUS = 0.16
const LURE_STRENGTH: Record<CursorMode, number> = { attract: 6, repel: -8, off: 0 }
/** Pasos para asentar el cuadro quieto (movimiento reducido): ~5 s de red. */
const STILL_STEPS = 150

export function createMold(options: MoldOptions): LiveSource {
  const random = options.random ?? Math.random
  // El hábitat efectivo depende de la caja (ver `habitatFor`); se decide al medirla.
  let { params, spawnTop } = HABITATS.open
  let habitat: Habitat = 'open'

  let sim: Physarum | null = null
  let mask: SpriteMask | null = null
  let scale = 1
  let islandsSeen = -1
  const rects: CellRect[] = []
  // Movimiento reducido: con qué simulación e islas se asentó el cuadro quieto.
  let settled: Physarum | null = null
  let settledIslands = -1

  const presence = createPresence()
  const lure: Lure = { x: 0, y: 0, radius: 1, strength: 0 }

  function ensure(cols: number, rows: number, context: LiveContext): Physarum {
    const wanted = fineScale(context.cellPx)
    if (!sim || !mask || mask.cols !== cols || mask.rows !== rows || scale !== wanted) {
      scale = wanted
      habitat = habitatFor(options.habitat, cols, rows)
      ;({ params, spawnTop } = HABITATS[habitat])
      sim = createPhysarum(scaled(cols, scale), scaled(rows, scale), params, spawnTop, random)
      mask = { data: new Float32Array(cols * rows), cols, rows }
      if (habitat === 'reef') sim.food.set(groundFood(sim, random))
      lure.radius = Math.max(8, LURE_RADIUS * Math.max(sim.cols, sim.rows))
      islandsSeen = -1
    }
    if (islandsSeen !== context.islandsVersion) {
      islandsSeen = context.islandsVersion
      blockRects(sim, scaledRects(context.islands, ISLAND_MARGIN, scale, rects), random)
    }
    return sim
  }

  function lureFor(context: LiveContext): Lure | null {
    const strength = LURE_STRENGTH[options.cursor()]
    followPointer(presence, context, strength !== 0, scale)
    if (presence.level <= 0.01) return null
    lure.x = presence.x
    lure.y = presence.y
    lure.strength = strength * presence.level
    return lure
  }

  return {
    frame(cols, rows, context) {
      const target = ensure(cols, rows, context)
      stepPhysarum(target, params, lureFor(context), random)
      if (mask) writeMask(target, mask, scale, TRAIL_LOW, TRAIL_HIGH, GAIN)
      return mask
    },

    still(cols, rows, context) {
      const target = ensure(cols, rows, context)
      // El cuadro quieto se asienta UNA vez: el runner lo pide en cada scroll.
      if (settled === target && settledIslands === islandsSeen) return mask
      for (let step = 0; step < STILL_STEPS; step++) stepPhysarum(target, params, null, random)
      if (mask) writeMask(target, mask, scale, TRAIL_LOW, TRAIL_HIGH, GAIN)
      settled = target
      settledIslands = islandsSeen
      return mask
    },
  }
}

/**
 * El arrecife necesita una caja apaisada: en una vertical (móvil) la franja del
 * fondo queda chica y la red no tiene dónde crecer. Ahí vive como red abierta.
 */
export function habitatFor(wanted: Habitat, cols: number, rows: number): Habitat {
  return wanted === 'reef' && cols >= rows ? 'reef' : 'open'
}

/**
 * El suelo del arrecife: comida en una franja al fondo con relieve (dos senos),
 * más densa cuanto más abajo. La red crece desde ahí.
 */
function groundFood(sim: Physarum, random: () => number): Float32Array {
  const { cols, rows } = sim
  const out = new Float32Array(cols * rows)
  const a = random() * Math.PI * 2
  const b = random() * Math.PI * 2
  for (let x = 0; x < cols; x++) {
    const height = rows * (0.1 + 0.05 * Math.sin(x * 0.11 + a) + 0.03 * Math.sin(x * 0.37 + b))
    const top = Math.max(0, Math.round(rows - height))
    for (let y = top; y < rows; y++) {
      out[x * rows + y] = 0.15 + 0.45 * ((y - top) / Math.max(1, rows - top))
    }
  }
  return out
}
