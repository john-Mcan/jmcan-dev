/**
 * Sprites DIBUJADOS: formas que ninguna línea de caracteres puede hacer.
 *
 * Reglas para cualquier dibujo nuevo (docs/grid-field.md §9):
 *  1. Nada fuera del área recibida: el campo no recorta, simplemente lo pierde.
 *  2. Ningún trazo más fino que dos celdas (~12 px en escritorio, ~6 px en móvil).
 *  3. Medidas relativas a `Math.min(width, height)`.
 * Se pinta en blanco: el campo solo lee el canal ALFA y el color lo pone él.
 */

import type { SpriteDraw } from './sprites'

type Painter = (ctx: CanvasRenderingContext2D, box: Box, turn: number, fontFamily: string) => void

interface Box {
  width: number
  height: number
}

const TAU = Math.PI * 2

/** Abierto arriba (`i / count`): un loop que también dibujara turn=1 tartamudearía una vez por vuelta. */
export function drawnFrames(count: number, paint: Painter): readonly SpriteDraw[] {
  return Array.from(
    { length: count },
    (_, i): SpriteDraw =>
      (ctx, width, height, fontFamily) =>
        paint(ctx, { width, height }, i / count, fontFamily),
  )
}

function shade(alpha: number): string {
  return `rgba(255,255,255,${Math.max(0, Math.min(1, alpha)).toFixed(3)})`
}

/** Dimensionado por el lado CORTO: el área puede ser vertical u horizontal. */
function squareIn(box: Box): { cx: number; cy: number; unit: number } {
  return { cx: box.width / 2, cy: box.height / 2, unit: Math.min(box.width, box.height) }
}

/** Grosor de trazo con piso absoluto: en las cajas chicas de móvil, 2 celdas = 6 px. */
function stroke(unit: number, fraction: number): number {
  return Math.max(unit * fraction, 6)
}

// ─── De la guía ──────────────────────────────────────────────────────────────

const NODES: readonly (readonly [number, number])[] = [
  [0.28, 0.5],
  [0.44, 0.24],
  [0.44, 0.5],
  [0.44, 0.76],
  [0.6, 0.34],
  [0.6, 0.66],
  [0.76, 0.5],
]
const EDGES: readonly (readonly [number, number])[] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 4],
  [2, 4],
  [2, 5],
  [3, 5],
  [4, 6],
  [5, 6],
]

function networkPulse(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const at = (node: readonly [number, number]): [number, number] => [
    cx + ((node[0] - 0.52) / 0.48) * unit * 0.42,
    cy + ((node[1] - 0.5) / 0.52) * unit * 0.42,
  ]
  const head = 0.2 + turn * 0.72
  ctx.lineCap = 'round'
  for (const [a, b] of EDGES) {
    const from = NODES[a]
    const to = NODES[b]
    if (!from || !to) continue
    const lit = Math.max(0, 1 - Math.abs(head - (from[0] + to[0]) / 2) * 6)
    ctx.strokeStyle = shade(0.22 + 0.78 * lit)
    ctx.lineWidth = stroke(unit, 0.045 + 0.025 * lit)
    ctx.beginPath()
    ctx.moveTo(...at(from))
    ctx.lineTo(...at(to))
    ctx.stroke()
  }
  for (const node of NODES) {
    const lit = Math.max(0, 1 - Math.abs(head - node[0]) * 7)
    ctx.fillStyle = shade(0.3 + 0.7 * lit)
    ctx.beginPath()
    ctx.arc(...at(node), unit * 0.05 * (1 + 0.5 * lit), 0, TAU)
    ctx.fill()
  }
}

function breathingRing(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const ring = unit * 0.36
  const breath = Math.sin(turn * TAU)
  ctx.strokeStyle = shade(0.92)
  ctx.lineWidth = stroke(unit, 0.05 + 0.022 * breath)
  ctx.beginPath()
  ctx.arc(cx, cy, ring * (1 + 0.1 * breath), 0, TAU)
  ctx.stroke()
  ctx.fillStyle = shade(0.55 - 0.35 * breath)
  ctx.beginPath()
  ctx.arc(cx, cy, ring * (0.42 - 0.16 * breath), 0, TAU)
  ctx.fill()
}

function orbitingDiscs(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  ctx.fillStyle = shade(0.9)
  ctx.beginPath()
  ctx.arc(cx, cy, unit * 0.11, 0, TAU)
  ctx.fill()
  for (const offset of [0, 0.5]) {
    const angle = (turn + offset) * TAU
    // La profundidad es la única pista posible: el campo lee cobertura, así que
    // un disco detrás del núcleo solo puede ser más tenue y chico, nunca ocultarse.
    const depth = (Math.sin(angle) + 1) / 2
    ctx.fillStyle = shade(0.35 + 0.6 * depth)
    ctx.beginPath()
    ctx.arc(
      cx + Math.cos(angle) * unit * 0.42,
      cy + Math.sin(angle) * unit * 0.17,
      unit * (0.045 + 0.03 * depth),
      0,
      TAU,
    )
    ctx.fill()
  }
}

// ─── Nuevos ──────────────────────────────────────────────────────────────────

const CUBE_VERTICES: readonly (readonly [number, number, number])[] = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
]
const CUBE_EDGES: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
]
const CUBE_TILT = 0.52

/** Cubo de alambre. Un cuarto de vuelta basta: el cubo es simétrico y el loop cierra. */
function wireCube(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const yaw = turn * (Math.PI / 2) + Math.PI / 8
  const [sy, cyaw] = [Math.sin(yaw), Math.cos(yaw)]
  const [st, ct] = [Math.sin(CUBE_TILT), Math.cos(CUBE_TILT)]
  const scale = unit * 0.23
  const points = CUBE_VERTICES.map(([x, y, z]) => {
    const rx = x * cyaw + z * sy
    const rz = -x * sy + z * cyaw
    const ry = y * ct - rz * st
    const depth = y * st + rz * ct
    return { x: cx + rx * scale, y: cy + ry * scale, depth }
  })
  ctx.lineCap = 'round'
  ctx.lineWidth = stroke(unit, 0.045)
  for (const [a, b] of CUBE_EDGES) {
    const p = points[a]
    const q = points[b]
    if (!p || !q) continue
    // Profundidad como intensidad: las aristas de atrás quedan tenues, nunca ocultas.
    const front = ((p.depth + q.depth) / 2 + 1.7) / 3.4
    ctx.strokeStyle = shade(0.3 + 0.7 * front)
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(q.x, q.y)
    ctx.stroke()
  }
}

const MERIDIANS = 4

/** Globo de meridianos que gira. Gira lo que separa dos meridianos: el loop cierra. */
function globe(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const radius = unit * 0.4
  const width = stroke(unit, 0.04)
  ctx.lineWidth = width
  ctx.strokeStyle = shade(0.95)
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, TAU)
  ctx.stroke()

  for (let k = 0; k < MERIDIANS; k++) {
    const lambda = ((k + turn) / MERIDIANS) * Math.PI
    const rx = Math.abs(Math.sin(lambda)) * radius
    const depth = Math.cos(lambda)
    // La mitad del lado de sin(λ) mira hacia nosotros si cos(λ) > 0; la otra, al revés.
    const side = Math.sin(lambda) >= 0 ? 1 : -1
    for (const half of [1, -1]) {
      const facing = half === side ? depth : -depth
      ctx.strokeStyle = shade(0.28 + 0.62 * ((facing + 1) / 2))
      ctx.beginPath()
      const start = half === 1 ? -Math.PI / 2 : Math.PI / 2
      ctx.ellipse(cx, cy, Math.max(rx, width / 2), radius, 0, start, start + Math.PI)
      ctx.stroke()
    }
  }
  for (const lat of [-0.5, 0, 0.5]) {
    const y = cy + Math.sin(lat) * radius
    const half = Math.cos(lat) * radius
    ctx.strokeStyle = shade(lat === 0 ? 0.75 : 0.45)
    ctx.beginPath()
    ctx.moveTo(cx - half, y)
    ctx.lineTo(cx + half, y)
    ctx.stroke()
  }
}

/** Osciloscopio: una onda que viaja dentro de una ventana, con eje tenue. */
function scope(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const half = unit * 0.44
  const amplitude = unit * 0.26
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = shade(0.25)
  ctx.lineWidth = stroke(unit, 0.025)
  ctx.beginPath()
  ctx.moveTo(cx - half, cy)
  ctx.lineTo(cx + half, cy)
  ctx.stroke()

  ctx.strokeStyle = shade(0.95)
  ctx.lineWidth = stroke(unit, 0.045)
  ctx.beginPath()
  const steps = 64
  for (let s = 0; s <= steps; s++) {
    const u = s / steps
    const envelope = Math.pow(Math.sin(Math.PI * u), 0.8)
    const y = cy - Math.sin(TAU * (2 * u - turn)) * amplitude * envelope
    const x = cx - half + u * half * 2
    if (s === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

const BLIPS: readonly (readonly [number, number])[] = [
  [0.7, 0.62],
  [2.4, 0.35],
  [4.1, 0.78],
]

/** Radar: barrido con estela y ecos que se encienden cuando el haz pasa. */
function radar(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const radius = unit * 0.42
  ctx.lineCap = 'round'
  ctx.lineWidth = stroke(unit, 0.035)
  ctx.strokeStyle = shade(0.6)
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, TAU)
  ctx.stroke()
  ctx.strokeStyle = shade(0.3)
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.55, 0, TAU)
  ctx.stroke()

  const angle = turn * TAU
  for (let k = 0; k < 8; k++) {
    const a = angle - k * 0.1
    ctx.strokeStyle = shade(0.95 * Math.pow(1 - k / 8, 1.6))
    ctx.lineWidth = stroke(unit, 0.04)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius)
    ctx.stroke()
  }
  for (const [theta, distance] of BLIPS) {
    const since = (((angle - theta) % TAU) + TAU) % TAU
    const lit = Math.exp(-since * 1.1)
    ctx.fillStyle = shade(0.2 + 0.8 * lit)
    ctx.beginPath()
    ctx.arc(
      cx + Math.cos(theta) * radius * distance,
      cy + Math.sin(theta) * radius * distance,
      Math.max(unit * 0.04, 4),
      0,
      TAU,
    )
    ctx.fill()
  }
}

/** Sobre cuya solapa se abre y se cierra. */
function envelope(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const width = unit * 0.72
  const height = unit * 0.48
  const left = cx - width / 2
  const right = cx + width / 2
  const top = cy - height / 2 + unit * 0.06
  const bottom = top + height
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = stroke(unit, 0.045)
  ctx.strokeStyle = shade(0.95)
  ctx.strokeRect(left, top, width, height)

  // 0 → 1 → 0: el vértice de la solapa va de adentro del sobre a arriba de él.
  const open = (1 - Math.cos(turn * TAU)) / 2
  ctx.strokeStyle = shade(0.95 - 0.3 * open)
  ctx.beginPath()
  ctx.moveTo(left, top)
  ctx.lineTo(cx, top + height * 0.55 - open * height * 0.95)
  ctx.lineTo(right, top)
  ctx.stroke()

  ctx.strokeStyle = shade(0.35)
  ctx.lineWidth = stroke(unit, 0.03)
  ctx.beginPath()
  ctx.moveTo(left, bottom)
  ctx.lineTo(cx - width * 0.1, top + height * 0.6)
  ctx.moveTo(right, bottom)
  ctx.lineTo(cx + width * 0.1, top + height * 0.6)
  ctx.stroke()
}

/** Ruido determinista por cuadro: el glitch debe verse igual en cada vuelta del loop. */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const GLITCH_BANDS = 6

/** Texto con bandas horizontales desplazadas en algunos cuadros. */
export function glitchText(text: string, count: number, scale = 0.62): readonly SpriteDraw[] {
  return drawnFrames(count, (ctx, box, turn, fontFamily) => {
    const frame = Math.round(turn * count)
    ctx.font = `400 100px ${fontFamily}`
    const widest = Math.max(1, ctx.measureText(text).width)
    const size = Math.min((100 * box.width * 0.86) / widest, box.height * scale)
    ctx.font = `400 ${size}px ${fontFamily}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = size * 0.05
    ctx.lineJoin = 'round'
    const glitching = hash(frame) > 0.55
    const top = box.height / 2 - size * 0.55
    const bandHeight = (size * 1.1) / GLITCH_BANDS
    for (let b = 0; b < GLITCH_BANDS; b++) {
      const offset = glitching ? (hash(frame * 13 + b) - 0.5) * size * 0.3 : 0
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, top + b * bandHeight, box.width, bandHeight + 0.5)
      ctx.clip()
      ctx.strokeText(text, box.width / 2 + offset, box.height / 2)
      ctx.fillText(text, box.width / 2 + offset, box.height / 2)
      ctx.restore()
    }
  })
}

export const NETWORK_PULSE = drawnFrames(24, networkPulse)
export const BREATHING_RING = drawnFrames(28, breathingRing)
export const ORBITING_DISCS = drawnFrames(30, orbitingDiscs)
export const WIRE_CUBE = drawnFrames(36, wireCube)
export const GLOBE = drawnFrames(32, globe)
export const SCOPE = drawnFrames(30, scope)
export const RADAR = drawnFrames(40, radar)
export const ENVELOPE = drawnFrames(32, envelope)
