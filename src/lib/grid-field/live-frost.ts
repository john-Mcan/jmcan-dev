/**
 * Escarcha: crecimiento por agregación limitada por difusión (DLA, Witten y
 * Sander, 1981). Caminantes al azar vagan por la caja y se pegan al tocar lo ya
 * cristalizado: salen ramas fractales, como escarcha en un vidrio o coral. Nace
 * en los bordes del texto y crece SIEMPRE hacia adelante; lo más viejo se apaga y
 * se derrite por detrás, así la escarcha avanza como un frente. Cada tanto
 * prenden semillas nuevas en el texto y sale otra ola. El puntero atrae el
 * crecimiento (los caminantes nacen cerca de él y las ramas se estiran hacia
 * ahí) o lo aparta (ahí no se pega nada y lo cristalizado se atenúa mientras
 * está). Sin DOM.
 *
 * Unidades: celdas de media resolución.
 */

import type { SpriteMask } from './grid-field'
import {
  createPresence,
  fillRects,
  followPointer,
  half,
  halfRects,
  writeHalfDirect,
  type CellRect,
  type CursorMode,
  type LiveContext,
  type LiveSource,
} from './live'

export interface FrostOptions {
  cursor: () => CursorMode
  random?: () => number
}

/** Caminantes por celda libre, y pasos que da cada uno por cuadro. */
const WALKER_DENSITY = 0.03
const MIN_WALKERS = 120
const MAX_WALKERS = 600
const WALKER_STEPS = 10
/** Probabilidad de pegarse al tocar: más baja, ramas más gruesas. */
const STICK = 0.6
const ISLAND_MARGIN = 1
/** Semillas en el borde del texto al empezar: una cada tantas celdas. */
const SEED_SPACING = 7
/** Olas nuevas: cada cuánto (s) y cuántas semillas prenden en el texto. */
const WAVE_MIN_S = 3
const WAVE_MAX_S = 6
const WAVE_SEEDS = 4
/** Cuánto hielo vive a la vez (fracción de lo libre): lo que sobra se derrite, lo más viejo primero. */
const COVER = 0.15
/** Deshielo: celdas por segundo como mucho y cuánto tarda una en apagarse. */
const MELT_PER_S = 500
const MELT_MS = 500
/** Luz: el frente (lo nuevo) pleno, la cola (lo viejo) más tenue; el destello al pegarse. */
const ICE = 0.62
const TAIL = 0.45
const FLASH = 0.33
const FLASH_MS = 500
const GAIN = 0.95
/**
 * Los caminantes nacen cerca del frente (lo más nuevo), a esta distancia, como en la
 * DLA clásica: si nacieran en cualquier lado, las puntas quedarían desperdigadas y,
 * al derretirse lo viejo, la escarcha se leería como polvo.
 */
const FRONT_SHARE = 0.5
const FRONT_MIN = 3
const FRONT_MAX = 9
/** Un caminante que vaga tantos pasos sin pegarse vuelve a nacer. */
const WALKER_LIFE = 240
/** El puntero: radio (fracción del lado mayor) y cuántos caminantes nacen cerca de él. */
const NEAR = 0.12
const NEAR_SPAWN = 0.6
const SHY = 0.25
const STILL_STEPS = 4000

export function createFrost(options: FrostOptions): LiveSource {
  const random = options.random ?? Math.random

  let cols = 0
  let rows = 0
  let mask: SpriteMask | null = null
  /** 0 libre, 1 hielo, 2 derritiéndose. */
  let ice = new Uint8Array(0)
  let blocked = new Uint8Array(0)
  let born = new Float32Array(0)
  /**
   * Las celdas de hielo en orden de llegada, en un anillo: se agrega por la cola
   * (`tail`) y se derrite por la cabeza (`head`), lo más viejo.
   */
  let order = new Int32Array(0)
  let head = 0
  let tail = 0
  let melting = new Int32Array(0)
  let meltingAt = new Float32Array(0)
  let meltingCount = 0
  let walkers = new Int32Array(0)
  let walkerAge = new Uint16Array(0)
  let walkerCount = 0
  let light = new Float32Array(0)
  let freeCells = 1

  let elapsed = 0
  let nextWave = 0
  const rects: CellRect[] = []
  let islandsSeen = -1
  let settledIslands = -1
  let settledMask: SpriteMask | null = null
  const presence = createPresence()

  function open(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return false
    const i = x * rows + y
    return blocked[i] !== 1 && ice[i] === 0
  }

  function touchesIce(x: number, y: number): boolean {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx
      if (nx < 0 || nx >= cols) continue
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= rows || (dx === 0 && dy === 0)) continue
        if (ice[nx * rows + ny] === 1) return true
      }
    }
    return false
  }

  function freeze(x: number, y: number): void {
    const i = x * rows + y
    ice[i] = 1
    born[i] = elapsed
    order[tail % order.length] = i
    tail++
  }

  /** Un punto del contorno de una isla (una celda por fuera de su margen), a `t` celdas del inicio. */
  function perimeterPoint(rect: CellRect, t: number): [number, number] {
    const x0 = rect.col - 1
    const y0 = rect.row - 1
    const w = rect.cols + 1
    const h = rect.rows + 1
    if (t < w) return [x0 + t, y0]
    if (t < w + h) return [x0 + w, y0 + (t - w)]
    if (t < 2 * w + h) return [x0 + w - (t - w - h), y0 + h]
    return [x0, y0 + h - (t - 2 * w - h)]
  }

  /**
   * Un caminante nuevo, sin tocar hielo (si no, se pega de inmediato): cerca del
   * puntero si atrae, si no cerca del frente.
   */
  function spawn(w: number, mode: CursorMode): void {
    walkerAge[w] = 0
    const near = mode === 'attract' && random() < NEAR_SPAWN * presence.level
    const radius = NEAR * Math.max(cols, rows)
    const count = tail - head
    for (let tries = 0; tries < 16; tries++) {
      let x: number
      let y: number
      if (near) {
        x = Math.round(presence.x + (random() * 2 - 1) * radius)
        y = Math.round(presence.y + (random() * 2 - 1) * radius)
      } else if (count > 0) {
        // Alrededor de una celda de la mitad más nueva del hielo.
        const k = head + Math.floor((1 - FRONT_SHARE * random()) * count) - 1
        const i = order[Math.max(head, k) % order.length] ?? 0
        const angle = random() * Math.PI * 2
        const distance = FRONT_MIN + random() * (FRONT_MAX - FRONT_MIN)
        x = Math.round(((i / rows) | 0) + Math.cos(angle) * distance)
        y = Math.round((i % rows) + Math.sin(angle) * distance)
      } else {
        x = Math.floor(random() * cols)
        y = Math.floor(random() * rows)
      }
      if (!open(x, y) || touchesIce(x, y)) continue
      walkers[w * 2] = x
      walkers[w * 2 + 1] = y
      return
    }
    walkers[w * 2] = -1
  }

  /** Todo el contorno del texto, para empezar. */
  function seedAll(): void {
    head = 0
    tail = 0
    ice.fill(0)
    for (const rect of rects) {
      const perimeter = 2 * (rect.cols + 1 + rect.rows + 1)
      for (let t = Math.floor(random() * SEED_SPACING); t < perimeter; t += SEED_SPACING) {
        const [x, y] = perimeterPoint(rect, t)
        if (open(x, y)) freeze(x, y)
      }
    }
    if (tail === 0) freeze(cols >> 1, rows >> 1)
    for (let k = head; k < tail; k++) born[order[k % order.length] ?? 0] = -FLASH_MS
  }

  /** Una ola nueva: unas pocas semillas en puntos al azar del texto. */
  function wave(): void {
    nextWave = elapsed + (WAVE_MIN_S + random() * (WAVE_MAX_S - WAVE_MIN_S)) * 1000
    if (rects.length === 0) return
    for (let s = 0; s < WAVE_SEEDS; s++) {
      const rect = rects[(random() * rects.length) | 0]
      if (!rect) continue
      const [x, y] = perimeterPoint(rect, random() * 2 * (rect.cols + 1 + rect.rows + 1))
      if (open(Math.round(x), Math.round(y))) freeze(Math.round(x), Math.round(y))
    }
  }

  function ensure(boxCols: number, boxRows: number, context: LiveContext): void {
    if (!mask || mask.cols !== boxCols || mask.rows !== boxRows) {
      cols = half(boxCols)
      rows = half(boxRows)
      const n = cols * rows
      mask = { data: new Float32Array(boxCols * boxRows), cols: boxCols, rows: boxRows }
      ice = new Uint8Array(n)
      blocked = new Uint8Array(n)
      born = new Float32Array(n)
      order = new Int32Array(n)
      melting = new Int32Array(n)
      meltingAt = new Float32Array(n)
      light = new Float32Array(n)
      walkerCount = Math.round(Math.min(MAX_WALKERS, Math.max(MIN_WALKERS, n * WALKER_DENSITY)))
      walkers = new Int32Array(walkerCount * 2)
      walkerAge = new Uint16Array(walkerCount)
      islandsSeen = -1
      settledMask = null
    }
    if (islandsSeen !== context.islandsVersion) {
      islandsSeen = context.islandsVersion
      blocked.fill(0)
      fillRects(blocked, cols, rows, halfRects(context.islands, ISLAND_MARGIN, rects))
      let used = 0
      for (const cell of blocked) used += cell
      freeCells = Math.max(1, blocked.length - used)
      meltingCount = 0
      seedAll()
      nextWave = elapsed + WAVE_MIN_S * 1000
      for (let w = 0; w < walkerCount; w++) spawn(w, 'off')
    }
  }

  function grow(mode: CursorMode): void {
    const shyRadius2 = (NEAR * Math.max(cols, rows)) ** 2
    const shy = mode === 'repel' && presence.level > 0.01
    for (let w = 0; w < walkerCount; w++) {
      let x = walkers[w * 2] ?? -1
      let y = walkers[w * 2 + 1] ?? 0
      if (x < 0) {
        spawn(w, mode)
        continue
      }
      for (let s = 0; s < WALKER_STEPS; s++) {
        const turn = (random() * 4) | 0
        const nx = x + (turn === 0 ? 1 : turn === 1 ? -1 : 0)
        const ny = y + (turn === 2 ? 1 : turn === 3 ? -1 : 0)
        if (!open(nx, ny)) continue
        x = nx
        y = ny
        if (!touchesIce(x, y)) continue
        if (shy && (x - presence.x) ** 2 + (y - presence.y) ** 2 < shyRadius2) continue
        if (random() < STICK) {
          freeze(x, y)
          x = -1
          break
        }
      }
      const age = (walkerAge[w] ?? 0) + WALKER_STEPS
      if (x < 0 || age > WALKER_LIFE) spawn(w, mode)
      else {
        walkers[w * 2] = x
        walkers[w * 2 + 1] = y
        walkerAge[w] = age
      }
    }
  }

  /** Lo que pasa del cupo se derrite por detrás: lo más viejo primero. */
  function melt(dt: number): void {
    let budget = MELT_PER_S * dt
    const limit = COVER * freeCells
    while (budget-- > 0 && tail - head > limit) {
      const i = order[head % order.length] ?? 0
      head++
      ice[i] = 2
      melting[meltingCount] = i
      meltingAt[meltingCount] = elapsed
      meltingCount++
    }
  }

  function paint(mode: CursorMode): void {
    if (!mask) return
    light.fill(0)
    const dim = mode === 'repel' ? presence.level : 0
    const near2 = (NEAR * Math.max(cols, rows)) ** 2
    const count = Math.max(1, tail - head)
    for (let k = head; k < tail; k++) {
      const i = order[k % order.length] ?? 0
      const age = elapsed - (born[i] ?? 0)
      // El frente (lo último que se pegó) pleno; hacia atrás, cada vez más tenue.
      const rank = (k - head) / count
      let value = ICE * (TAIL + (1 - TAIL) * rank)
      if (age < FLASH_MS) value += FLASH * (1 - age / FLASH_MS)
      if (dim > 0.01) {
        const x = (i / rows) | 0
        const y = i - x * rows
        const d2 = (x - presence.x) ** 2 + (y - presence.y) ** 2
        if (d2 < near2) value *= 1 - (1 - SHY) * dim * (1 - d2 / near2)
      }
      light[i] = value
    }
    // Lo que se derrite se apaga suave y después libera su celda.
    let kept = 0
    for (let k = 0; k < meltingCount; k++) {
      const i = melting[k] ?? 0
      const t = (elapsed - (meltingAt[k] ?? 0)) / MELT_MS
      if (t >= 1) {
        ice[i] = 0
        continue
      }
      light[i] = ICE * TAIL * (1 - t)
      melting[kept] = i
      meltingAt[kept] = meltingAt[k] ?? 0
      kept++
    }
    meltingCount = kept
    writeHalfDirect(light, rows, mask, GAIN)
  }

  return {
    frame(boxCols, boxRows, context) {
      ensure(boxCols, boxRows, context)
      elapsed += context.dt * 1000
      const mode = options.cursor()
      followPointer(presence, context, mode !== 'off')
      if (elapsed >= nextWave) wave()
      grow(mode)
      melt(context.dt)
      paint(mode)
      return mask
    },

    still(boxCols, boxRows, context) {
      ensure(boxCols, boxRows, context)
      if (settledMask === mask && settledIslands === islandsSeen) return mask
      // Quieto: crecido hasta casi llenar el cupo, sin destellos.
      for (let i = 0; i < STILL_STEPS && tail - head < COVER * freeCells * 0.85; i++) grow('off')
      elapsed += FLASH_MS * 4
      paint('off')
      settledMask = mask
      settledIslands = islandsSeen
      return mask
    },
  }
}
