import { describe, expect, it } from 'vitest'
import {
  cellLight,
  createField,
  createPaintBuffers,
  dotSize,
  fieldGeometryFor,
  fieldStep,
  levelStyles,
  markShapes,
  paintField,
  type FieldCanvas,
  type FrameInput,
} from './grid-field'
import type { LiveContext } from './live'
import { createCosmos } from './live-cosmos'
import { createCurrents } from './live-currents'
import { createFlock } from './live-flock'
import { createFrost } from './live-frost'
import { createJulia } from './live-julia'
import { createMold } from './live-mold'
import {
  blockRects,
  createPhysarum,
  PHYSARUM_DEFAULTS,
  stepPhysarum,
  writeMask,
  type Physarum,
} from './physarum'
import { randomSpriteIndex } from './sprites'
import { holdEnvelope, loopEnvelope, LOOP_DEFAULTS, sweepRows } from './timeline'

function fakeCanvas() {
  const calls = { fillRect: 0, styleSets: 0 }
  let style = ''
  const ctx: FieldCanvas = {
    setTransform: () => undefined,
    clearRect: () => undefined,
    fillRect: () => {
      calls.fillRect++
    },
    get fillStyle() {
      return style
    },
    set fillStyle(value) {
      style = String(value)
      calls.styleSets++
    },
  }
  return { ctx, calls }
}

const palettes = {
  base: levelStyles([255, 255, 255]),
  accent: levelStyles([255, 176, 0]),
  spread: 0,
}
const clock = { frameCount: 4, frameMs: 500 }

function frame(overrides: Partial<FrameInput> = {}): FrameInput {
  return {
    phase: { presence: 1, condense: 0.5, textAlpha: 0 },
    sprite: null,
    rowGain: null,
    dt: 0,
    ...overrides,
  }
}

describe('paintField', () => {
  it('cambia fillStyle como mucho 48 veces (24 niveles × 2 paletas)', () => {
    const field = createField({ width: 600, height: 300, square: 2, gap: 4, maxOpacity: 0.22 })
    markShapes(field, [
      { x: 50, y: 50, w: 200, h: 30, accent: false },
      { x: 50, y: 120, w: 200, h: 30, accent: true },
    ])
    // Un sprite con toda la gama de coberturas: sus puntos van en grupos propios.
    const mask = { cols: 40, rows: 20, data: new Float32Array(800).map((_, i) => (i % 10) / 9) }
    const { ctx, calls } = fakeCanvas()
    paintField(
      ctx,
      field,
      frame({
        phase: { presence: 1, condense: 0.5, textAlpha: 1 },
        sprite: { mask, col0: 10, row0: 10, accent: true },
      }),
      createPaintBuffers(field),
      { ...palettes, spread: 0.5 },
      1,
    )
    expect(calls.fillRect).toBeGreaterThan(0)
    expect(calls.styleSets).toBeLessThanOrEqual(48)
  })

  it('las formas de señal pintan con la paleta de acento', () => {
    const field = createField({ width: 120, height: 60, square: 2, gap: 4, maxOpacity: 0.22 })
    field.cells.fill(0.2)
    markShapes(field, [{ x: 0, y: 0, w: 120, h: 60, accent: true }])
    const used = new Set<string>()
    const ctx: FieldCanvas = {
      setTransform: () => undefined,
      clearRect: () => undefined,
      fillRect: () => undefined,
      get fillStyle() {
        return ''
      },
      set fillStyle(value) {
        used.add(String(value))
      },
    }
    paintField(ctx, field, frame(), createPaintBuffers(field), palettes, 1)
    expect([...used].every((style) => palettes.accent.includes(style))).toBe(true)
  })
})

describe('cellLight', () => {
  it('las formas encienden su zona sin atenuar el resto (sin velo)', () => {
    const phase = { presence: 1, condense: 0.5, textAlpha: 0 }
    expect(cellLight(0.2, 0, 0, phase, 0.22)).toBe(0.2)
    expect(cellLight(0.2, 1, 0, phase, 0.22)).toBeGreaterThan(0.2)
  })
})

describe('dotSize', () => {
  const desktop = { square: 2, gap: 4 }

  it('sin ganancia el punto no cambia', () => {
    expect(dotSize(desktop, 0, 23, true, 2)).toBe(2)
  })

  it('el sprite crece parejo: sus trazos tenues no quedan atrás de los fuertes', () => {
    expect(dotSize(desktop, 0.5, 3, true, 2)).toBe(4)
    expect(dotSize(desktop, 0.5, 23, true, 2)).toBe(4)
  })

  it('el ruido del campo no crece; el pico del barrido sí', () => {
    expect(dotSize(desktop, 0.5, 5, false, 2)).toBe(2)
    expect(dotSize(desktop, 0.5, 23, false, 2)).toBe(4)
  })
})

describe('relojes', () => {
  it('el loop suena un sprite por ciclo y calla entre ciclos', () => {
    const t = LOOP_DEFAULTS
    expect(loopEnvelope(t.firstMs + t.spriteMs / 2, clock, t).textAlpha).toBe(1)
    expect(loopEnvelope(t.firstMs + t.spriteMs / 2 + t.everyMs, clock, t).cycle).toBe(1)
    expect(loopEnvelope(t.firstMs + t.spriteMs + 100, clock, t).frameIndex).toBe(-1)
  })

  it('hold entra con fade y se queda', () => {
    expect(holdEnvelope(0, clock, 260).textAlpha).toBe(0)
    expect(holdEnvelope(60_000, clock, 260).textAlpha).toBe(1)
  })

  it('el barrido revela de arriba hacia abajo y termina', () => {
    const rows = new Float32Array(100)
    sweepRows(rows, 0.5, true)
    expect(rows[0]).toBeGreaterThan(0.9)
    expect(rows[99]).toBe(0)
    expect(sweepRows(rows, 1, true)).toBe(false)
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

/** Azar con semilla (mulberry32): la simulación se vuelve determinista y testeable. */
function seeded(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function trailMean(sim: Physarum, x0: number, x1: number, y0: number, y1: number): number {
  let sum = 0
  let n = 0
  for (let x = x0; x < x1; x++) {
    for (let y = y0; y < y1; y++) {
      sum += sim.trail[x * sim.rows + y] ?? 0
      n++
    }
  }
  return sum / n
}

describe('physarum', () => {
  it('ni agentes ni rastro dentro de una isla (el texto)', () => {
    const random = seeded(1)
    const sim = createPhysarum(60, 40, PHYSARUM_DEFAULTS, 0, random)
    blockRects(sim, [{ col: 10, row: 10, cols: 20, rows: 15 }], random)
    for (let i = 0; i < 120; i++) stepPhysarum(sim, PHYSARUM_DEFAULTS, null, random)
    for (let a = 0; a < sim.count; a++) {
      const x = sim.agents[a * 3] ?? 0
      const y = sim.agents[a * 3 + 1] ?? 0
      expect(x >= 10 && x < 30 && y >= 10 && y < 25).toBe(false)
    }
    expect(trailMean(sim, 10, 30, 10, 25)).toBe(0)
    expect(trailMean(sim, 0, 60, 0, 40)).toBeGreaterThan(0)
  })

  it('con la misma semilla, la misma red', () => {
    const run = () => {
      const random = seeded(7)
      const sim = createPhysarum(40, 30, PHYSARUM_DEFAULTS, 0, random)
      for (let i = 0; i < 60; i++) stepPhysarum(sim, PHYSARUM_DEFAULTS, null, random)
      return [...sim.trail]
    }
    expect(run()).toEqual(run())
  })

  it('un señuelo negativo aparta la red; no deja rastro propio', () => {
    const after = (strength: number) => {
      const random = seeded(3)
      const sim = createPhysarum(60, 40, PHYSARUM_DEFAULTS, 0, random)
      const lure = { x: 30, y: 20, radius: 10, strength }
      for (let i = 0; i < 150; i++) stepPhysarum(sim, PHYSARUM_DEFAULTS, lure, random)
      return trailMean(sim, 25, 35, 15, 25)
    }
    expect(after(-8)).toBeLessThan(after(0) * 0.5)
  })

  it('la máscara corta la neblina y no pasa de la ganancia', () => {
    const sim = createPhysarum(4, 4, PHYSARUM_DEFAULTS, 0, seeded(1))
    sim.trail.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    const mask = { data: new Float32Array(64), cols: 8, rows: 8 }
    writeMask(sim, mask, 2, 2, 6.5, 0.72)
    expect(mask.data[0]).toBe(0)
    expect(Math.max(...mask.data)).toBeCloseTo(0.72)
    expect(Math.min(...mask.data)).toBe(0)
  })
})

describe('patrones vivos', () => {
  const COLS = 120
  const ROWS = 80
  // Una isla: el texto.
  const island = { col: 20, row: 30, cols: 50, rows: 16 }
  const context = (): LiveContext => ({
    dt: 1 / 30,
    pointerCol: Number.NaN,
    pointerRow: Number.NaN,
    islands: [island],
    islandsVersion: 1,
    cellPx: 6,
  })
  const patterns = {
    moho: () => createMold({ habitat: 'open', cursor: () => 'attract', random: seeded(1) }),
    arrecife: () => createMold({ habitat: 'reef', cursor: () => 'off', random: seeded(2) }),
    cosmos: () => createCosmos({ cursor: () => 'attract', random: seeded(3) }),
    enjambre: () => createFlock({ cursor: () => 'attract', random: seeded(4) }),
    corrientes: () => createCurrents({ cursor: () => 'repel', random: seeded(5) }),
    escarcha: () => createFrost({ cursor: () => 'attract', random: seeded(6) }),
    julia: () => createJulia({ cursor: () => 'attract' }),
  }

  for (const [name, create] of Object.entries(patterns)) {
    it(`${name}: se mueve, no imprime sobre el texto ni pasa del tope de luz`, () => {
      const source = create()
      const ctx = context()
      let mask = null
      for (let i = 0; i < 90; i++) {
        // El puntero pasa por la caja: ningún patrón debe dejar marca en la isla.
        ctx.pointerCol = 30 + i
        ctx.pointerRow = 20
        mask = source.frame(COLS, ROWS, ctx)
      }
      expect(mask?.cols).toBe(COLS)
      const data = mask?.data ?? new Float32Array(0)
      expect(data.some((v) => v > 0.1)).toBe(true)
      expect(Math.max(...data)).toBeLessThanOrEqual(0.95)
      // El interior de la isla (descontado el margen de media celda) queda apagado; Julia,
      // la excepción, pasa por debajo del texto pero atenuada.
      const underText = name === 'julia' ? 0.3 : 0
      for (let c = island.col + 1; c < island.col + island.cols - 1; c++) {
        for (let r = island.row + 1; r < island.row + island.rows - 1; r++) {
          expect(data[c * ROWS + r]).toBeLessThanOrEqual(underText)
        }
      }
    })

    it(`${name}: el cuadro quieto se asienta una sola vez`, () => {
      const source = create()
      const ctx = context()
      const first = [...(source.still(COLS, ROWS, ctx)?.data ?? [])]
      const again = [...(source.still(COLS, ROWS, ctx)?.data ?? [])]
      expect(first.some((v) => v > 0)).toBe(true)
      expect(again).toEqual(first)
    })
  }
})
