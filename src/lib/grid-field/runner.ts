import {
  createField,
  createPaintBuffers,
  fieldStep,
  fieldGeometryFor,
  flickerCells,
  levelStyles,
  markShapes,
  paintField,
  FIELD_DEFAULTS,
  type GridField,
  type PaintBuffers,
  type Palettes,
  type Rgb,
  type ShapeRect,
  type SpriteMask,
  type SpritePlacement,
} from './grid-field'
import type { CellRect, LiveContext, LiveSource } from './live'
import { boxOnField, rasteriseFrame, spriteBoxFor, type SpriteFont } from './sprite-raster'
import type { Sprite } from './sprites'
import { clamp, holdEnvelope, NO_SPRITE, rising, sweepRows, type SpriteEnvelope } from './timeline'

/** Marca un elemento como forma; con el valor `accent`, pinta con la paleta de señal. */
export const SHAPE_ATTRIBUTE = 'data-grid-shape'

/**
 * Islas de un escenario vivo: el contenido dentro de su caja, donde la grilla no
 * imprime (un sprite detrás de texto le quita contraste). Las formas también lo son.
 */
const ISLAND_SELECTOR = '[data-grid-island], [' + SHAPE_ATTRIBUTE + ']'

/**
 * Dónde y qué imprime el campo. La caja es el rect de `target`, re-medido cada
 * cuadro: el sprite sigue al elemento cuando hay scroll o es sticky.
 */
export interface Stage {
  target: Element
  program: { kind: 'hold'; sprite: Sprite } | { kind: 'live'; source: LiveSource }
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
  /** Cómo entra el campo al montar (ver `Intro`). */
  intro: Intro
  /** Barrido que revela el campo al montar. */
  introMs: number
  introTauMs: number
  /** El fundido de entrada (`intro: 'fade'`). */
  fadeInMs: number
  /** Barrido y re-condensación al llegar a una página nueva. */
  enterMs: number
  enterTauMs: number
  /** Cuánto tarda la estructura en disolverse al salir de una página. */
  leaveMs: number
  /** Fade de entrada/salida de los sprites. */
  fadeMs: number
  font: SpriteFont
}

export const GRID_FIELD_DEFAULTS: Omit<GridFieldOptions, 'font'> = {
  fps: 30,
  maxOpacity: FIELD_DEFAULTS.maxOpacity,
  chance: FIELD_DEFAULTS.chance,
  maxCells: 90_000,
  maxDpr: 2,
  restCondense: 0.5,
  intro: 'sweep',
  introMs: 1100,
  introTauMs: 900,
  fadeInMs: 1200,
  enterMs: 650,
  enterTauMs: 450,
  leaveMs: 180,
  fadeMs: 260,
}

export interface GridFieldRunner {
  /** Cambia el escenario de sprites; el actual se desvanece antes de que entre el nuevo. */
  setStage(stage: Stage | null): void
  /** Vuelve a medir las formas ahora (p. ej. después de cambiar un `data-grid-shape`). */
  rescan(): void
  /** Navegación saliente: la estructura se disuelve en ruido. */
  leave(): void
  /** Navegación entrante: barrido de escaneo (o fundido) y la estructura nueva emerge. */
  enter(intro?: Intro): void
  destroy(): void
}

/**
 * Cómo entra el campo: `sweep`, un barrido de arriba hacia abajo; `fade`, un
 * fundido del campo entero (ruido y escenario) que espera al escenario, para que
 * entre con él ya listo y no a medio llegar.
 */
export type Intro = 'sweep' | 'fade'

/** Lo más que el fundido espera al escenario: una página sin escenario no queda a oscuras. */
const FADE_WAIT_MS = 2500

/** Un escenario vivo no tiene cuadros: suena como un sprite sostenido de uno solo. */
const LIVE_CLOCK = { frameCount: 1, frameMs: 0 }

const FALLBACK_RGB: Rgb = [255, 255, 255]
const FALLBACK_ACCENT: Rgb = [255, 176, 0]

/**
 * `<html data-grid-cell="<paso>:<punto>">` fuerza la celda (en px) en escritorio,
 * para probar otros tamaños; lo pone `/lab`. Sin el atributo, la de siempre.
 */
const CELL_ATTRIBUTE = 'data-grid-cell'

function forcedCell(): { step: number; square: number } | null {
  const [step = 0, square = 0] = (document.documentElement.getAttribute(CELL_ATTRIBUTE) ?? '')
    .split(':')
    .map(Number)
  return step >= 2 && square >= 1 && square < step ? { step, square } : null
}

/** Las paletas del tema, de las variables CSS que ve `element`. */
export function readPalettes(element: Element): Palettes {
  const style = getComputedStyle(element)
  const readRgb = (name: string, fallback: Rgb): Rgb => {
    const raw = style.getPropertyValue(name).trim()
    const [r = NaN, g = NaN, b = NaN] = raw.split(/[\s,]+/).map(Number)
    return [r, g, b].every(Number.isFinite) ? [r, g, b] : fallback
  }
  const spread = Number.parseFloat(style.getPropertyValue('--grid-field-spread'))
  return {
    base: levelStyles(readRgb('--grid-field-rgb', FALLBACK_RGB)),
    accent: levelStyles(readRgb('--grid-field-accent-rgb', FALLBACK_ACCENT)),
    spread: Number.isFinite(spread) ? clamp(spread) : 0,
  }
}

interface Sweep {
  start: number
  ms: number
  reveal: boolean
}

/** `asked`: cuándo se pidió; `start`: cuándo empezó a subir (0, esperando al escenario). */
interface Fade {
  asked: number
  start: number
  ms: number
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

  let field: GridField | null = null
  let buffers: PaintBuffers | null = null
  let rowGain: Float32Array | null = null
  let dpr = 1
  let palettes = readPalettes(canvas)

  let hasShapes = false
  let shapesDirty = true
  let lastShapeScan = 0

  // Reloj de la estructura: emerge desde `condenseFrom` y se disuelve desde `leavingAt`.
  let condenseFrom = 0
  let condenseTau = options.introTauMs
  let leavingAt: number | null = null
  let leaveFrom = 0
  let lastCondense = 0
  let sweep: Sweep | null =
    options.intro === 'sweep' ? { start: 0, ms: options.introMs, reveal: true } : null
  let fade: Fade | null =
    options.intro === 'fade' ? { asked: 0, start: 0, ms: options.fadeInMs } : null

  // Escenario de sprites. Solo se cachean las máscaras del sprite ACTUAL.
  let stage: Stage | null = null
  let stageStart = 0
  let pending: Stage | null = null
  let switching: { from: number; at: number } | null = null
  let lastAlpha = 0
  const masks = new Map<number, SpriteMask>()
  let maskCols = 0
  let maskRows = 0

  // Escenarios vivos: lo que el runner les cuenta en cada cuadro (un solo objeto).
  const islands: CellRect[] = []
  let islandsDirty = true
  let islandsKey = ''
  const live: LiveContext = {
    dt: 0,
    pointerCol: Number.NaN,
    pointerRow: Number.NaN,
    islands,
    islandsVersion: 0,
    cellPx: 6,
  }
  let pointerX = Number.NaN
  let pointerY = Number.NaN

  let raf = 0
  let running = false
  let destroyed = false
  let lastTick = 0
  let pageVisible = document.visibilityState !== 'hidden'
  let reduced = motionQuery.matches
  // Una webfont que aún no cargó se rasterizaría con la de respaldo y esa máscara
  // quedaría cacheada: no se rasteriza texto hasta que las fuentes estén.
  let fontsReady = !('fonts' in document)

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
      ...fieldGeometryFor(box.width, box.height, options.maxCells, forcedCell()),
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
    islandsDirty = true
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

  /** Cuánto se ve el campo entero: 1, salvo durante el fundido de entrada. */
  function presenceAt(now: number): number {
    if (!fade) return 1
    if (fade.asked === 0) fade.asked = now
    if (fade.start === 0) {
      const ready = stage !== null && switching === null
      if (!ready && now - fade.asked < FADE_WAIT_MS) return 0
      fade.start = now
    }
    const t = (now - fade.start) / fade.ms
    if (t >= 1) {
      fade = null
      return 1
    }
    return t * t * (3 - 2 * t)
  }

  // ─── Sprites ───────────────────────────────────────────────────────────────

  function currentSprite(): Sprite | null {
    return stage?.program.kind === 'hold' ? stage.program.sprite : null
  }

  function clockOf(sprite: Sprite | null) {
    return { frameCount: sprite?.frames.length ?? 0, frameMs: sprite?.frameMs ?? 0 }
  }

  function envelopeAt(now: number): SpriteEnvelope {
    if (!stage) return NO_SPRITE
    const program = stage.program
    const clock = program.kind === 'hold' ? clockOf(program.sprite) : LIVE_CLOCK
    return holdEnvelope(now - stageStart, clock, options.fadeMs)
  }

  function enterStage(next: Stage | null, now: number): void {
    stage = next
    // Si el fundido de entrada lo espera, entra ya encendido: el fundido es su entrada.
    stageStart = fade?.start === 0 ? now - options.fadeMs : now
    switching = null
    pending = null
    islandsDirty = true
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

  function cellRectOf(r: DOMRect, frame: DOMRect, step: number): CellRect {
    const col = Math.floor((r.left - frame.left) / step)
    const row = Math.floor((r.top - frame.top) / step)
    return {
      col,
      row,
      cols: Math.ceil((r.right - frame.left) / step) - col,
      rows: Math.ceil((r.bottom - frame.top) / step) - row,
    }
  }

  /** Islas, relativas a la caja: no cambian con el scroll, solo con el layout. */
  function scanIslands(target: Element, frame: DOMRect, step: number): void {
    islandsDirty = false
    islands.length = 0
    for (const node of target.querySelectorAll(ISLAND_SELECTOR)) {
      const r = node.getBoundingClientRect()
      if (r.width >= 1 && r.height >= 1) islands.push(cellRectOf(r, frame, step))
    }
    // Se re-miden en cada scroll, pero la versión sube solo si algo cambió: cambiarla
    // re-marca las islas del escenario (y, quieto, lo vuelve a asentar).
    const key = JSON.stringify(islands)
    if (key !== islandsKey) {
      islandsKey = key
      live.islandsVersion++
    }
  }

  function placeLive(dt: number, still: boolean): SpritePlacement | null {
    if (!field || !stage || stage.program.kind !== 'live') return null
    const origin = host.getBoundingClientRect()
    const r = stage.target.getBoundingClientRect()
    const box = spriteBoxFor(field, {
      x: r.left - origin.left,
      y: r.top - origin.top,
      w: r.width,
      h: r.height,
    })
    if (!box || !boxOnField(field, box)) return null
    const step = fieldStep(field)
    if (islandsDirty) scanIslands(stage.target, r, step)
    live.dt = dt
    live.cellPx = step
    live.pointerCol = (pointerX - origin.left) / step - box.col0
    live.pointerRow = (pointerY - origin.top) / step - box.row0
    const source = stage.program.source
    const mask = still
      ? source.still(box.cols, box.rows, live)
      : source.frame(box.cols, box.rows, live)
    return mask ? { mask, col0: box.col0, row0: box.row0, accent: stage.accent } : null
  }

  function spriteFrame(
    now: number,
    dt: number,
  ): { placement: SpritePlacement | null; textAlpha: number } {
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
    const placement =
      stage?.program.kind === 'live' ? placeLive(dt, false) : placeSprite(envelope.frameIndex)
    return { placement, textAlpha: alpha }
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
    const { placement, textAlpha } = spriteFrame(now, dt)
    // Después del escenario: el fundido lo espera y arranca en el cuadro en que entra.
    const presence = presenceAt(now)
    flickerCells(field, { dt, chance: options.chance, condense })
    paintField(
      ctx,
      field,
      {
        phase: { condense, textAlpha, presence },
        sprite: placement,
        rowGain: sweepGain(now),
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
    // Un cuadro quieto también para los sprites: el primero, sin animar.
    let placement: SpritePlacement | null = null
    if (stage) {
      lastAlpha = 1
      placement = stage.program.kind === 'live' ? placeLive(0, true) : placeSprite(0)
    }
    paintField(
      ctx,
      field,
      {
        phase: { condense, textAlpha: placement ? 1 : 0, presence: 1 },
        sprite: placement,
        rowGain: null,
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

  // Solo la POSICIÓN del puntero: los escenarios vivos la huelen, nada la dibuja.
  const onPointer = (event: PointerEvent) => {
    pointerX = event.clientX
    pointerY = event.clientY
  }
  const onPointerGone = (event: PointerEvent) => {
    if (event.type !== 'pointerleave' && event.pointerType !== 'touch') return
    pointerX = Number.NaN
    pointerY = Number.NaN
  }
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('pointerdown', onPointer, { passive: true })
  window.addEventListener('pointerup', onPointerGone, { passive: true })
  window.addEventListener('pointercancel', onPointerGone, { passive: true })
  document.documentElement.addEventListener('pointerleave', onPointerGone)

  const onTheme = (records: MutationRecord[]) => {
    if (records.some((record) => record.attributeName === CELL_ATTRIBUTE)) measure()
    palettes = readPalettes(canvas)
    paintStill()
  }
  const themeObserver = new MutationObserver(onTheme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style', 'data-theme', CELL_ATTRIBUTE],
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

  if (reduced) {
    sweep = null
    fade = null
  }
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
      // Mientras el fundido de entrada espera, nada se ve: el cambio es inmediato.
      if (reduced || lastAlpha <= 0.01 || fade?.start === 0) {
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
    enter(intro = 'sweep') {
      shapesDirty = true
      leavingAt = null
      if (reduced) {
        queueStill()
        return
      }
      condenseFrom = performance.now()
      condenseTau = options.enterTauMs
      // El fundido parte de cero: la página nueva entra a oscuras, con su escenario.
      sweep = intro === 'sweep' ? { start: 0, ms: options.enterMs, reveal: false } : null
      fade = intro === 'fade' ? { asked: 0, start: 0, ms: options.fadeInMs } : null
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
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('pointerup', onPointerGone)
      window.removeEventListener('pointercancel', onPointerGone)
      document.documentElement.removeEventListener('pointerleave', onPointerGone)
      if ('fonts' in document) document.fonts.removeEventListener('loadingdone', onFonts)
    },
  }
}
