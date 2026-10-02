/**
 * Lo que mide si un sprite se lee (no es estilo): una celda mide 6 px en
 * escritorio y 3 px en móvil, así que cada glifo recibe un puñado de ellas.
 * Palabras de hasta ~22 caracteres y bloques sólidos se leen; un emoji cae como
 * una mancha (su detalle vive en el color, y el campo solo lee cobertura).
 */

/** Dibujo sobre un canvas: se pinta en blanco, el campo solo lee el canal ALFA. */
export type SpriteDraw = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fontFamily: string,
) => void

/** Texto, o un dibujo cuando la forma no debe depender de una fuente. */
export type SpriteFrame = string | SpriteDraw

export interface Sprite {
  frames: readonly SpriteFrame[]
  /** Cuánto se sostiene cada cuadro. Los bloques se MIRAN, las palabras se LEEN. */
  frameMs: number
  /** Alto máximo del texto como fracción del alto de la caja (por defecto 0,38). */
  textScale?: number
}

/** Medio segundo alcanza para leer dos o tres palabras. */
export const WORD_MS = 500

/**
 * El siguiente sprite al azar, nunca el que acaba de sonar: una repetición
 * inmediata es el único resultado que se lee como roto y no como azar.
 * @param exclude índice recién usado, o -1 si no ha sonado ninguno.
 * @returns -1 si el pool está vacío.
 */
export function randomSpriteIndex(
  total: number,
  exclude: number,
  random: () => number = Math.random,
): number {
  if (total <= 0) return -1
  if (total === 1) return 0
  if (exclude < 0 || exclude >= total) return Math.floor(random() * total)
  const roll = Math.floor(random() * (total - 1))
  return roll >= exclude ? roll + 1 : roll
}
