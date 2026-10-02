import { describe, expect, it } from 'vitest'
import {
  cellLight,
  createField,
  createPaintBuffers,
  fieldGeometryFor,
  fieldStep,
  levelStyles,
  markShapes,
  paintField,
  type FieldCanvas,
  type FrameInput,
} from './grid-field'
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

const palettes = { base: levelStyles([255, 255, 255]), accent: levelStyles([255, 176, 0]) }
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
    const { ctx, calls } = fakeCanvas()
    paintField(ctx, field, frame(), createPaintBuffers(field), palettes, 1)
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
