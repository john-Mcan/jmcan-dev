/**
 * Julia sin fondo: un zoom que no termina nunca en el conjunto de Julia de z² + c,
 * y las ondas que lo rodean (las curvas de nivel de su potencial).
 *
 * El zoom va hacia un punto periódico repulsor p del conjunto: f⁴(p) = p, con
 * multiplicador λ = (f⁴)'(p), |λ| ≈ 7. Cerca de p el conjunto es autosimilar:
 * acercado |λ| veces y girado arg λ, se ve igual. La vista no es un zoom común sino
 * la función de Poincaré ψ(u) = f^{4K}(p + u·λ^{-K}), que cumple f⁴(ψ(u/λ)) = ψ(u)
 * exacto. Con u = w·λ^{-τ} (w, la celda), al pasar τ de 0 a 1 la vista vuelve a
 * empezar igual aunque el plano esté |λ| veces más cerca: τ da la vuelta y el zoom
 * sigue para siempre, sin salto y sin perder precisión.
 *
 * Lo que se ve se mide en celdas, y por eso es igual a cualquier profundidad:
 * - el borde, con el estimador de distancia: ningún filamento se pierde por ser
 *   más fino que una celda;
 * - las ondas: el tiempo de escape suavizado (ν) en líneas finas, más juntas cerca
 *   del borde. Donde ya no entran en la grilla se funden en una bruma pareja. Corren
 *   hacia afuera, como si salieran del conjunto.
 *
 * c se mece cerca de −0,8 + 0,156i (espirales, bulbos); el puntero la guía (atrae)
 * o la lleva al lado opuesto (aparta), sin dejar rastro. La forma pasa por debajo
 * del texto, atenuada (`UNDER_TEXT`), en vez de cortarse en un rectángulo. Sin DOM.
 */

import type { SpriteMask } from './grid-field'
import {
  createPresence,
  fillRects,
  fineScale,
  followPointer,
  type CellRect,
  type CursorMode,
  type LiveContext,
  type LiveSource,
} from './live'

export interface JuliaOptions {
  cursor: () => CursorMode
}

/** c, cerca del borde del conjunto de Mandelbrot, junto al bulbo de período 2. */
const C_RE = -0.8
const C_IM = 0.156
/** Cuánto se mece c sola (radio) y sus dos ritmos (rad/s). */
const SWAY = 0.03
const SWAY_SPEED_RE = 0.21
const SWAY_SPEED_IM = 0.29
/** Hasta dónde lleva c el puntero (por eje) y en cuánto tiempo la sigue (s). */
const STEER = 0.08
const STEER_S = 0.6
/**
 * El punto del zoom, de período 4. En todo el rango de c, |λ| queda entre 6 y 8 y la
 * vista gira menos de 0,2 rad por cada e-pliegue de zoom. Se sigue con Newton desde
 * su lugar del cuadro anterior.
 */
const PERIOD = 4
const SEED_RE = -0.9928
const SEED_IM = -0.2111
/** Vueltas con que se arma la función de Poincaré: |λ|^-K ≈ 4·10⁻⁴. */
const DEPTH = 4
/** Iteraciones más allá de las de ψ. Lo que no escapa es interior, o el borde mismo. */
const MAX_ITERATIONS = 48
const BAILOUT2 = 1e8
/** Velocidad del zoom, en e-pliegues por segundo: duplica el tamaño cada ~7 s. */
const ZOOM = 0.1
/** Media diagonal de la caja en el plano (en la escala de τ = 0). */
const VIEW = 0.33
/** Dónde cae el punto del zoom (fracción de la caja) y cuánto gira la vista (rad). */
const LANDSCAPE_AT_X = 0.7
const LANDSCAPE_AT_Y = 0.5
const LANDSCAPE_TURN = 0
const PORTRAIT_AT_X = 0.6
const PORTRAIT_AT_Y = 0.5
const PORTRAIT_TURN = 1.2
/** El borde se enciende hasta esta distancia (celdas). */
const EDGE = 1.5
const EDGE_GAIN = 0.95
/**
 * Ondas: líneas por unidad de ν, su medio grosor (fracción del ciclo, y nunca menos
 * de `LINE` celdas), cuánto corren (ciclos/s) y su luz. Con menos de ~0,8 de luz una
 * línea se pierde en el ruido del campo.
 */
const BANDS = 1
const BAND = 0.16
const LINE = 1
const BAND_SPEED = 0.3
const RIPPLE_GAIN = 0.85
/**
 * Separación entre líneas (celdas) bajo la cual se apagan: más juntas no entran en la
 * grilla. Ahí queda solo el borde; una bruma gris en su lugar se leía como una mancha
 * y tapaba las espirales.
 */
const FADE_FROM = 2.5
const FADE_TO = 4.5
/** A cuántas celdas del borde las ondas se apagan (decaimiento exponencial). */
const REACH = 45
/** Debajo del texto la forma sigue, pero a esta fracción de su luz: el texto se lee. */
const UNDER_TEXT = 0.3
const ISLAND_MARGIN = 1

export function createJulia(options: JuliaOptions): LiveSource {
  let cols = 0
  let rows = 0
  /** Celdas del campo por cálculo, de lado (ver `fineScale`): los trazos miden lo mismo en móvil. */
  let block = 1
  let mask: SpriteMask | null = null
  let under = new Uint8Array(0)
  const rects: CellRect[] = []
  let islandsSeen = -1
  let settledIslands = -1
  let settledMask: SpriteMask | null = null

  let time = 0
  /** Fase del zoom, en [0, 1): una vuelta acerca |λ| veces. */
  let tau = 0
  let parity = 0
  let cRe = C_RE + SWAY
  let cIm = C_IM
  let pRe = SEED_RE
  let pIm = SEED_IM
  /** ln |λ| y arg λ. */
  let lnMod = 2
  let arg = 0
  const presence = createPresence()

  function ensure(boxCols: number, boxRows: number, context: LiveContext): void {
    block = fineScale(context.cellPx)
    if (!mask || mask.cols !== boxCols || mask.rows !== boxRows) {
      cols = boxCols
      rows = boxRows
      mask = { data: new Float32Array(cols * rows), cols, rows }
      under = new Uint8Array(cols * rows)
      islandsSeen = -1
      settledMask = null
    }
    if (islandsSeen !== context.islandsVersion) {
      islandsSeen = context.islandsVersion
      under.fill(0)
      // Islas a resolución completa, con margen (en celdas del campo).
      rects.length = 0
      for (const island of context.islands) {
        rects.push({
          col: island.col - ISLAND_MARGIN,
          row: island.row - ISLAND_MARGIN,
          cols: island.cols + ISLAND_MARGIN * 2,
          rows: island.rows + ISLAND_MARGIN * 2,
        })
      }
      fillRects(under, cols, rows, rects)
    }
  }

  /** Sigue el punto periódico (Newton sobre f⁴(z) − z) y su multiplicador. */
  function track(): void {
    let dr = 1
    let di = 0
    for (let step = 0; step < 12; step++) {
      let x = pRe
      let y = pIm
      dr = 1
      di = 0
      for (let k = 0; k < PERIOD; k++) {
        const t = 2 * (x * dr - y * di)
        di = 2 * (x * di + y * dr)
        dr = t
        const u = x * x - y * y + cRe
        y = 2 * x * y + cIm
        x = u
      }
      const gr = x - pRe
      const gi = y - pIm
      const hr = dr - 1
      const den = hr * hr + di * di
      if (den < 1e-12) break
      const sr = (gr * hr + gi * di) / den
      const si = (gi * hr - gr * di) / den
      pRe -= sr
      pIm -= si
      if (sr * sr + si * si < 1e-30) break
    }
    lnMod = Math.log(Math.sqrt(dr * dr + di * di))
    arg = Math.atan2(di, dr)
  }

  /** c: el vaivén, y hacia donde lo lleve el puntero mientras está. Avanza el zoom. */
  function steer(dt: number, mode: CursorMode): void {
    time += dt
    let targetRe = C_RE + SWAY * Math.cos(time * SWAY_SPEED_RE)
    let targetIm = C_IM + SWAY * Math.sin(time * SWAY_SPEED_IM)
    const level = mode === 'off' ? 0 : presence.level
    if (level > 0.01) {
      const sign = mode === 'attract' ? 1 : -1
      targetRe += sign * ((presence.x / cols) * 2 - 1) * STEER * level
      targetIm -= sign * ((presence.y / rows) * 2 - 1) * STEER * level
    }
    const k = dt > 0 ? 1 - Math.exp(-dt / STEER_S) : 1
    cRe += (targetRe - cRe) * k
    cIm += (targetIm - cIm) * k
    track()
    tau += (dt * ZOOM) / Math.max(0.5, lnMod)
    tau -= Math.floor(tau)
  }

  function render(all: boolean): void {
    if (!mask) return
    const data = mask.data
    const landscape = cols >= rows
    const anchorX = cols * (landscape ? LANDSCAPE_AT_X : PORTRAIT_AT_X)
    const anchorY = rows * (landscape ? LANDSCAPE_AT_Y : PORTRAIT_AT_Y)
    // Plano por celda del campo, y κ = e^{i·giro}·λ^{-(τ+K)}.
    const unit = VIEW / (Math.hypot(cols, rows) / 2)
    const e = -(tau + DEPTH)
    const kMod = Math.exp(e * lnMod)
    const kArg = e * arg + (landscape ? LANDSCAPE_TURN : PORTRAIT_TURN)
    const kr = kMod * Math.cos(kArg) * unit
    const ki = kMod * Math.sin(kArg) * unit
    // Lo que mide una celda de cálculo en el plano de partida: las distancias salen en celdas.
    const cell = kMod * unit * block
    // Una vuelta de τ pide PERIOD iteraciones más: el tope crece con τ para que el
    // final de la vuelta empalme con el principio.
    const limit = PERIOD * DEPTH + Math.floor(PERIOD * tau) + MAX_ITERATIONS
    const shift = PERIOD * (DEPTH + tau)
    const phase = BAND_SPEED * time
    for (let r = all ? 0 : parity * block; r < rows; r += block * (all ? 1 : 2)) {
      const dy = r - anchorY
      for (let c = 0; c < cols; c += block) {
        const dx = c - anchorX
        let x = pRe + kr * dx - ki * dy
        let y = pIm + kr * dy + ki * dx
        // La derivada respecto de la celda (sin el factor κ, que va en `cell`).
        let dr = 1
        let di = 0
        let m2 = x * x + y * y
        let n = 0
        while (n < limit && m2 < BAILOUT2) {
          const t = 2 * (x * dr - y * di)
          di = 2 * (x * di + y * dr)
          dr = t
          const u = x * x - y * y + cRe
          y = 2 * x * y + cIm
          x = u
          m2 = x * x + y * y
          n++
        }
        let value = 0
        if (m2 >= BAILOUT2) {
          const lz = Math.log(m2) / 2
          // Distancia al borde (celdas) y tiempo de escape suavizado, corrido por el zoom.
          const d = (Math.sqrt(m2) * lz) / (Math.sqrt(dr * dr + di * di) * cell)
          const nu = n + 1 - Math.log2(lz) - shift
          value = light(d, nu, phase)
        }
        fill(data, c, r, value)
      }
    }
    parity ^= 1
  }

  /** La luz de una celda a `d` celdas del borde, con escape `nu`. */
  function light(d: number, nu: number, phase: number): number {
    const edge = d < EDGE ? smooth(1 - d / EDGE) * EDGE_GAIN : 0
    // ν cambia 1/(d·ln 2) por celda: las líneas se separan d·ln 2 celdas.
    const spacing = (d * Math.LN2) / BANDS
    const fade = smooth((spacing - FADE_FROM) / (FADE_TO - FADE_FROM))
    if (fade <= 0) return edge
    const at = BANDS * nu + phase
    const off = Math.abs(at - Math.round(at))
    const half = Math.min(0.5, Math.max(BAND, LINE / spacing))
    if (off >= half) return edge
    const wave = smooth(1 - off / half) * fade * RIPPLE_GAIN * Math.exp(-d / REACH)
    return Math.max(edge, wave)
  }

  function smooth(t: number): number {
    if (t <= 0) return 0
    if (t >= 1) return 1
    return t * t * (3 - 2 * t)
  }

  function fill(data: Float32Array, c: number, r: number, value: number): void {
    for (let x = c; x < Math.min(cols, c + block); x++) {
      for (let y = r; y < Math.min(rows, r + block); y++) {
        const i = x * rows + y
        data[i] = under[i] === 1 ? value * UNDER_TEXT : value
      }
    }
  }

  return {
    frame(boxCols, boxRows, context) {
      ensure(boxCols, boxRows, context)
      const mode = options.cursor()
      followPointer(presence, context, mode !== 'off', 1)
      steer(context.dt, mode)
      render(false)
      return mask
    },

    still(boxCols, boxRows, context) {
      ensure(boxCols, boxRows, context)
      if (settledMask === mask && settledIslands === islandsSeen) return mask
      steer(0, 'off')
      render(true)
      settledMask = mask
      settledIslands = islandsSeen
      return mask
    },
  }
}
