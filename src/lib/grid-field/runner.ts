import {
  createField,
  createPaintBuffers,
  fieldGeometryFor,
  flickerCells,
  levelStyles,
  markShapes,
  paintField,
  FIELD_DEFAULTS,
  type FieldPointer,
  type GridField,
  type PaintBuffers,
  type Palettes,
  type Rgb,
  type ShapeRect,
  type SpriteMask,
  type SpritePlacement,
} from './grid-field'
import { boxOnField, rasteriseFrame, spriteBoxFor, type SpriteFont } from './sprite-raster'
import { randomSpriteIndex, type Sprite } from './sprites'
import {
  clamp,
  holdEnvelope,
  loopEnvelope,
  NO_SPRITE,
  rising,
  sweepRows,
  type LoopTimeline,
  type SpriteEnvelope,
} from './timeline'

/** Marca un elemento como forma; con el valor `accent`, pinta con la paleta de señal. */
export const SHAPE_ATTRIBUTE = 'data-grid-shape'

/**
 * Dónde y qué imprime el campo. La caja es el rect de `target`, re-medido cada
 * cuadro: el sprite sigue al elemento cuando hay scroll o es sticky.
 */
export interface Stage {
  target: Element
  program:
    | { kind: 'loop'; pool: readonly Sprite[]; timeline: LoopTimeline }
    | { kind: 'hold'; sprite: Sprite }
  /** Pinta el sprite con la paleta de señal. */
  accent: boolean
}

export interface GridFieldOptions {
  /** Tope de cuadros por segundo. El parpadeo se ve igual a 30 que a 60. */
  fps: number
  maxOpacity: number
  /** Fracción de celdas re-sorteadas por segundo. */
  chance: number
  /** Presupuesto de celdas: un viewport más grande engrosa la grilla. */
  maxCells: number
  maxDpr: number
  /** Cuánto destacan las formas en reposo (0–1). */
  restCondense: number
  /** Barrido que revela el campo al montar. */
  introMs: number
  introTauMs: number
  /** Barrido y re-condensación al llegar a una página nueva. */
  enterMs: number
  enterTauMs: number
  /** Cuánto tarda la estructura en disolverse al salir de una página. */
  leaveMs: number
  /** Fade de entrada/salida de los sprites. */
  fadeMs: number
  /** Brillo que sigue al puntero (solo punteros finos y sin movimiento reducido). */
  pointer: boolean
  font: SpriteFont
}

export const GRID_FIELD_DEFAULTS: Omit<GridFieldOptions, 'font'> = {
  fps: 30,
  maxOpacity: FIELD_DEFAULTS.maxOpacity,
  chance: FIELD_DEFAULTS.chance,
  maxCells: 90_000,
  maxDpr: 2,
  restCondense: 0.5,
  introMs: 1100,
  introTauMs: 900,
  enterMs: 650,
  enterTauMs: 450,
  leaveMs: 180,
  fadeMs: 260,
  pointer: true,
}

export interface GridFieldRunner {
  /** Cambia el escenario de sprites; el actual se desvanece antes de que entre el nuevo. */
  setStage(stage: Stage | null): void
  /** Vuelve a medir las formas ahora (p. ej. después de cambiar un `data-grid-shape`). */
  rescan(): void
  /** Navegación saliente: la estructura se disuelve en ruido. */
  leave(): void
  /** Navegación entrante: barrido de escaneo y la estructura nueva emerge. */
  enter(): void
  destroy(): void
}

const FALLBACK_RGB: Rgb = [255, 255, 255]
const FALLBACK_ACCENT: Rgb = [255, 176, 0]
const POINTER_RADIUS = 150
const POINTER_STRENGTH = 1.6

interface Sweep {
  start: number
  ms: number
  reveal: boolean
}

/**
 * Todo el estado mutable vive aquí, fuera de cualquier framework: el loop lee
 * siempre el estado más reciente y nada lo reinicia salvo `destroy`.
 */
export function createGridFieldRunner(
  host: HTMLElement,
  canvas: HTMLCanvasElement,
  options: GridFieldOptions,
): GridFieldRunner {
  const ctx = canvas.getContext('2d')
  const scratch = document.createElement('canvas')
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const fineQuery = window.matchMedia('(pointer: fine)')

  let field: GridField | null = null
  let buffers: PaintBuffers | null = null
  let rowGain: Float32Array | null = null
  let dpr = 1
  let palettes = readPalettes()

  let hasShapes = false
  let shapesDirty = true
  let lastShapeScan = 0

  // Reloj de la estructura: emerge desde `condenseFrom` y se disuelve desde `leavingAt`.
  let condenseFrom = 0
  let condenseTau = options.introTauMs
  let leavingAt: number | null = null
  let leaveFrom = 0
  let lastCondense = 0
  let sweep: Sweep | null = { start: 0, ms: options.introMs, reveal: true }

  // Escenario de sprites. Solo se cachean las máscaras del sprite ACTUAL.
  let stage: Stage | null = null
  let stageStart = 0
  let pending: Stage | null = null
  let switching: { from: number; at: number } | null = null
  let lastAlpha = 0
  let spriteIndex = -1
  let spriteCycle = -1
  const masks = new Map<number, SpriteMask>()
  let maskCols = 0
  let maskRows = 0

  let pointer: FieldPointer | null = null

  let raf = 0
  let running = false
  let destroyed = false
  let lastTick = 0
  let pageVisible = document.visibilityState !== 'hidden'
  let reduced = motionQuery.matches
  // Una webfont que aún no cargó se rasterizaría con la de respaldo y esa máscara
  // quedaría cacheada: no se rasteriza texto hasta que las fuentes estén.
  let fontsReady = !('fonts' in document)

  function readRgb(name: string, fallback: Rgb): Rgb {
    const raw = getComputedStyle(canvas).getPropertyValue(name).trim()
    const [r = NaN, g = NaN, b = NaN] = raw.split(/[\s,]+/).map(Number)
    return [r, g, b].every(Number.isFinite) ? [r, g, b] : fallback
  }

  function readPalettes(): Palettes {
    return {
      base: levelStyles(readRgb('--grid-field-rgb', FALLBACK_RGB)),
      accent: levelStyles(readRgb('--grid-field-accent-rgb', FALLBACK_ACCENT)),
    }
  }

  function resetMasks(): void {
    masks.clear()
    maskCols = 0
    maskRows = 0
  }

  function measure(): void {
    const box = host.getBoundingClientRect()
    if (box.width < 1 || box.height < 1) {
      field = null
      buffers = null
      return
    }
    dpr = Math.min(window.devicePixelRatio || 1, options.maxDpr)
    canvas.width = Math.floor(box.width * dpr)
    canvas.height = Math.floor(box.height * dpr)
    field = createField({
      width: box.width,
      height: box.height,
      ...fieldGeometryFor(box.width, box.height, options.maxCells),
      maxOpacity: options.maxOpacity,
    })
    buffers = createPaintBuffers(field)
    rowGain = new Float32Array(field.rows)
    resetMasks()
    shapesDirty = true
    paintStill()
  }

  function scanShapes(): void {
    shapesDirty = false
    if (!field) return
    const origin = host.getBoundingClientRect()
    const rects: ShapeRect[] = []
    for (const node of document.querySelectorAll(`[${SHAPE_ATTRIBUTE}]`)) {
      const r = node.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      if (r.right < origin.left || r.left > origin.right) continue
      if (r.bottom < origin.top || r.top > origin.bottom) continue
      rects.push({
        x: r.left - origin.left,
        y: r.top - origin.top,
        w: r.width,
        h: r.height,
        accent: node.getAttribute(SHAPE_ATTRIBUTE) === 'accent',
      })
    }
    markShapes(field, rects)
    hasShapes = rects.length > 0
  }

  function condenseAt(now: number): number {
    if (leavingAt !== null) return leaveFrom * (1 - clamp((now - leavingAt) / options.leaveMs))
    if (!hasShapes) return 0
    return options.restCondense * rising(now - condenseFrom, condenseTau)
  }

  function sweepGain(now: number): Float32Array | null {
    if (!sweep || !rowGain) return null
    if (sweep.start === 0) sweep.start = now
    if (sweepRows(rowGain, (now - sweep.start) / sweep.ms, sweep.reveal)) return rowGain
    sweep = null
    return null
  }

  // ─── Sprites ───────────────────────────────────────────────────────────────

  function currentSprite(): Sprite | null {
    if (!stage) return null
    const program = stage.program
    return program.kind === 'hold' ? program.sprite : (program.pool[spriteIndex] ?? null)
  }

  function clockOf(sprite: Sprite | null) {
    return { frameCount: sprite?.frames.length ?? 0, frameMs: sprite?.frameMs ?? 0 }
  }

  function envelopeAt(now: number): SpriteEnvelope {
    if (!stage) return NO_SPRITE
    const elapsed = now - stageStart
    const program = stage.program
    if (program.kind === 'hold') {
      return holdEnvelope(elapsed, clockOf(program.sprite), options.fadeMs)
    }
    let envelope = loopEnvelope(elapsed, clockOf(currentSprite()), program.timeline)
    if (envelope.cycle >= 0 && envelope.cycle !== spriteCycle) {
      spriteCycle = envelope.cycle
      // El primer sprite del pool abre siempre; después, al azar sin repetir.
      spriteIndex = spriteIndex < 0 ? 0 : randomSpriteIndex(program.pool.length, spriteIndex)
      resetMasks()
      envelope = loopEnvelope(elapsed, clockOf(currentSprite()), program.timeline)
    }
    return envelope
  }

  function enterStage(next: Stage | null, now: number): void {
    stage = next
    stageStart = now
    spriteIndex = -1
    spriteCycle = -1
    switching = null
    pending = null
    resetMasks()
  }

  function placeSprite(frameIndex: number): SpritePlacement | null {
    const sprite = currentSprite()
    const frame = frameIndex >= 0 ? sprite?.frames[frameIndex] : undefined
    if (!field || !stage || !sprite || frame === undefined) return null
    const origin = host.getBoundingClientRect()
    const r = stage.target.getBoundingClientRect()
    const box = spriteBoxFor(field, {
      x: r.left - origin.left,
      y: r.top - origin.top,
      w: r.width,
      h: r.height,
    })
    if (!box || !boxOnField(field, box)) return null
    // Mover la caja es gratis (cambia el desplazamiento); cambiarle el tamaño obliga a re-rasterizar.
    if (box.cols !== maskCols || box.rows !== maskRows) {
      masks.clear()
      maskCols = box.cols
      maskRows = box.rows
    }
    let mask = masks.get(frameIndex)
    if (!mask) {
      if (typeof frame === 'string' && !fontsReady) return null
      const built = rasteriseFrame(scratch, field, box, frame, sprite, options.font)
      if (!built) return null
      masks.set(frameIndex, built)
      mask = built
    }
    return { mask, col0: box.col0, row0: box.row0, accent: stage.accent }
  }

  function spriteFrame(now: number): { placement: SpritePlacement | null; textAlpha: number } {
    let envelope = envelopeAt(now)
    let alpha = envelope.textAlpha
    if (switching) {
      const fade = Math.max(1, options.fadeMs * switching.from)
      alpha = Math.min(alpha, switching.from * (1 - (now - switching.at) / fade))
      if (alpha <= 0) {
        enterStage(pending, now)
        envelope = envelopeAt(now)
        alpha = envelope.textAlpha
      }
    }
    lastAlpha = alpha
    if (alpha <= 0.01) return { placement: null, textAlpha: 0 }
    return { placement: placeSprite(envelope.frameIndex), textAlpha: alpha }
  }

  // ─── Loop ──────────────────────────────────────────────────────────────────

  function tick(now: number): void {
    raf = requestAnimationFrame(tick)
    if (now - lastTick < 1000 / options.fps - 2) return
    const dt = lastTick === 0 ? 0 : Math.min((now - lastTick) / 1000, 0.1)
    lastTick = now
    if (!field || !buffers || !ctx) return
    if (condenseFrom === 0) condenseFrom = now

    if (shapesDirty || now - lastShapeScan > 1000) {
      scanShapes()
      lastShapeScan = now
    }

    const condense = condenseAt(now)
    lastCondense = condense
    const { placement, textAlpha } = spriteFrame(now)
    flickerCells(field, { dt, chance: options.chance, condense })
    paintField(
      ctx,
      field,
      {
        phase: { condense, textAlpha, presence: 1 },
        sprite: placement,
        rowGain: sweepGain(now),
        pointer,
        dt,
      },
      buffers,
      palettes,
      dpr,
    )
  }

  /** Movimiento reducido: un único cuadro quieto, repintado solo cuando algo cambia. */
  function paintStill(): void {
    if (destroyed || running || !reduced || !field || !buffers || !ctx) return
    scanShapes()
    const condense = hasShapes ? options.restCondense : 0
    // Un cuadro quieto también para los sprites: el primero del pool, sin animar.
    let placement: SpritePlacement | null = null
    if (stage) {
      if (stage.program.kind === 'loop' && spriteIndex < 0) spriteIndex = 0
      lastAlpha = 1
      placement = placeSprite(0)
    }
    paintField(
      ctx,
      field,
      {
        phase: { condense, textAlpha: placement ? 1 : 0, presence: 1 },
        sprite: placement,
        rowGain: null,
        pointer: null,
        dt: 0,
      },
      buffers,
      palettes,
      dpr,
    )
  }

  function sync(): void {
    const want = !destroyed && pageVisible && !reduced
    if (want && !running) {
      running = true
      lastTick = 0
      raf = requestAnimationFrame(tick)
    } else if (!want && running) {
      running = false
      cancelAnimationFrame(raf)
    }
    paintStill()
  }

  // ─── Suscripciones ─────────────────────────────────────────────────────────
  const resizeObserver = new ResizeObserver(() => measure())
  resizeObserver.observe(host)

  const onVisibility = () => {
    pageVisible = document.visibilityState !== 'hidden'
    sync()
  }
  document.addEventListener('visibilitychange', onVisibility)

  const onMotion = () => {
    reduced = motionQuery.matches
    if (reduced) pointer = null
    sync()
  }
  motionQuery.addEventListener('change', onMotion)

  let stillQueued = false
  const queueStill = () => {
    if (running || stillQueued) return
    stillQueued = true
    requestAnimationFrame(() => {
      stillQueued = false
      paintStill()
    })
  }
  const onScroll = () => {
    shapesDirty = true
    queueStill()
  }
  window.addEventListener('scroll', onScroll, { passive: true, capture: true })

  // El fondo tiene pointer-events: none, así que el puntero se escucha en window.
  const onPointer = (event: PointerEvent) => {
    if (!options.pointer || reduced || !fineQuery.matches || event.pointerType !== 'mouse') return
    pointer = {
      x: event.clientX,
      y: event.clientY,
      radius: POINTER_RADIUS,
      strength: POINTER_STRENGTH,
    }
  }
  const onPointerOut = (event: PointerEvent) => {
    if (!event.relatedTarget) pointer = null
  }
  window.addEventListener('pointermove', onPointer, { passive: true })
  document.addEventListener('pointerout', onPointerOut)

  const onTheme = () => {
    palettes = readPalettes()
    paintStill()
  }
  const themeObserver = new MutationObserver(onTheme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme'],
  })

  const onFonts = () => {
    fontsReady = true
    resetMasks()
    queueStill()
  }
  if ('fonts' in document) {
    void document.fonts.ready.then(onFonts)
    document.fonts.addEventListener('loadingdone', onFonts)
  }

  if (reduced) sweep = null
  measure()
  sync()

  return {
    setStage(next) {
      if (next === stage) {
        // Volver al escenario que se estaba desvaneciendo: se cancela la salida.
        switching = null
        pending = null
        return
      }
      if (switching && next === pending) return
      const now = performance.now()
      if (reduced || lastAlpha <= 0.01) {
        enterStage(next, now)
        paintStill()
        return
      }
      pending = next
      switching ??= { from: lastAlpha, at: now }
    },
    rescan() {
      shapesDirty = true
      queueStill()
    },
    leave() {
      if (reduced) return
      leaveFrom = lastCondense
      leavingAt = performance.now()
    },
    enter() {
      shapesDirty = true
      leavingAt = null
      if (reduced) {
        queueStill()
        return
      }
      condenseFrom = performance.now()
      condenseTau = options.enterTauMs
      sweep = { start: 0, ms: options.enterMs, reveal: false }
    },
    destroy() {
      destroyed = true
      running = false
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      themeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      motionQuery.removeEventListener('change', onMotion)
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('pointerout', onPointerOut)
      if ('fonts' in document) document.fonts.removeEventListener('loadingdone', onFonts)
    },
  }
}
