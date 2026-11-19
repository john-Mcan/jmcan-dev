/**
 * Sprites DIBUJADOS: formas que ninguna línea de caracteres puede hacer.
 *
 * Reglas para cualquier dibujo nuevo (docs/grid-field-extending.md §3.1):
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

type Point = [number, number]

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

/** 0 → 1 suavizado entre los extremos; fuera de [0, 1], fijo. */
function ease(x: number): number {
  const t = Math.max(0, Math.min(1, x))
  return t * t * (3 - 2 * t)
}

/** Ruido determinista por cuadro: el loop debe verse igual en cada vuelta. */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// ─── Glifos de proyectos ─────────────────────────────────────────────────────

/** Orbit (Fandoms): un núcleo con dos discos que lo orbitan, como un planeta con satélites. */
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

/** Hasta dónde la punta traza el círculo, y desde dónde la cola lo borra. */
const LOOP_DRAWN = 0.5
const LOOP_ERASE = 0.68

/**
 * Loop (Revra): una flecha circular que se traza sola hasta cerrar el círculo, late
 * una vez y se borra desde la cola. El loop cierra: en turn → 1 la cola alcanza a la
 * punta, que quedó arriba, donde empieza la vuelta siguiente.
 */
function closingLoop(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const top = -Math.PI / 2
  const head = top + ease(turn / LOOP_DRAWN) * TAU
  const tail = top + ease((turn - LOOP_ERASE) / (1 - LOOP_ERASE)) * TAU
  const pulse =
    turn > LOOP_DRAWN && turn < LOOP_ERASE
      ? Math.sin((Math.PI * (turn - LOOP_DRAWN)) / (LOOP_ERASE - LOOP_DRAWN))
      : 0
  const radius = unit * 0.3 * (1 + 0.06 * pulse)
  const width = stroke(unit, 0.07 * (1 + 0.4 * pulse))

  // El recorrido, tenue: la forma se lee aunque el arco todavía sea corto.
  ctx.lineWidth = width
  ctx.strokeStyle = shade(0.16)
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, TAU)
  ctx.stroke()

  if (head - tail > 0.01) {
    ctx.strokeStyle = shade(0.92)
    ctx.beginPath()
    ctx.arc(cx, cy, radius, tail, head)
    ctx.stroke()
  }

  // La punta de flecha mira en el sentido del giro (horario en el canvas).
  const [nx, ny] = [Math.cos(head), Math.sin(head)]
  const [dx, dy] = [-ny, nx]
  const px = cx + nx * radius
  const py = cy + ny * radius
  const size = unit * 0.15 * (1 + 0.25 * pulse)
  ctx.fillStyle = shade(0.95)
  ctx.beginPath()
  ctx.moveTo(px + dx * size * 0.7, py + dy * size * 0.7)
  ctx.lineTo(px - dx * size * 0.35 + nx * size * 0.6, py - dy * size * 0.35 + ny * size * 0.6)
  ctx.lineTo(px - dx * size * 0.35 - nx * size * 0.6, py - dy * size * 0.35 - ny * size * 0.6)
  ctx.closePath()
  ctx.fill()
}

const EQ_BARS = 5
/** Vueltas de cada barra por loop: enteras, para que el loop cierre. */
const EQ_FREQ: readonly number[] = [4, 6, 5, 7, 4]
const EQ_PHASE: readonly number[] = [0.3, 2.1, 4.0, 1.2, 5.3]
/** Dos rondas por loop, cada una con su ganadora. */
const EQ_WINNERS: readonly number[] = [1, 3]

/**
 * Ecualizador (NEX): las barras suben y bajan con la música; en cada ronda una gana,
 * crece por encima del resto y las demás bajan, como el tema que eligió la audiencia.
 */
function equalizer(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const barWidth = stroke(unit, 0.1)
  const gap = stroke(unit, 0.055)
  const left = cx - (EQ_BARS * barWidth + (EQ_BARS - 1) * gap) / 2
  const floor = cy + unit * 0.33
  const tallest = unit * 0.66
  const round = Math.min(EQ_WINNERS.length - 1, Math.floor(turn * EQ_WINNERS.length))
  const local = turn * EQ_WINNERS.length - round
  const win = ease((local - 0.45) / 0.2) * (1 - ease((local - 0.82) / 0.18))
  for (let i = 0; i < EQ_BARS; i++) {
    const a = TAU * (EQ_FREQ[i] ?? 4) * turn + (EQ_PHASE[i] ?? 0)
    const dance = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(a)) + 0.12 * Math.sin(2 * a + 1)
    const winner = i === EQ_WINNERS[round]
    const level = dance + ((winner ? 1 : 0.1) - dance) * win
    const height = Math.max(tallest * level, barWidth * 0.5)
    ctx.fillStyle = shade(winner ? 0.7 + 0.28 * win : 0.7 - 0.3 * win)
    ctx.fillRect(left + i * (barWidth + gap), floor - height, barWidth, height)
  }
}

const PATH_STEPS = 6
/** Hasta dónde camina la punta; el resto del loop, la meta se enciende y el rastro se apaga. */
const PATH_WALK = 0.7

/**
 * Senda (orientame.cl): pasos que avanzan de un punto a otro, hacia una meta. Los de
 * atrás se apagan mientras avanzan los de adelante: nada queda guardado.
 */
function steppingPath(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  // Una S de abajo a la izquierda hacia arriba a la derecha (Bézier cúbica).
  const p0: Point = [cx - unit * 0.34, cy + unit * 0.32]
  const p1: Point = [cx + unit * 0.34, cy + unit * 0.34]
  const p2: Point = [cx - unit * 0.34, cy - unit * 0.3]
  const p3: Point = [cx + unit * 0.3, cy - unit * 0.27]
  const at = (s: number, k: 0 | 1): number => {
    const r = 1 - s
    return r * r * r * p0[k] + 3 * r * r * s * p1[k] + 3 * r * s * s * p2[k] + s * s * s * p3[k]
  }

  // Era el glifo más tenue (la mitad de luz que el resto): la meta y los pasos
  // apagados tienen un piso que se lee en ámbar sobre negro.
  const goal = Math.max(0, turn - PATH_WALK)
  const glow = turn >= PATH_WALK ? Math.exp(-goal * 9) : 0
  ctx.strokeStyle = shade(0.7 + 0.3 * glow)
  ctx.lineWidth = stroke(unit, 0.065 + 0.015 * glow)
  ctx.beginPath()
  ctx.arc(at(1, 0), at(1, 1), unit * (0.1 + 0.02 * glow), 0, TAU)
  ctx.stroke()

  // La punta sigue avanzando después de la meta: así el rastro termina de apagarse.
  const headAt = (turn / PATH_WALK) * PATH_STEPS
  const size = stroke(unit, 0.12)
  for (let k = 0; k < PATH_STEPS; k++) {
    const behind = headAt - k
    const lit = behind >= 0 ? Math.exp(-behind / 2.2) : 0
    ctx.fillStyle = shade(0.4 + 0.6 * lit)
    const s = (k + 0.4) / (PATH_STEPS + 0.4)
    ctx.fillRect(at(s, 0) - size / 2, at(s, 1) - size / 2, size, size)
  }
}

/** Fases de un cambio de canal: estática, imagen, corte. Dos canales por loop. */
const ZAP_FRAMES = 50
const ZAP_CHANNEL = 0.5
const ZAP_STATIC = 0.1
const ZAP_TUNE = 0.06
const ZAP_CUT = 0.08
const ZAP_BARS: readonly number[] = [0.95, 0.75, 0.55, 0.35, 0.18]

/**
 * Cambio de canal (Chucao): un televisor con antenas. Estática que se ordena en una
 * imagen, un corte como el de un tubo que se apaga, y estática otra vez.
 */
function channelZap(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const frame = Math.round(turn * ZAP_FRAMES)
  const width = unit * 0.76
  const height = unit * 0.54
  const left = cx - width / 2
  const top = cy - height / 2 + unit * 0.08
  const line = stroke(unit, 0.04)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = line
  ctx.strokeStyle = shade(0.9)
  ctx.strokeRect(left, top, width, height)
  ctx.strokeStyle = shade(0.55)
  ctx.lineWidth = stroke(unit, 0.035)
  ctx.beginPath()
  ctx.moveTo(cx - unit * 0.17, top - unit * 0.2)
  ctx.lineTo(cx, top - line)
  ctx.lineTo(cx + unit * 0.13, top - unit * 0.22)
  ctx.stroke()

  const inset = line * 1.5
  const inner = {
    left: left + inset,
    top: top + inset,
    width: width - inset * 2,
    height: height - inset * 2,
  }
  const channel = turn < ZAP_CHANNEL ? 0 : 1
  const t = (turn - channel * ZAP_CHANNEL) / ZAP_CHANNEL
  const tuned = ease((t - ZAP_STATIC) / ZAP_TUNE)
  const cutStart = 1 - ZAP_CUT * 2
  if (t >= cutStart) {
    // El tubo se apaga: la imagen se aplasta en una línea y la línea se cierra en un punto.
    const p = (t - cutStart) / (ZAP_CUT * 2)
    const h = Math.max(inner.height * (1 - ease(p / 0.6)), line)
    const w = inner.width * (1 - ease((p - 0.6) / 0.4))
    ctx.fillStyle = shade(0.95)
    ctx.fillRect(cx - w / 2, inner.top + (inner.height - h) / 2, w, h)
    return
  }
  if (tuned < 1) {
    const block = stroke(unit, 0.055)
    const cols = Math.max(1, Math.floor(inner.width / block))
    const rows = Math.max(1, Math.floor(inner.height / block))
    const bw = inner.width / cols
    const bh = inner.height / rows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const noise = hash(frame * 131 + r * 17 + c * 3.1)
        if (noise < 0.35) continue
        ctx.fillStyle = shade(noise * 0.85 * (1 - tuned))
        ctx.fillRect(inner.left + c * bw, inner.top + r * bh, bw, bh)
      }
    }
  }
  if (tuned <= 0) return
  if (channel === 0) {
    // Carta de ajuste: barras verticales de luz decreciente.
    const bar = inner.width / ZAP_BARS.length
    ZAP_BARS.forEach((alpha, i) => {
      ctx.fillStyle = shade(alpha * tuned)
      ctx.fillRect(inner.left + i * bar, inner.top, bar, inner.height)
    })
  } else {
    // Un sol sobre el horizonte.
    ctx.fillStyle = shade(0.45 * tuned)
    ctx.fillRect(inner.left, inner.top + inner.height * 0.68, inner.width, inner.height * 0.32)
    ctx.fillStyle = shade(0.95 * tuned)
    ctx.beginPath()
    ctx.arc(cx, inner.top + inner.height * 0.44, unit * 0.11, 0, TAU)
    ctx.fill()
  }
}

/**
 * Una burbuja de chat: un rectángulo redondeado con la cola abajo, a la izquierda
 * (`side` -1) o a la derecha (1). Es un solo camino: dos rellenos con alfa se sumarían
 * donde se tocan y la cola quedaría con una costura más clara.
 */
function bubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  side: -1 | 1,
  unit: number,
): void {
  const r = Math.min(unit * 0.07, width / 2, height / 2)
  const tail = unit * 0.05
  ctx.save()
  if (side === 1) {
    ctx.translate(x * 2 + width, 0)
    ctx.scale(-1, 1)
  }
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + r, r)
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r)
  ctx.lineTo(x - tail, y + height)
  ctx.lineTo(x, y + height - tail)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** Fases de la conversación: queda a la vista, sube y se va, llega otra y el agente escribe y responde. */
const CHAT_HOLD = 0.14
const CHAT_GONE = 0.28
const CHAT_ASK = 0.3
const CHAT_TYPE = 0.46
const CHAT_REPLY = 0.72

/**
 * Conversación (vriza): el mensaje del cliente, tenue, a la izquierda; el agente
 * escribe (tres puntos) y su respuesta crece desde ahí. El loop cierra con la
 * conversación completa: en turn = 0 se ve entera, y es el cuadro quieto.
 */
function conversation(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const askBubble = (alpha: number, dy: number): void => {
    ctx.fillStyle = shade(0.6 * alpha)
    bubble(ctx, cx - unit * 0.4, cy - unit * 0.36 + dy, unit * 0.54, unit * 0.26, -1, unit)
  }
  /** Crece desde los puntos de escribir hasta la respuesta, anclada abajo a la derecha. */
  const reply = (alpha: number, grow: number, dy: number): void => {
    const width = unit * (0.42 + 0.16 * grow)
    const height = unit * (0.2 + 0.12 * grow)
    const right = cx + unit * 0.4
    const bottom = cy + unit * 0.32 + dy
    ctx.fillStyle = shade((0.4 + 0.55 * grow) * alpha)
    bubble(ctx, right - width, bottom - height, width, height, 1, unit)
    if (grow >= 1) return
    // Los tres puntos; separados por al menos dos celdas, también en la fila de un teléfono.
    const radius = Math.max(unit * 0.03, 3)
    const step = Math.max(unit * 0.1, radius * 2 + 6)
    ctx.fillStyle = shade(0.95 * alpha * (1 - grow))
    for (let k = -1; k <= 1; k++) {
      const hop = Math.max(0, Math.sin(TAU * (turn * 8 - (k + 1) * 0.12))) * unit * 0.025
      ctx.beginPath()
      ctx.arc(right - width / 2 + k * step, bottom - height / 2 - hop, radius, 0, TAU)
      ctx.fill()
    }
  }

  if (turn < CHAT_GONE) {
    // La conversación anterior sube, como en un chat, y se apaga.
    const leave = ease((turn - CHAT_HOLD) / (CHAT_GONE - CHAT_HOLD))
    askBubble(1 - leave, -leave * unit * 0.14)
    reply(1 - leave, 1, -leave * unit * 0.14)
    return
  }
  const ask = ease((turn - CHAT_ASK) / 0.08)
  if (ask > 0) askBubble(ask, (1 - ask) * unit * 0.06)
  const typing = ease((turn - CHAT_TYPE) / 0.05)
  if (typing > 0) reply(typing, ease((turn - CHAT_REPLY) / 0.1), 0)
}

const ESCROW_MILESTONES = 3
/** Cuándo baja cada hito a la barra; antes, el depósito espera completo entre los corchetes. */
const ESCROW_RELEASE: readonly number[] = [0.12, 0.32, 0.52]
const ESCROW_DROP = 0.16
/** Desde aquí la barra se apaga y cae el depósito siguiente. */
const ESCROW_REFILL = 0.82

/**
 * Hitos en garantía (extan): tres bloques, el depósito, guardados entre corchetes como
 * en su marca `[▪]`. Cada hito baja y se aplana en su tramo de la barra de pago; con la
 * barra llena, se apaga y cae el depósito del acuerdo siguiente.
 */
function milestoneEscrow(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const top = cy - unit * 0.32
  const bottom = cy + unit * 0.06
  const reach = unit * 0.36
  const serif = unit * 0.08
  ctx.lineWidth = stroke(unit, 0.05)
  ctx.strokeStyle = shade(0.85)
  ctx.beginPath()
  for (const side of [-1, 1]) {
    ctx.moveTo(cx + side * (reach - serif), top)
    ctx.lineTo(cx + side * reach, top)
    ctx.lineTo(cx + side * reach, bottom)
    ctx.lineTo(cx + side * (reach - serif), bottom)
  }
  ctx.stroke()

  const size = unit * 0.14
  const gap = unit * 0.05
  const left = cx - (ESCROW_MILESTONES * size + (ESCROW_MILESTONES - 1) * gap) / 2
  const rest = (top + bottom) / 2 - size / 2
  const barTop = cy + unit * 0.24
  const barHeight = stroke(unit, 0.08)
  const refill = turn >= ESCROW_REFILL
  for (let k = 0; k < ESCROW_MILESTONES; k++) {
    const x = left + k * (size + gap)
    ctx.fillStyle = shade(0.22)
    ctx.fillRect(x, barTop, size, barHeight)
    if (refill) {
      // La barra se apaga mientras el depósito nuevo cae, escalonado, desde arriba.
      const fade = ease((turn - ESCROW_REFILL) / 0.1)
      ctx.fillStyle = shade(0.95 * (1 - fade))
      ctx.fillRect(x, barTop, size, barHeight)
      const fall = ease((turn - ESCROW_REFILL - k * 0.03) / (1 - ESCROW_REFILL - 0.06))
      ctx.fillStyle = shade(0.75 * fall)
      ctx.fillRect(x, cy - unit * 0.5 + (rest - cy + unit * 0.5) * fall, size, size)
      continue
    }
    const drop = ease((turn - (ESCROW_RELEASE[k] ?? 0)) / ESCROW_DROP)
    ctx.fillStyle = shade(0.75 + 0.2 * drop)
    ctx.fillRect(x, rest + (barTop - rest) * drop, size, size + (barHeight - size) * drop)
  }
}

/** Una cápsula centrada en (x, y), para los ojos del orbe de Apolo. */
function pill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const left = x - width / 2
  const top = y - height / 2
  const r = Math.min(width, height) / 2
  ctx.beginPath()
  ctx.moveTo(left + r, top)
  ctx.arcTo(left + width, top, left + width, top + height, r)
  ctx.arcTo(left + width, top + height, left, top + height, r)
  ctx.arcTo(left, top + height, left, top, r)
  ctx.arcTo(left, top, left + width, top, r)
  ctx.closePath()
  ctx.fill()
}

/** Pulso suavizado en [start, end]: sube a 1 en el tramo central y vuelve a 0. */
function windowPulse(turn: number, start: number, end: number, ramp = 0.28): number {
  if (turn <= start || turn >= end) return 0
  const p = (turn - start) / (end - start)
  if (p < ramp) return ease(p / ramp)
  if (p > 1 - ramp) return ease((1 - p) / ramp)
  return 1
}

/** Un parpadeo en [start, end]: devuelve cuánto se cierra el ojo (0 abierto, 1 cerrado). */
function blinkAt(turn: number, start: number, end: number): number {
  if (turn <= start || turn >= end) return 0
  const p = (turn - start) / (end - start)
  return Math.sin(p * Math.PI)
}

/**
 * Orbe (Apolo): la esfera central con sus ojos en cápsula y gestos en espera
 * (respiración lenta, parpadeo, mirada a un lado, doble parpadeo y mirada al otro).
 * En turn = 0 mira de frente con los ojos abiertos, que es el cuadro quieto.
 */
function apoloOrb(ctx: CanvasRenderingContext2D, box: Box, turn: number): void {
  const { cx, cy, unit } = squareIn(box)
  const breathe = (1 - Math.cos(turn * TAU)) / 2
  const radius = unit * 0.36 * (1 + 0.025 * breathe)
  const diameter = radius * 2
  const orbY = cy - unit * 0.018 * breathe

  // Cuerpo de la esfera: luz interior suave con brillo que deriva despacio y borde nítido.
  const driftX = cx + Math.cos(turn * TAU) * radius * 0.22 - radius * 0.14
  const driftY = orbY + Math.sin(turn * TAU) * radius * 0.16 - radius * 0.2
  const fill = ctx.createRadialGradient(driftX, driftY, radius * 0.08, cx, orbY, radius)
  fill.addColorStop(0, shade(0.4))
  fill.addColorStop(0.62, shade(0.24))
  fill.addColorStop(1, shade(0.48))
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(cx, orbY, radius, 0, TAU)
  ctx.fill()

  ctx.lineWidth = stroke(unit, 0.045)
  ctx.strokeStyle = shade(0.92)
  ctx.beginPath()
  ctx.arc(cx, orbY, radius, 0, TAU)
  ctx.stroke()

  // Gestos de la mirada en reposo: mirar a la izquierda, doble parpadeo, mirar a la derecha.
  const lookLeft = windowPulse(turn, 0.24, 0.44)
  const lookRight = windowPulse(turn, 0.64, 0.84)
  const gazeX = (lookRight - lookLeft) * diameter * 0.11
  const gazeY = -diameter * 0.03 - (lookLeft * 0.02 + lookRight * 0.03) * diameter
  const tilt = (lookRight - lookLeft) * 0.055

  const blink = Math.max(
    blinkAt(turn, 0.13, 0.19),
    blinkAt(turn, 0.48, 0.535),
    blinkAt(turn, 0.545, 0.6),
  )

  const eyeW = Math.max(diameter * 0.125, 6)
  const eyeHFull = diameter * 0.25
  const eyeH = Math.max(eyeHFull * (1 - 0.86 * blink), stroke(unit, 0.035))
  const eyeOffset = diameter * 0.155
  const cutout = Math.max(unit * 0.035, 3)

  ctx.save()
  ctx.translate(cx + gazeX, orbY + gazeY)
  ctx.rotate(tilt)

  // Recorte fino alrededor de cada ojo para que destaquen sobre la luz interior del orbe.
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#fff'
  for (const side of [-1, 1]) {
    pill(ctx, side * eyeOffset, 0, eyeW + cutout * 2, eyeH + cutout * 2)
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = shade(0.98)
  for (const side of [-1, 1]) {
    pill(ctx, side * eyeOffset, 0, eyeW, eyeH)
  }
  ctx.restore()
}

// ─── Del resto del sitio ─────────────────────────────────────────────────────

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

export const APOLO_ORB = drawnFrames(64, apoloOrb)
export const ORBITING_DISCS = drawnFrames(30, orbitingDiscs)
export const CLOSING_LOOP = drawnFrames(40, closingLoop)
export const EQUALIZER = drawnFrames(48, equalizer)
export const STEPPING_PATH = drawnFrames(36, steppingPath)
export const CHANNEL_ZAP = drawnFrames(ZAP_FRAMES, channelZap)
export const CONVERSATION = drawnFrames(56, conversation)
export const MILESTONE_ESCROW = drawnFrames(60, milestoneEscrow)
export const ENVELOPE = drawnFrames(32, envelope)
