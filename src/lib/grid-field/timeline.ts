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
}

export const NO_SPRITE: SpriteEnvelope = { textAlpha: 0, frameIndex: -1 }

/** Un sprite sostenido mientras dure el escenario: entra con fade y se queda. */
export function holdEnvelope(elapsed: number, clock: SpriteClock, fadeMs: number): SpriteEnvelope {
  if (clock.frameCount <= 0 || elapsed < 0) return NO_SPRITE
  return {
    textAlpha: clamp(elapsed / Math.max(1, fadeMs)),
    frameIndex: frameAt(elapsed, clock),
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
