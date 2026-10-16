/**
 * Pantallas propias: un sprite sostenido que se dibuja en un canvas DENTRO de su
 * caja, no en el campo fijo. Baja con la página como una imagen.
 *
 * Las usa un teléfono, donde las cajas no son sticky y se mueven con el scroll: el
 * campo fijo se repinta a 30 fps desde el hilo principal, el scroll va por su
 * cuenta (en el compositor) y el sprite quedaba atrás, entrecortado, sobre todo en
 * iOS. Pueden sonar varias a la vez: cada fila de proyectos a la vista muestra su
 * glifo; la activa en ámbar (estado) y el resto en la paleta de base, más tenue.
 *
 * Se ven como el campo: la misma celda, los mismos niveles y el mismo piso con
 * parpadeo del sprite (`spriteLight`). Sin el ruido de fondo: detrás ya está el
 * campo. Solo suenan las que están a la vista; con movimiento reducido, un cuadro
 * quieto (el primero).
 */

import {
  dotSize,
  fieldGeometryFor,
  fieldStep,
  levelOf,
  spriteLight,
  type Palettes,
  type SpriteMask,
} from './grid-field'
import { GRID_FIELD_DEFAULTS, readPalettes } from './runner'
import { rasteriseFrame, type SpriteFont } from './sprite-raster'
import type { Sprite } from './sprites'

export interface Screen {
  /** En ámbar (la activa) o en la paleta de base, más tenue. */
  setAccent(on: boolean): void
}

export interface Screens {
  add(box: HTMLElement, sprite: Sprite, accent: boolean): Screen
  /** Quita todas las pantallas (al salir de la página o al cambiar de ancho). */
  clear(): void
}

/** Luz de una pantalla que no es la activa. */
const IDLE = 0.5
/** Empieza a sonar un poco antes de entrar a la vista. */
const AHEAD = '25% 0px'
/** Bajo este tamaño (en celdas) un sprite no se lee, como en el campo. */
const MIN_CELLS = 8
const LEVELS = 24
const SKIP = 255

interface Entry {
  box: HTMLElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  sprite: Sprite
  accent: boolean
  visible: boolean
  width: number
  height: number
  cols: number
  rows: number
  masks: Map<number, SpriteMask>
  /** Ruido por celda (0–1): el parpadeo del sprite. */
  noise: Float32Array
  levels: Uint8Array
  /** Celdas por re-sortear que quedaron del cuadro anterior. */
  carry: number
  start: number
}

export function createScreens(font: SpriteFont): Screens {
  const scratch = document.createElement('canvas')
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const counts = new Int32Array(LEVELS)
  const entries: Entry[] = []
  let palettes: Palettes = readPalettes(document.documentElement)
  let geometry = fieldGeometryFor(
    window.innerWidth,
    window.innerHeight,
    GRID_FIELD_DEFAULTS.maxCells,
  )
  let dpr = 1
  let raf = 0
  let last = 0

  function measure(entry: Entry): void {
    geometry = fieldGeometryFor(window.innerWidth, window.innerHeight, GRID_FIELD_DEFAULTS.maxCells)
    dpr = Math.min(window.devicePixelRatio || 1, GRID_FIELD_DEFAULTS.maxDpr)
    const step = fieldStep(geometry)
    entry.width = entry.box.clientWidth
    entry.height = entry.box.clientHeight
    entry.canvas.width = Math.round(entry.width * dpr)
    entry.canvas.height = Math.round(entry.height * dpr)
    entry.cols = Math.floor(entry.width / step)
    entry.rows = Math.floor(entry.height / step)
    const n = Math.max(0, entry.cols * entry.rows)
    entry.noise = new Float32Array(n)
    for (let i = 0; i < n; i++) entry.noise[i] = Math.random()
    entry.levels = new Uint8Array(n)
    entry.masks.clear()
  }

  function maskOf(entry: Entry, index: number): SpriteMask | null {
    const cached = entry.masks.get(index)
    if (cached) return cached
    const frame = entry.sprite.frames[index]
    if (frame === undefined) return null
    const box = { col0: 0, row0: 0, cols: entry.cols, rows: entry.rows }
    const mask = rasteriseFrame(scratch, geometry, box, frame, entry.sprite, font)
    if (mask) entry.masks.set(index, mask)
    return mask
  }

  /** Re-sortea una fracción de las celdas por segundo, como el campo. */
  function flicker(entry: Entry, dt: number): void {
    const n = entry.noise.length
    entry.carry += n * GRID_FIELD_DEFAULTS.chance * dt
    const k = Math.floor(entry.carry)
    entry.carry -= k
    for (let j = 0; j < k; j++) entry.noise[(Math.random() * n) | 0] = Math.random()
  }

  function paint(entry: Entry, now: number, dt: number): void {
    const { ctx, cols, rows, levels, noise } = entry
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, entry.width, entry.height)
    if (cols < MIN_CELLS || rows < MIN_CELLS) return
    const { frames, frameMs } = entry.sprite
    const still = motion.matches
    const index = still ? 0 : Math.floor((now - entry.start) / frameMs) % frames.length
    const mask = maskOf(entry, index)
    if (!mask) return
    if (!still) flicker(entry, dt)

    const gain = entry.accent ? 1 : IDLE
    counts.fill(0)
    for (let i = 0; i < levels.length; i++) {
      const glyph = mask.data[i] ?? 0
      const tone =
        glyph > 0 ? levelOf(spriteLight(glyph, still ? 0.5 : (noise[i] ?? 0)) * gain) : -1
      levels[i] = tone < 0 ? SKIP : tone
      if (tone >= 0) counts[tone] = (counts[tone] ?? 0) + 1
    }

    const step = fieldStep(geometry)
    const ox = Math.round(((entry.width - cols * step) / 2) * dpr) / dpr
    const oy = Math.round(((entry.height - rows * step) / 2) * dpr) / dpr
    const styles = entry.accent ? palettes.accent : palettes.base
    for (let tone = 0; tone < LEVELS; tone++) {
      if ((counts[tone] ?? 0) === 0) continue
      ctx.fillStyle = styles[tone] ?? ''
      const size = dotSize(geometry, palettes.spread, tone, true, dpr)
      const inset = Math.round(((size - geometry.square) / 2) * dpr) / dpr
      for (let i = 0; i < levels.length; i++) {
        if (levels[i] !== tone) continue
        const col = (i / rows) | 0
        ctx.fillRect(ox + col * step - inset, oy + (i - col * rows) * step - inset, size, size)
      }
    }
  }

  function tick(now: number): void {
    raf = requestAnimationFrame(tick)
    if (now - last < 1000 / GRID_FIELD_DEFAULTS.fps - 2) return
    const dt = last === 0 ? 0 : Math.min((now - last) / 1000, 0.1)
    last = now
    for (const entry of entries) if (entry.visible) paint(entry, now, dt)
  }

  /** El loop corre solo si alguna pantalla está a la vista; con movimiento reducido, nunca. */
  function sync(): void {
    const want = !motion.matches && entries.some((entry) => entry.visible)
    if (want && raf === 0) {
      last = 0
      raf = requestAnimationFrame(tick)
    } else if (!want && raf !== 0) {
      cancelAnimationFrame(raf)
      raf = 0
    }
    if (motion.matches) {
      const now = performance.now()
      for (const entry of entries) if (entry.visible) paint(entry, now, 0)
    }
  }

  const visibility = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        const entry = entries.find((candidate) => candidate.box === record.target)
        if (entry) entry.visible = record.isIntersecting
      }
      sync()
    },
    { rootMargin: AHEAD },
  )
  const sizes = new ResizeObserver((records) => {
    for (const record of records) {
      const entry = entries.find((candidate) => candidate.box === record.target)
      if (entry) measure(entry)
    }
    sync()
  })
  new MutationObserver(() => {
    palettes = readPalettes(document.documentElement)
    sync()
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  motion.addEventListener('change', sync)

  return {
    add(box, sprite, accent) {
      const canvas = document.createElement('canvas')
      canvas.className = 'screen'
      const ctx = canvas.getContext('2d')
      box.append(canvas)
      if (!ctx) return { setAccent: () => undefined }
      const entry: Entry = {
        box,
        canvas,
        ctx,
        sprite,
        accent,
        visible: false,
        width: 0,
        height: 0,
        cols: 0,
        rows: 0,
        masks: new Map(),
        noise: new Float32Array(0),
        levels: new Uint8Array(0),
        carry: 0,
        start: performance.now(),
      }
      measure(entry)
      entries.push(entry)
      visibility.observe(box)
      sizes.observe(box)
      return {
        setAccent(on) {
          if (entry.accent === on) return
          entry.accent = on
          if (motion.matches && entry.visible) paint(entry, performance.now(), 0)
        },
      }
    },
    clear() {
      for (const entry of entries) entry.canvas.remove()
      entries.length = 0
      visibility.disconnect()
      sizes.disconnect()
      sync()
    },
  }
}
