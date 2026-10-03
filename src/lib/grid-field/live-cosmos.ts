/**
 * Cosmos: materia que la gravedad junta y un tornado que nace donde colapsa.
 *
 * Miles de partículas parten de un campo casi parejo, con fluctuaciones suaves
 * (más amplias en las escalas grandes). La gravedad las amplifica: la materia
 * deja los vacíos y corre desde los dos lados hasta colapsar en una franja
 * vertical. Ver `gravity.ts`. El lugar de la franja no es azar: el arranque corre
 * la materia hacia un eje elegido, en el espacio libre a la derecha del texto.
 *
 * Esa franja es el eje del tornado: la materia que llega empieza a orbitarla en
 * 3D, vista de costado. Cada partícula tiene una profundidad oculta: se ve su
 * proyección, y la que pasa por delante brilla más que la de atrás. La materia se
 * ordena en hebras helicoidales que rotan juntas: sin hebras, una nube pareja que
 * gira se proyecta siempre igual y el giro no se ve. El embudo es ancho arriba y
 * angosto abajo, y una corriente ascendente sube la materia por las hebras.
 *
 * El flujo no se corta: el núcleo es de baja presión y succiona la materia libre
 * hacia el eje, desde los dos lados. Cada partícula orbita un tiempo al azar (o
 * hasta la cima) y vuelve a nacer lejos del eje, como al principio. Sin eso, la
 * materia libre se agotaba y el tornado moría en segundos; con un tiempo fijo, lo
 * que entró junto salía junto y el tornado latía.
 *
 * El texto aparta la materia que pasa cerca (un empuje de corto alcance) y ahí
 * nunca se pinta. El puntero es una masa (atrae) o un vacío (aparta) para la
 * materia libre, y no deja rastro. Sin DOM.
 *
 * Unidades: celdas finas (ver `fineScale`), segundos.
 */

import type { SpriteMask } from './grid-field'
import {
  accelerate,
  createGravity,
  meshSize,
  move,
  randomDisplacement,
  sampleMesh,
  type Gravity,
  type GravityParams,
  type PointMass,
} from './gravity'
import {
  createPresence,
  fillRects,
  fineScale,
  followPointer,
  scaled,
  scaledRects,
  writeScaledDirect,
  type CellRect,
  type CursorMode,
  type LiveContext,
  type LiveSource,
} from './live'

export interface CosmosOptions {
  /** Se lee en cada cuadro: el laboratorio lo cambia en vivo. */
  cursor: () => CursorMode
  random?: () => number
}

const PARAMS: GravityParams = { strength: 0.5, drag: 0.8, maxSpeed: 25 }
/** Partículas por celda de la caja, y tope. */
const DENSITY = 0.6
const MAX_PARTICLES = 30000
/** Celdas de la caja por celda de la malla (el ablandamiento de la fuerza). */
const MESH_CELL = 2
/**
 * Fluctuaciones iniciales: índice del espectro, cuántas de las ondas más largas en
 * horizontal se silencian, desplazamiento (celdas) y velocidad. Sin silenciarlas,
 * en una caja ancha armaban su propia franja y le ganaban al eje.
 */
const SPECTRUM = -1
const QUIET_WAVES = 4
const DISPLACE = 3
const KICK = 0.5
/** Goteo: fracción de la materia libre que renace en cualquier lugar por segundo. */
const RAIN = 0.01
/**
 * El texto aparta la materia a menos de SHOVE_REACH celdas, con hasta SHOVE
 * celdas/s². Es un empuje local y no un vacío gravitatorio: un vacío, en la caja
 * periódica, dejaba un pozo en el punto más lejano del texto y de su copia (cerca
 * del 80 % del ancho), donde la materia armaba una franja propia junto al tornado.
 */
const SHOVE = 12
const SHOVE_REACH = 5
const ISLAND_MARGIN = 1
/** Luz: densidad (partículas por celda) bajo LOW es vacío; sobre HIGH, plena. */
const LOW = 0.35
const HIGH = 8
const GAIN = 0.85

/**
 * El eje, como fracción del ancho de la caja: AXIS_LANDSCAPE en una apaisada (el
 * medio del espacio libre a la derecha del texto) y AXIS_PORTRAIT en una vertical.
 * El arranque corre la materia hacia él (AXIS_PULL del ancho, como un pozo
 * centrado en el eje), y ahí colapsa la franja: librada al azar, caía en cualquier lugar, a
 * veces al borde, y el tornado nacía lejos de la materia. Es una fracción fija y
 * no sale del texto: el texto se mide antes de que cargue la fuente pixel y
 * después se angosta; el eje se corría y la materia, que ya iba hacia el primero,
 * quedaba con dos atractores.
 */
const AXIS_LANDSCAPE = 0.76
const AXIS_PORTRAIT = 0.62
const AXIS_PULL = 0.06
/**
 * El tornado nace cuando la franja (tres columnas de malla) junta COLLAPSE veces la
 * masa media, o a los FALLBACK_S. Nace sobre la franja real (el pico de materia
 * libre a menos de BAND_SEARCH del eje, fracción del ancho) y, durante FOLLOW_S,
 * la sigue (FOLLOW_TAU_S) mientras sea marcada (BAND_PROMINENCE veces lo parejo):
 * nace antes de que la franja termine de formarse, y quieto quedaba a un costado
 * de ella. El pico se mide con la materia libre, que la del tornado no lo tuerce.
 * El giro crece en SPIN_UP_S.
 */
const COLLAPSE = 4
const BAND_SEARCH = 0.1
const FOLLOW_S = 5
const FOLLOW_TAU_S = 0.5
const BAND_PROMINENCE = 3
const FALLBACK_S = 4
const SPIN_UP_S = 2.5
/** Captura: a qué distancia de la pared del embudo (celdas) y qué fracción de lo que llega por segundo. */
const CAPTURE = 3
const CAPTURE_RATE = 1.5
/**
 * El embudo: radio arriba y abajo (fracción del alto de la caja; arriba, con un
 * tope por el ancho) y cuánto tarda una partícula en sumarse a su hebra.
 */
const FUNNEL_TOP = 0.17
const FUNNEL_TOP_MAX = 0.3
const FUNNEL_BOTTOM = 0.02
const SETTLE_S = 1.2
/** Las hebras: cuántas, cuántas vueltas dan a lo alto de la caja y cuánto se abre cada una (rad). */
const STRANDS = 3
const TWIST = 1.5
const STRAND_SPREAD = 0.25
/** Giro (rad/s). */
const WHIRL = 2.4
/** Succión del núcleo hacia el eje (celdas/s²; con el arrastre, la materia llega a ~1,25 veces eso en celdas/s). */
const INFLOW = 9
/**
 * Corriente ascendente (celdas/s) y dónde termina: la cima (fracción del alto).
 * Cada partícula sube a su ritmo, entre 1 - LIFT_SPREAD y 1 + LIFT_SPREAD veces la
 * corriente: un nudo que entra junto se estira al subir. Subiendo todas igual, el
 * nudo llegaba entero a la cima y renacían miles de golpe, un estallido de la nada.
 */
const UPDRAFT = 5
const LIFT_SPREAD = 0.5
const SUMMIT = 0.03
/** La base serpentea: amplitud (fracción del alto) y velocidad (rad/s). */
const SWAY = 0.035
const SWAY_SPEED = 0.6
/**
 * Cuánto orbita una partícula (s): exponencial de media STAY_S, entre STAY_MIN_S y
 * STAY_MAX_S. Al salir renace a REBIRTH_AWAY del eje, como mínimo (fracción del ancho).
 */
const STAY_S = 8
const STAY_MIN_S = 1.5
const STAY_MAX_S = 25
const REBIRTH_AWAY = 0.15
/**
 * Luz de lo que orbita, por profundidad: adelante FRONT, atrás BACK (fracción de
 * GAIN). Va por partícula, no por densidad: así las hebras se leen nítidas.
 */
const FRONT = 0.95
const BACK = 0.25

/** El puntero: ablandamiento (celdas) e intensidad. */
const POINTER_SOFT = 4
const POINTER_STRENGTH: Record<CursorMode, number> = { attract: 40, repel: -60, off: 0 }
const STILL_STEPS = 150

const TAU = Math.PI * 2

export function createCosmos(options: CosmosOptions): LiveSource {
  const random = options.random ?? Math.random

  let sim: Gravity | null = null
  let mask: SpriteMask | null = null
  let scale = 1
  let cols = 0
  let rows = 0
  /** Partículas por celda de la caja, para pintar. */
  let counts = new Float32Array(0)
  let light = new Float32Array(0)
  let blocked = new Uint8Array(0)
  /** El empuje del texto, por celda de malla (aceleración). */
  let shoveX = new Float32Array(0)
  let shoveY = new Float32Array(0)
  let islandsSeen = -1
  const rects: CellRect[] = []
  let settled: Gravity | null = null
  let settledIslands = -1

  // El tornado: su eje (celdas de la caja), si ya nació, cuánto gira (0–1), cuánto
  // giró (rad) y su reloj.
  let axisX = 0
  let bornAt = 0
  /** Materia libre por columna de la caja: el pico es la franja. */
  let freeColumns = new Float32Array(0)
  let born = false
  let spin = 0
  let turned = 0
  let time = 0
  // El eje y el radio del embudo por fila de la caja, de este cuadro.
  let axisRow = new Float32Array(0)
  let wallRow = new Float32Array(0)
  // Por partícula: si orbita, su fase, la de su hebra, su ángulo de este cuadro y a
  // qué fracción del embudo va.
  let orbiting = new Uint8Array(0)
  let phase = new Float32Array(0)
  let angle = new Float32Array(0)
  let reach = new Float32Array(0)
  let strandPhase = new Float32Array(0)
  let stay = new Float32Array(0)
  let lift = new Float32Array(0)

  const presence = createPresence()
  const pointer: PointMass = { x: 0, y: 0, soft: POINTER_SOFT, strength: 0 }

  /** Renace en un lugar al azar fuera del texto (y, si hay tornado, lejos de su eje), quieta. */
  function respawn(target: Gravity, p: number): void {
    let x = 0
    let y = 0
    const away = born ? REBIRTH_AWAY * cols : 0
    for (let attempt = 0; attempt < 16; attempt++) {
      x = random() * cols
      y = random() * rows
      if (blocked[(x | 0) * rows + (y | 0)] === 1) continue
      if (Math.abs(across(axisX, x)) >= away) break
    }
    target.x[p] = x
    target.y[p] = y
    target.vx[p] = 0
    target.vy[p] = 0
  }

  /**
   * El universo temprano: partículas al azar, corridas por un campo de Zel'dovich
   * (la textura de los filamentos) y hacia el eje (dónde colapsan).
   */
  function begin(target: Gravity): void {
    randomDisplacement(target, SPECTRUM, random, QUIET_WAVES)
    axisX = (cols >= rows ? AXIS_LANDSCAPE : AXIS_PORTRAIT) * cols
    for (let p = 0; p < target.count; p++) {
      const qx = random() * cols
      const qy = random() * rows
      const toward = -Math.sin((TAU * (qx - axisX)) / cols) * AXIS_PULL * cols
      const dx = sampleMesh(target, target.ax, qx, qy) * DISPLACE + toward
      const dy = sampleMesh(target, target.ay, qx, qy) * DISPLACE
      target.x[p] = (((qx + dx) % cols) + cols) % cols
      target.y[p] = (((qy + dy) % rows) + rows) % rows
      target.vx[p] = dx * KICK
      target.vy[p] = dy * KICK
    }
    orbiting.fill(0)
    born = false
    spin = 0
    turned = 0
    time = 0
  }

  function ensure(boxCols: number, boxRows: number, context: LiveContext): Gravity {
    const wanted = fineScale(context.cellPx)
    if (!sim || !mask || mask.cols !== boxCols || mask.rows !== boxRows || scale !== wanted) {
      scale = wanted
      cols = scaled(boxCols, scale)
      rows = scaled(boxRows, scale)
      const n = cols * rows
      const count = Math.min(MAX_PARTICLES, Math.round(n * DENSITY))
      sim = createGravity(cols, rows, meshSize(cols / MESH_CELL), meshSize(rows / MESH_CELL), count)
      mask = { data: new Float32Array(boxCols * boxRows), cols: boxCols, rows: boxRows }
      counts = new Float32Array(n)
      light = new Float32Array(n)
      blocked = new Uint8Array(n)
      freeColumns = new Float32Array(cols)
      shoveX = new Float32Array(sim.meshCols * sim.meshRows)
      shoveY = new Float32Array(sim.meshCols * sim.meshRows)
      axisRow = new Float32Array(rows)
      wallRow = new Float32Array(rows)
      orbiting = new Uint8Array(count)
      phase = new Float32Array(count)
      angle = new Float32Array(count)
      reach = new Float32Array(count)
      strandPhase = new Float32Array(count)
      stay = new Float32Array(count)
      lift = new Float32Array(count)
      islandsSeen = -1
      begin(sim)
    }
    if (islandsSeen !== context.islandsVersion) {
      islandsSeen = context.islandsVersion
      scaledRects(context.islands, ISLAND_MARGIN, scale, rects)
      blocked.fill(0)
      fillRects(blocked, cols, rows, rects)
      markShove(sim)
    }
    return sim
  }

  /**
   * El empuje del texto en la malla: desde el punto más cercano de cada isla hacia
   * afuera, más fuerte cuanto más cerca; adentro, hacia el borde más cercano.
   */
  function markShove(target: Gravity): void {
    const { meshCols, meshRows } = target
    shoveX.fill(0)
    shoveY.fill(0)
    const hx = cols / meshCols
    const hy = rows / meshRows
    for (let c = 0; c < meshCols; c++) {
      const x = (c + 0.5) * hx
      for (let r = 0; r < meshRows; r++) {
        const y = (r + 0.5) * hy
        const i = c * meshRows + r
        for (const rect of rects) {
          const left = rect.col
          const right = rect.col + rect.cols
          const top = rect.row
          const bottom = rect.row + rect.rows
          if (x >= left && x < right && y >= top && y < bottom) {
            const least = Math.min(x - left, right - x, y - top, bottom - y)
            if (least === x - left) shoveX[i] = (shoveX[i] ?? 0) - SHOVE
            else if (least === right - x) shoveX[i] = (shoveX[i] ?? 0) + SHOVE
            else if (least === y - top) shoveY[i] = (shoveY[i] ?? 0) - SHOVE
            else shoveY[i] = (shoveY[i] ?? 0) + SHOVE
            continue
          }
          const dx = x - Math.min(right, Math.max(left, x))
          const dy = y - Math.min(bottom, Math.max(top, y))
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d >= SHOVE_REACH) continue
          const push = (SHOVE * (1 - d / SHOVE_REACH)) / d
          shoveX[i] = (shoveX[i] ?? 0) + dx * push
          shoveY[i] = (shoveY[i] ?? 0) + dy * push
        }
      }
    }
  }

  /**
   * Antes del tornado, espera a que la franja junte la materia y nace sobre ella;
   * después, la sigue un rato, hasta absorberla.
   */
  function watchCollapse(target: Gravity, dt: number): void {
    if (born && time - bornAt > FOLLOW_S) return
    if (!born) {
      const { meshCols, meshRows, density, count } = target
      const center = Math.floor((axisX * meshCols) / cols)
      let band = 0
      for (let dc = -1; dc <= 1; dc++) {
        const c = (center + dc + meshCols) % meshCols
        for (let r = 0; r < meshRows; r++) band += density[c * meshRows + r] ?? 0
      }
      if (band < (COLLAPSE * 3 * count) / meshCols && time < FALLBACK_S) return
      born = true
      bornAt = time
      const peak = bandPeak(target)
      if (Number.isFinite(peak)) axisX = peak
      return
    }
    const peak = bandPeak(target)
    if (!Number.isFinite(peak)) return
    axisX = (axisX + across(axisX, peak) * (1 - Math.exp(-dt / FOLLOW_TAU_S)) + cols) % cols
  }

  /**
   * El pico de materia libre (promediado en 7 columnas) cerca del eje: la franja.
   * NaN si no hay franja marcada.
   */
  function bandPeak(target: Gravity): number {
    freeColumns.fill(0)
    let free = 0
    for (let p = 0; p < target.count; p++) {
      if (orbiting[p] === 1) continue
      const c = (target.x[p] ?? 0) | 0
      freeColumns[c] = (freeColumns[c] ?? 0) + 1
      free++
    }
    const search = Math.round(BAND_SEARCH * cols)
    const center = Math.round(axisX)
    let best = -1
    let at = center
    for (let offset = -search; offset <= search; offset++) {
      let sum = 0
      for (let k = -3; k <= 3; k++) sum += freeColumns[(center + offset + k + cols) % cols] ?? 0
      if (sum > best) {
        best = sum
        at = center + offset
      }
    }
    if (best / 7 < (BAND_PROMINENCE * free) / cols) return Number.NaN
    return (at + cols + 0.5) % cols
  }

  /** El radio del embudo a la altura `y`: ancho arriba, angosto abajo. */
  function funnel(y: number): number {
    const top = Math.min(FUNNEL_TOP * rows, FUNNEL_TOP_MAX * cols)
    const bottom = FUNNEL_BOTTOM * rows
    return bottom + (top - bottom) * (1 - y / rows) ** 1.6
  }

  /** Dónde está el eje a la altura `y`: la base serpentea más que la cima. */
  function axisAt(y: number): number {
    const depth = y / rows
    return axisX + SWAY * rows * Math.sin(depth * 5.5 + time * SWAY_SPEED) * (0.3 + 0.7 * depth)
  }

  /** El eje y el radio del embudo de cada fila, para este cuadro. */
  function measureFunnel(): void {
    for (let y = 0; y < rows; y++) {
      axisRow[y] = axisAt(y + 0.5)
      wallRow[y] = funnel(y + 0.5)
    }
  }

  /** La distancia más corta de `a` a `b` en el eje horizontal (periódico). */
  function across(a: number, b: number): number {
    const d = b - a
    return d > cols / 2 ? d - cols : d < -cols / 2 ? d + cols : d
  }

  /** La succión del núcleo, en la aceleración de la malla: horizontal, hacia el eje. */
  function suck(target: Gravity): void {
    const { meshCols, meshRows, ax } = target
    const hx = cols / meshCols
    const hy = rows / meshRows
    const pull = INFLOW * spin
    for (let r = 0; r < meshRows; r++) {
      const row = Math.min(rows - 1, ((r + 0.5) * hy) | 0)
      const axis = axisRow[row] ?? 0
      const wall = wallRow[row] ?? 0
      for (let c = 0; c < meshCols; c++) {
        const u = across(axis, (c + 0.5) * hx)
        // Adentro del embudo ya no succiona: ahí manda la órbita.
        const d = Math.abs(u)
        if (d < wall) continue
        ax[c * meshRows + r] =
          (ax[c * meshRows + r] ?? 0) - Math.sign(u) * pull * Math.min(1, (d - wall) / 4)
      }
    }
  }

  /** El ángulo de la hélice en la altura `y` (sin la fase de la hebra). */
  function helix(y: number): number {
    return turned + TWIST * TAU * (1 - y / rows)
  }

  /** Lo que llega al eje empieza a orbitarlo: de a poco, no todo de golpe. */
  function capture(target: Gravity, dt: number): void {
    if (spin < 0.2) return
    const chance = CAPTURE_RATE * spin * dt
    for (let p = 0; p < target.count; p++) {
      if (orbiting[p] === 1) continue
      const y = target.y[p] ?? 0
      const row = y | 0
      const wall = wallRow[row] ?? 0
      const u = across(axisRow[row] ?? 0, target.x[p] ?? 0)
      if (y < SUMMIT * rows || Math.abs(u) > wall + CAPTURE || random() > chance) continue
      orbiting[p] = 1
      // Entra justo donde está (sin salto: la fase que la deja en su x, adelante o
      // atrás) y después se suma, girando, a la hebra más cercana. Deslizarse en
      // horizontal hasta la hebra dibujaba barras.
      // Más cerca de la pared que del eje: el embudo es hueco y su silueta se lee.
      const share = Math.max(0.6, Math.min(1, Math.abs(u) / Math.max(1, wall)))
      const side = Math.asin(Math.max(-1, Math.min(1, u / (wall * share))))
      const own = (random() < 0.5 ? side : Math.PI - side) - helix(y)
      phase[p] = own
      reach[p] = share
      const strand = Math.round((own * STRANDS) / TAU)
      strandPhase[p] = (strand * TAU) / STRANDS + (random() - 0.5) * 2 * STRAND_SPREAD
      stay[p] = Math.min(STAY_MAX_S, Math.max(STAY_MIN_S, -Math.log(1 - random()) * STAY_S))
      lift[p] = UPDRAFT * (1 + LIFT_SPREAD * (2 * random() - 1))
    }
  }

  /** La órbita: sigue su hebra, que rota y sube; al terminar su tiempo (o en la cima) renace lejos del eje. */
  function whirl(target: Gravity, dt: number): void {
    turned += WHIRL * spin * dt
    if (turned > TAU) turned -= TAU
    const join = 1 - Math.exp(-dt / SETTLE_S)
    for (let p = 0; p < target.count; p++) {
      if (orbiting[p] !== 1) continue
      const y = (target.y[p] ?? 0) - (lift[p] ?? UPDRAFT) * spin * dt
      stay[p] = (stay[p] ?? 0) - dt
      if (y < SUMMIT * rows || (stay[p] ?? 0) <= 0) {
        orbiting[p] = 0
        respawn(target, p)
        continue
      }
      const own = (phase[p] ?? 0) + ((strandPhase[p] ?? 0) - (phase[p] ?? 0)) * join
      phase[p] = own
      const a = own + helix(y)
      const row = y | 0
      const x = (axisRow[row] ?? 0) + (wallRow[row] ?? 0) * (reach[p] ?? 1) * Math.sin(a)
      target.x[p] = (x + cols) % cols
      target.y[p] = y
      target.vx[p] = 0
      target.vy[p] = 0
      angle[p] = a
    }
  }

  /** Goteo parejo de la materia libre: renace en cualquier lugar. */
  function recycle(target: Gravity, dt: number): void {
    const rain = RAIN * dt
    for (let p = 0; p < target.count; p++) {
      if (orbiting[p] !== 1 && random() < rain) respawn(target, p)
    }
  }

  function pointerFor(context: LiveContext): PointMass | null {
    const strength = POINTER_STRENGTH[options.cursor()]
    followPointer(presence, context, strength !== 0, scale)
    if (presence.level <= 0.01) return null
    pointer.x = presence.x
    pointer.y = presence.y
    pointer.strength = strength * presence.level
    return pointer
  }

  /**
   * La materia libre, por densidad en escala logarítmica: vacíos oscuros,
   * filamentos, nudos plenos. Lo que orbita, por partícula y según su profundidad.
   */
  function paint(target: Gravity): void {
    if (!mask) return
    counts.fill(0)
    for (let p = 0; p < target.count; p++) {
      if (orbiting[p] === 1) continue
      const k = ((target.x[p] ?? 0) | 0) * rows + ((target.y[p] ?? 0) | 0)
      counts[k] = (counts[k] ?? 0) + 1
    }
    const span = Math.log(HIGH / LOW)
    for (let i = 0; i < light.length; i++) {
      const n = counts[i] ?? 0
      light[i] = n <= LOW ? 0 : Math.min(1, Math.log(n / LOW) / span) * GAIN
    }
    for (let p = 0; p < target.count; p++) {
      if (orbiting[p] !== 1) continue
      const k = ((target.x[p] ?? 0) | 0) * rows + ((target.y[p] ?? 0) | 0)
      const depth = 0.5 + 0.5 * Math.cos(angle[p] ?? 0)
      const glow = GAIN * (BACK + (FRONT - BACK) * depth)
      if (glow > (light[k] ?? 0)) light[k] = glow
    }
    for (let i = 0; i < light.length; i++) if (blocked[i] === 1) light[i] = 0
    writeScaledDirect(light, rows, mask, scale, GAIN)
  }

  function advance(target: Gravity, dt: number, mass: PointMass | null): void {
    time += dt
    accelerate(target, PARAMS)
    const { ax, ay } = target
    for (let i = 0; i < ax.length; i++) {
      ax[i] = (ax[i] ?? 0) + (shoveX[i] ?? 0)
      ay[i] = (ay[i] ?? 0) + (shoveY[i] ?? 0)
    }
    watchCollapse(target, dt)
    spin += ((born ? 1 : 0) - spin) * (1 - Math.exp(-dt / SPIN_UP_S))
    if (born) {
      measureFunnel()
      suck(target)
    }
    // La gravedad mueve todo; a lo que orbita, `whirl` le pisa la posición.
    move(target, PARAMS, dt, mass)
    if (born) {
      capture(target, dt)
      whirl(target, dt)
    }
    recycle(target, dt)
  }

  return {
    frame(boxCols, boxRows, context) {
      const target = ensure(boxCols, boxRows, context)
      advance(target, Math.min(context.dt, 1 / 20), pointerFor(context))
      paint(target)
      return mask
    },

    still(boxCols, boxRows, context) {
      const target = ensure(boxCols, boxRows, context)
      // El cuadro quieto se asienta UNA vez: el runner lo pide en cada scroll.
      if (settled === target && settledIslands === islandsSeen) return mask
      for (let step = 0; step < STILL_STEPS; step++) advance(target, 1 / 30, null)
      paint(target)
      settled = target
      settledIslands = islandsSeen
      return mask
    },
  }
}
