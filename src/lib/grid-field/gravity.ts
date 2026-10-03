/**
 * Gravedad: un N-cuerpos de partícula-malla (PM), el método de las simulaciones
 * cosmológicas. En cada paso las partículas depositan su masa en una malla
 * (nube en celda), la ecuación de Poisson da el potencial (FFT, caja periódica),
 * y cada partícula cae según la fuerza interpolada de la malla. Sin DOM.
 *
 * La caja es periódica (lo que sale por un lado entra por el otro) y la malla,
 * más gruesa que la caja: una celda suya mide unas dos celdas de la caja. Ese es
 * el ablandamiento de la fuerza, y de ahí sale el grosor de los filamentos.
 *
 * Índices column-major, como el campo: `x * rows + y`.
 */

export interface GravityParams {
  /** Intensidad de la gravedad. */
  strength: number
  /** Arrastre de la expansión (1/s): sin él, los cúmulos se calientan y se inflan. */
  drag: number
  /** Velocidad máxima (celdas/s): una partícula que cae a un nodo no sale disparada. */
  maxSpeed: number
}

export interface Gravity {
  /** La caja, en celdas. */
  width: number
  height: number
  /** La malla: potencias de 2 (las pide la FFT). */
  meshCols: number
  meshRows: number
  /** Partículas: posición (celdas de la caja) y velocidad (celdas/s). */
  x: Float32Array
  y: Float32Array
  vx: Float32Array
  vy: Float32Array
  count: number
  /** Densidad en la malla: partículas por celda, de la última pasada. */
  density: Float32Array
  /** Aceleración en la malla. */
  ax: Float32Array
  ay: Float32Array
  /** Buffers de la FFT y la función de Green (-1/k²) por modo. */
  re: Float64Array
  im: Float64Array
  green: Float64Array
  colFft: Fft
  rowFft: Fft
}

/** Una masa que no está en la malla (el puntero): positiva atrae, negativa aparta. */
export interface PointMass {
  x: number
  y: number
  /** Ablandamiento (celdas): la fuerza no crece sin límite al acercarse. */
  soft: number
  strength: number
}

/** La potencia de 2 más cercana a `n` (al menos 8). */
export function meshSize(n: number): number {
  return Math.max(8, 2 ** Math.round(Math.log2(Math.max(1, n))))
}

export function createGravity(
  width: number,
  height: number,
  meshCols: number,
  meshRows: number,
  count: number,
): Gravity {
  const n = meshCols * meshRows
  const green = new Float64Array(n)
  // Green del laplaciano DISCRETO (el de cinco puntos), no el continuo: así la fuerza
  // por diferencias centrales es consistente y la malla no deja patrones propios.
  const hx = width / meshCols
  const hy = height / meshRows
  for (let c = 0; c < meshCols; c++) {
    const sx = (2 * Math.sin((Math.PI * c) / meshCols)) / hx
    for (let r = 0; r < meshRows; r++) {
      const sy = (2 * Math.sin((Math.PI * r) / meshRows)) / hy
      const k2 = sx * sx + sy * sy
      green[c * meshRows + r] = k2 > 0 ? -1 / k2 : 0
    }
  }
  return {
    width,
    height,
    meshCols,
    meshRows,
    x: new Float32Array(count),
    y: new Float32Array(count),
    vx: new Float32Array(count),
    vy: new Float32Array(count),
    count,
    density: new Float32Array(n),
    ax: new Float32Array(n),
    ay: new Float32Array(n),
    re: new Float64Array(n),
    im: new Float64Array(n),
    green,
    colFft: createFft(meshRows),
    rowFft: createFft(meshCols),
  }
}

/**
 * Un paso en dos mitades: `accelerate` deposita la masa y deja la aceleración en
 * la malla (`ax`/`ay`), donde se le puede sumar una fuerza propia; `move` mueve.
 */
export function accelerate(sim: Gravity, params: GravityParams): void {
  deposit(sim)
  solve(sim, params.strength)
}

/** Nube en celda: cada partícula reparte su masa entre las cuatro celdas más cercanas. */
function deposit(sim: Gravity): void {
  const { meshCols, meshRows, density, x, y } = sim
  const fx = meshCols / sim.width
  const fy = meshRows / sim.height
  density.fill(0)
  for (let p = 0; p < sim.count; p++) {
    const u = (x[p] ?? 0) * fx - 0.5
    const v = (y[p] ?? 0) * fy - 0.5
    const c0 = Math.floor(u)
    const r0 = Math.floor(v)
    const tu = u - c0
    const tv = v - r0
    const ca = wrap(c0, meshCols) * meshRows
    const cb = wrap(c0 + 1, meshCols) * meshRows
    const ra = wrap(r0, meshRows)
    const rb = wrap(r0 + 1, meshRows)
    density[ca + ra] = (density[ca + ra] ?? 0) + (1 - tu) * (1 - tv)
    density[ca + rb] = (density[ca + rb] ?? 0) + (1 - tu) * tv
    density[cb + ra] = (density[cb + ra] ?? 0) + tu * (1 - tv)
    density[cb + rb] = (density[cb + rb] ?? 0) + tu * tv
  }
}

/** ∇²φ = G·δ con δ el contraste de densidad; a = -∇φ en la malla. */
function solve(sim: Gravity, strength: number): void {
  const { meshCols, meshRows, density, re, im, green, ax, ay } = sim
  const n = meshCols * meshRows
  const mean = sim.count / n
  for (let i = 0; i < n; i++) {
    re[i] = (density[i] ?? 0) / mean - 1
    im[i] = 0
  }
  fft2(sim, 1)
  for (let i = 0; i < n; i++) {
    const g = (green[i] ?? 0) * strength
    re[i] = (re[i] ?? 0) * g
    im[i] = (im[i] ?? 0) * g
  }
  fft2(sim, -1)
  const hx2 = (2 * sim.width) / meshCols
  const hy2 = (2 * sim.height) / meshRows
  for (let c = 0; c < meshCols; c++) {
    const left = wrap(c - 1, meshCols) * meshRows
    const right = wrap(c + 1, meshCols) * meshRows
    const mid = c * meshRows
    for (let r = 0; r < meshRows; r++) {
      const up = wrap(r - 1, meshRows)
      const down = wrap(r + 1, meshRows)
      ax[mid + r] = -((re[right + r] ?? 0) - (re[left + r] ?? 0)) / hx2
      ay[mid + r] = -((re[mid + down] ?? 0) - (re[mid + up] ?? 0)) / hy2
    }
  }
}

export function move(
  sim: Gravity,
  params: GravityParams,
  dt: number,
  pointer: PointMass | null,
): void {
  const { meshCols, meshRows, ax, ay, x, y, vx, vy, width, height } = sim
  const fx = meshCols / width
  const fy = meshRows / height
  const keep = Math.exp(-params.drag * dt)
  const max2 = params.maxSpeed * params.maxSpeed
  for (let p = 0; p < sim.count; p++) {
    const px = x[p] ?? 0
    const py = y[p] ?? 0
    // La fuerza, con los mismos pesos con que la partícula depositó (sin auto-fuerza).
    const u = px * fx - 0.5
    const v = py * fy - 0.5
    const c0 = Math.floor(u)
    const r0 = Math.floor(v)
    const tu = u - c0
    const tv = v - r0
    const ca = wrap(c0, meshCols) * meshRows
    const cb = wrap(c0 + 1, meshCols) * meshRows
    const ra = wrap(r0, meshRows)
    const rb = wrap(r0 + 1, meshRows)
    const w00 = (1 - tu) * (1 - tv)
    const w01 = (1 - tu) * tv
    const w10 = tu * (1 - tv)
    const w11 = tu * tv
    let gx =
      (ax[ca + ra] ?? 0) * w00 +
      (ax[ca + rb] ?? 0) * w01 +
      (ax[cb + ra] ?? 0) * w10 +
      (ax[cb + rb] ?? 0) * w11
    let gy =
      (ay[ca + ra] ?? 0) * w00 +
      (ay[ca + rb] ?? 0) * w01 +
      (ay[cb + ra] ?? 0) * w10 +
      (ay[cb + rb] ?? 0) * w11
    if (pointer) {
      // La distancia más corta en la caja periódica.
      let dx = pointer.x - px
      let dy = pointer.y - py
      if (dx > width / 2) dx -= width
      else if (dx < -width / 2) dx += width
      if (dy > height / 2) dy -= height
      else if (dy < -height / 2) dy += height
      const f = pointer.strength / (dx * dx + dy * dy + pointer.soft * pointer.soft)
      gx += dx * f
      gy += dy * f
    }
    let nvx = ((vx[p] ?? 0) + gx * dt) * keep
    let nvy = ((vy[p] ?? 0) + gy * dt) * keep
    const s2 = nvx * nvx + nvy * nvy
    if (s2 > max2) {
      const k = params.maxSpeed / Math.sqrt(s2)
      nvx *= k
      nvy *= k
    }
    vx[p] = nvx
    vy[p] = nvy
    let nx = px + nvx * dt
    let ny = py + nvy * dt
    if (nx < 0) nx += width
    else if (nx >= width) nx -= width
    if (ny < 0) ny += height
    else if (ny >= height) ny -= height
    x[p] = nx
    y[p] = ny
  }
}

/**
 * Las fluctuaciones del universo temprano: un campo gaussiano al azar con
 * potencia de densidad ∝ k^index (con index < 0, más amplitud en las escalas
 * grandes). Deja en `ax`/`ay` el desplazamiento de Zel'dovich, -∇ψ con ∇²ψ = δ,
 * normalizado a una celda de desvío. `quiet`: cuántas de las ondas más largas en
 * horizontal se silencian (para que no armen una franja propia). Usa los buffers
 * de la FFT: llamarlo antes del primer paso.
 */
export function randomDisplacement(
  sim: Gravity,
  index: number,
  random: () => number,
  quiet = 0,
): void {
  const { meshCols, meshRows, re, im, green, ax, ay } = sim
  const n = meshCols * meshRows
  for (let i = 0; i < n; i++) {
    const wave = Math.min((i / meshRows) | 0, meshCols - ((i / meshRows) | 0))
    if (wave > 0 && wave <= quiet) {
      re[i] = 0
      im[i] = 0
      continue
    }
    const g = green[i] ?? 0
    const k2 = g < 0 ? -1 / g : 0
    // Box-Muller: una normal compleja por modo. ψ = -δ/k², así que su amplitud va
    // como k^(index/2 - 2).
    const a = Math.sqrt(-2 * Math.log(1 - random()))
    const t = random() * Math.PI * 2
    const amplitude = k2 > 0 ? Math.pow(k2, index / 4 - 1) : 0
    re[i] = a * Math.cos(t) * amplitude
    im[i] = a * Math.sin(t) * amplitude
  }
  fft2(sim, -1)
  const hx2 = (2 * sim.width) / meshCols
  const hy2 = (2 * sim.height) / meshRows
  let sum = 0
  for (let c = 0; c < meshCols; c++) {
    const left = wrap(c - 1, meshCols) * meshRows
    const right = wrap(c + 1, meshCols) * meshRows
    const mid = c * meshRows
    for (let r = 0; r < meshRows; r++) {
      const dx = -((re[right + r] ?? 0) - (re[left + r] ?? 0)) / hx2
      const dy =
        -((re[mid + wrap(r + 1, meshRows)] ?? 0) - (re[mid + wrap(r - 1, meshRows)] ?? 0)) / hy2
      ax[mid + r] = dx
      ay[mid + r] = dy
      sum += dx * dx + dy * dy
    }
  }
  const norm = 1 / Math.sqrt(sum / n || 1)
  for (let i = 0; i < n; i++) {
    ax[i] = (ax[i] ?? 0) * norm
    ay[i] = (ay[i] ?? 0) * norm
  }
}

/** Lee un campo de la malla (`ax`/`ay`) en un punto de la caja, interpolado. */
export function sampleMesh(sim: Gravity, field: Float32Array, px: number, py: number): number {
  const { meshCols, meshRows } = sim
  const u = (px * meshCols) / sim.width - 0.5
  const v = (py * meshRows) / sim.height - 0.5
  const c0 = Math.floor(u)
  const r0 = Math.floor(v)
  const tu = u - c0
  const tv = v - r0
  const ca = wrap(c0, meshCols) * meshRows
  const cb = wrap(c0 + 1, meshCols) * meshRows
  const ra = wrap(r0, meshRows)
  const rb = wrap(r0 + 1, meshRows)
  return (
    (field[ca + ra] ?? 0) * (1 - tu) * (1 - tv) +
    (field[ca + rb] ?? 0) * (1 - tu) * tv +
    (field[cb + ra] ?? 0) * tu * (1 - tv) +
    (field[cb + rb] ?? 0) * tu * tv
  )
}

function wrap(i: number, n: number): number {
  return i < 0 ? i + n : i >= n ? i - n : i
}

// ─── FFT ─────────────────────────────────────────────────────────────────────

/** Tablas de una FFT radix-2 de largo `n`: inversión de bits y giros. */
interface Fft {
  n: number
  reverse: Uint32Array
  cos: Float64Array
  sin: Float64Array
}

function createFft(n: number): Fft {
  const bits = Math.round(Math.log2(n))
  const reverse = new Uint32Array(n)
  for (let i = 0; i < n; i++) {
    let r = 0
    for (let b = 0; b < bits; b++) r |= ((i >> b) & 1) << (bits - 1 - b)
    reverse[i] = r
  }
  const cos = new Float64Array(n / 2)
  const sin = new Float64Array(n / 2)
  for (let i = 0; i < n / 2; i++) {
    cos[i] = Math.cos((2 * Math.PI * i) / n)
    sin[i] = Math.sin((2 * Math.PI * i) / n)
  }
  return { n, reverse, cos, sin }
}

/** FFT in situ de `n` valores separados por `stride` desde `offset`. `sign` 1 directa, -1 inversa (sin normalizar). */
function fft1(
  fft: Fft,
  re: Float64Array,
  im: Float64Array,
  offset: number,
  stride: number,
  sign: number,
): void {
  const { n, reverse, cos, sin } = fft
  for (let i = 0; i < n; i++) {
    const j = reverse[i] ?? 0
    if (j <= i) continue
    const a = offset + i * stride
    const b = offset + j * stride
    const tr = re[a] ?? 0
    const ti = im[a] ?? 0
    re[a] = re[b] ?? 0
    im[a] = im[b] ?? 0
    re[b] = tr
    im[b] = ti
  }
  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2
    const step = n / size
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < half; k++) {
        const wr = cos[k * step] ?? 1
        const wi = -sign * (sin[k * step] ?? 0)
        const a = offset + (start + k) * stride
        const b = a + half * stride
        const br = re[b] ?? 0
        const bi = im[b] ?? 0
        const tr = br * wr - bi * wi
        const ti = br * wi + bi * wr
        const ar = re[a] ?? 0
        const ai = im[a] ?? 0
        re[b] = ar - tr
        im[b] = ai - ti
        re[a] = ar + tr
        im[a] = ai + ti
      }
    }
  }
}

/** FFT 2D de `re`/`im` (column-major). La inversa (`sign` -1) normaliza. */
function fft2(sim: Gravity, sign: number): void {
  const { meshCols, meshRows, re, im, colFft, rowFft } = sim
  for (let c = 0; c < meshCols; c++) fft1(colFft, re, im, c * meshRows, 1, sign)
  for (let r = 0; r < meshRows; r++) fft1(rowFft, re, im, r, meshRows, sign)
  if (sign < 0) {
    const scale = 1 / (meshCols * meshRows)
    for (let i = 0; i < re.length; i++) {
      re[i] = (re[i] ?? 0) * scale
      im[i] = (im[i] ?? 0) * scale
    }
  }
}
