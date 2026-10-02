import {
  buildSpriteMask,
  fieldStep,
  type FieldRect,
  type GridField,
  type SpriteMask,
} from './grid-field'
import type { Sprite, SpriteFrame } from './sprites'

/** Caja del sprite alineada a la grilla, en celdas del campo. */
export interface SpriteBox {
  col0: number
  row0: number
  cols: number
  rows: number
}

export interface SpriteFont {
  family: string
  weight: number
}

/** Bajo este tamaño (en celdas) ningún sprite se lee: mejor no dibujarlo. */
const MIN_BOX_CELLS = 8

/** El rect de un elemento (px relativos al campo) convertido a una caja de celdas enteras. */
export function spriteBoxFor(field: GridField, rect: FieldRect): SpriteBox | null {
  const step = fieldStep(field)
  const cols = Math.round(rect.w / step)
  const rows = Math.round(rect.h / step)
  if (cols < MIN_BOX_CELLS || rows < MIN_BOX_CELLS) return null
  return { col0: Math.round(rect.x / step), row0: Math.round(rect.y / step), cols, rows }
}

export function boxOnField(field: GridField, box: SpriteBox): boolean {
  return (
    box.col0 + box.cols > 0 &&
    box.col0 < field.cols &&
    box.row0 + box.rows > 0 &&
    box.row0 < field.rows
  )
}

/**
 * Convierte un cuadro en la cobertura que el campo muestrea. Se dibuja en blanco
 * sobre un canvas fuera de pantalla del tamaño de la CAJA (no del viewport: leer
 * menos píxeles es lo que abarata `getImageData`) y se promedia por celda.
 */
export function rasteriseFrame(
  scratch: HTMLCanvasElement,
  field: GridField,
  box: SpriteBox,
  frame: SpriteFrame,
  sprite: Sprite,
  font: SpriteFont,
): SpriteMask | null {
  const step = fieldStep(field)
  const width = box.cols * step
  const height = box.rows * step
  // Asignar width/height limpia el canvas aunque el valor no cambie: solo si cambió.
  if (scratch.width !== width) scratch.width = width
  if (scratch.height !== height) scratch.height = height
  const ctx = scratch.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.clearRect(0, 0, width, height)

  if (typeof frame === 'string') {
    const size = fontSizeFor(ctx, sprite, font, width, height)
    ctx.font = `${font.weight} ${size}px ${font.family}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    // Trazo además de relleno: los glifos de símbolos son líneas finísimas que
    // ningún peso engrosa, y solas caen bajo el piso del muestreo.
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = size * 0.05
    ctx.lineJoin = 'round'
    ctx.strokeText(frame, width / 2, height * 0.5)
    ctx.fillText(frame, width / 2, height * 0.5)
  } else {
    ctx.save()
    frame(ctx, width, height, font.family)
    ctx.restore()
  }
  return buildSpriteMask(ctx.getImageData(0, 0, width, height), box.cols, box.rows, step)
}

/**
 * Tamaño según el cuadro MÁS ANCHO del sprite, no el que se dibuja: escalar por
 * cuadro hace que un sprite que se "tipea" bombee de tamaño en cada vuelta.
 */
function fontSizeFor(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  font: SpriteFont,
  width: number,
  height: number,
): number {
  ctx.font = `${font.weight} 100px ${font.family}`
  let widest = 1
  for (const frame of sprite.frames) {
    if (typeof frame !== 'string') continue
    widest = Math.max(widest, ctx.measureText(frame).width)
  }
  return Math.min((100 * width * 0.86) / widest, height * (sprite.textScale ?? 0.38))
}
