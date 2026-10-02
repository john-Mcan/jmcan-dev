/**
 * Los relojes del campo, como funciones PURAS del tiempo transcurrido: se testean
 * sin canvas y sin requestAnimationFrame.
 */

export interface SpriteClock {
  frameCount: number
  /** Cuánto se sostiene un cuadro del sprite. */
  frameMs: number
}

export interface SpriteEnvelope {
  textAlpha: number
  /** Cuadro a dibujar, o -1 si no suena ningún sprite. */
  frameIndex: number
  /** Ciclo en curso (solo `loop`); -1 antes del primero. */
  cycle: number
}

/** Un pool que suena en ciclos: aparece, se sostiene y calla hasta el siguiente. */
export interface LoopTimeline {
  /** Espera antes del primer sprite. */
  firstMs: number
  /** Período entre el inicio de un sprite y el del siguiente. */
  everyMs: number
  /** Cuánto dura un sprite en pantalla (debe ser < everyMs). */
  spriteMs: number
  fadeMs: number
}

export const LOOP_DEFAULTS: LoopTimeline = {
  firstMs: 600,
  everyMs: 7000,
  spriteMs: 4600,
  fadeMs: 260,
}

export const NO_SPRITE: SpriteEnvelope = { textAlpha: 0, frameIndex: -1, cycle: -1 }

export function loopEnvelope(
  elapsed: number,
  clock: SpriteClock,
  timeline: LoopTimeline,
): SpriteEnvelope {
  const since = elapsed - timeline.firstMs
  if (since < 0 || timeline.everyMs <= 0) return NO_SPRITE
  const cycle = Math.floor(since / timeline.everyMs)
  const local = since - cycle * timeline.everyMs
  if (local > timeline.spriteMs || clock.frameCount <= 0) return { ...NO_SPRITE, cycle }
  const fade = Math.max(1, timeline.fadeMs)
  return {
    textAlpha: Math.min(clamp(local / fade), clamp((timeline.spriteMs - local) / fade)),
    frameIndex: frameAt(local, clock),
    cycle,
  }
}

/** Un sprite sostenido mientras dure el escenario: entra con fade y se queda. */
export function holdEnvelope(elapsed: number, clock: SpriteClock, fadeMs: number): SpriteEnvelope {
  if (clock.frameCount <= 0 || elapsed < 0) return NO_SPRITE
  return {
    textAlpha: clamp(elapsed / Math.max(1, fadeMs)),
    frameIndex: frameAt(elapsed, clock),
    cycle: 0,
  }
}

function frameAt(local: number, clock: SpriteClock): number {
  return clock.frameMs > 0 ? Math.floor(local / clock.frameMs) % clock.frameCount : 0
}

/**
 * La estructura emerge de forma ASINTÓTICA: nada sabe cuánto falta, y una rampa
 * hacia un plazo inventado se lee mecánica.
 */
export function rising(elapsed: number, tauMs: number): number {
  if (elapsed <= 0) return 0
  return tauMs <= 0 ? 1 : 1 - Math.exp(-elapsed / tauMs)
}

/**
 * Barrido de escaneo de arriba hacia abajo. Llena `out` con la ganancia de cada
 * fila: una banda brillante en la línea y, si `reveal`, nada por debajo de ella
 * (así aparece el campo al cargar). Devuelve false cuando el barrido terminó.
 */
export function sweepRows(out: Float32Array, progress: number, reveal: boolean): boolean {
  if (progress >= 1) return false
  const rows = out.length
  const band = Math.max(6, rows * 0.12)
  const line = clamp(progress) * (rows + band * 2) - band
  const sigma = band / 3
  for (let row = 0; row < rows; row++) {
    const d = line - row
    const edge = Math.exp(-(d * d) / (2 * sigma * sigma))
    const base = reveal ? clamp(0.5 + d / band) : 1
    out[row] = base * (1 + 1.4 * edge)
  }
  return true
}

export function clamp(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}
