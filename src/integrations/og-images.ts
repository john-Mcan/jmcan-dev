/**
 * Las tarjetas para compartir (Open Graph y X), 1200 × 630, con el aspecto del sitio:
 * el prompt del header, el título, la bajada y, a la derecha, el glifo de la página
 * impreso en la grilla de puntos, con los mismos dibujos, niveles y luz que el fondo.
 *
 * Los datos salen de `src/pages/og/cards.json.ts`, prerenderizada con los textos y el
 * contenido; aquí solo se pinta, en Node (el prerender corre en workerd, sin canvas),
 * al terminar el build. En `astro dev`, `/og/<ruta>.png` se pinta al pedirla.
 *
 * Solo importa módulos puros del motor (sin DOM ni alias `@/`): esto se carga con
 * `astro.config.ts`.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type * as NapiCanvas from '@napi-rs/canvas'
import type { AstroIntegration } from 'astro'
import { SITE } from '../data/site'
import { FIELD_DEFAULTS, levelOf, levelStyles, spriteLight } from '../lib/grid-field/grid-field'
import type { GlyphKey } from '../lib/grid-field/glyph-keys'
import { CONTACT_SPRITE, GLYPHS } from '../lib/grid-field/library'
import type { Sprite } from '../lib/grid-field/sprites'
import type { OG_SIZE, OgCard } from '../lib/seo'

type Context = NapiCanvas.SKRSContext2D
type Art = Exclude<OgCard['art'], { list: string[] }>

const SIZE: typeof OG_SIZE = { width: 1200, height: 630 }
/**
 * La celda del sitio (6 px) al doble, porque las redes muestran la tarjeta a la mitad
 * o menos; el punto, más grueso que en el fondo (la mitad de la celda y no un tercio),
 * para que el glifo se lea en una miniatura.
 */
const STEP = 12
const DOT = 6
const COLS = Math.ceil(SIZE.width / STEP)
const ROWS = Math.ceil(SIZE.height / STEP)
/** Como `SPRITE_GLYPH` del motor: desde esta cobertura, la celda es del glifo. */
const GLYPH_MIN = 0.15
/** El ruido de fondo, más tenue que en el sitio: con el punto más grueso, el mismo tope competía con el texto. */
const NOISE_MAX = FIELD_DEFAULTS.maxOpacity * 0.6

/** Los tokens del tema oscuro (`global.css`). */
const INK = { bg: '#000000', fg: '#ededea', muted: '#8c8c88', tick: '#4a4a48', signal: '#ffb000' }
const BASE = levelStyles([255, 255, 255])
const ACCENT = levelStyles([255, 176, 0])

/** Margen de la tarjeta; el texto ocupa la izquierda y el escenario, un cuadrado a la derecha. */
const MARGIN = 72
const STAGE = { col: 58, row: 8, cells: 36 }
const STAGE_PX = { x: STAGE.col * STEP, y: STAGE.row * STEP, size: STAGE.cells * STEP }
const TEXT_WIDTH = STAGE_PX.x - MARGIN - 36
const MIDDLE = STAGE_PX.y + STAGE_PX.size / 2

/** El cuadro de cada sprite que mejor se lee quieto (elegidos mirándolos todos). */
const POSTER: Record<GlyphKey | 'contact', number> = {
  loop: 20,
  eq: 26,
  path: 26,
  orbit: 26,
  zap: 30,
  contact: 0,
}

/** La marca `jm` de `public/favicon.svg`: rectángulos en su caja de 32. */
const MARK: readonly (readonly [number, number, number, number])[] = [
  [10, 6, 3, 3],
  [10, 11, 3, 12],
  [4, 23, 9, 3],
  [16, 11, 12, 3],
  [16, 14, 3, 12],
  [21, 14, 3, 12],
  [26, 14, 2, 12],
]

export function ogImages(): AstroIntegration {
  let root: URL
  let canvas: typeof NapiCanvas | undefined

  /** El canvas nativo se carga recién al pintar: `astro dev` y `astro check` no lo necesitan. */
  const load = (): typeof NapiCanvas => {
    if (canvas) return canvas
    const require = createRequire(root)
    canvas = require('@napi-rs/canvas') as typeof NapiCanvas
    const fonts = canvas.GlobalFonts
    fonts.registerFromPath(
      fileURLToPath(new URL('src/assets/fonts/DepartureMono-Regular.woff2', root)),
      'Departure Mono',
    )
    fonts.registerFromPath(
      require.resolve('@fontsource/instrument-sans/files/instrument-sans-latin-400-normal.woff2'),
      'Instrument Sans',
    )
    return canvas
  }

  return {
    name: 'og-images',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = config.root
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const path = decodeURIComponent(req.url?.split('?')[0] ?? '')
          if (!path.startsWith('/og/') || !path.endsWith('.png')) return next()
          fetch(`http://${req.headers.host}/og/cards.json`)
            .then((response) => response.json() as Promise<OgCard[]>)
            .then(async (cards) => {
              const card = cards.find((candidate) => `/${candidate.file}` === path)
              if (!card) return next()
              res.setHeader('Content-Type', 'image/png')
              res.setHeader('Cache-Control', 'no-store')
              res.end(await paint(load(), card))
            })
            .catch(next)
        })
      },
      'astro:build:done': async ({ dir, logger }) => {
        const manifest = new URL('og/cards.json', dir)
        const cards = JSON.parse(await readFile(manifest, 'utf8')) as OgCard[]
        const kit = load()
        await Promise.all(
          cards.map(async (card) => {
            const file = new URL(card.file, dir)
            await mkdir(new URL('./', file), { recursive: true })
            await writeFile(file, await paint(kit, card))
          }),
        )
        await rm(manifest)
        logger.info(`${cards.length} tarjetas en /og/`)
      },
    },
  }
}

async function paint(kit: typeof NapiCanvas, card: OgCard): Promise<Buffer> {
  const image = kit.createCanvas(SIZE.width, SIZE.height)
  const ctx = image.getContext('2d')
  ctx.fillStyle = INK.bg
  ctx.fillRect(0, 0, SIZE.width, SIZE.height)
  const list = typeof card.art === 'object' ? card.art.list : undefined
  const coverage =
    typeof card.art === 'string' ? cover(kit, card.art) : new Float32Array(COLS * ROWS)
  paintField(ctx, coverage, seeded(card.file))
  paintTicks(ctx)
  paintText(ctx, card)
  if (list) paintList(ctx, list)
  return image.encode('png')
}

// ─── La grilla ───────────────────────────────────────────────────────────────

/**
 * Cuánto cubre el arte cada celda del escenario (0–1), como `rasteriseFrame`: se
 * dibuja en blanco en un canvas del tamaño de la caja y se promedia el alfa por celda.
 */
function cover(kit: typeof NapiCanvas, art: Art): Float32Array {
  const coverage = new Float32Array(COLS * ROWS)
  const px = STAGE_PX.size
  const scratch = kit.createCanvas(px, px)
  const ctx = scratch.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#fff'
  draw(ctx, art, px)
  const { data } = ctx.getImageData(0, 0, px, px)
  for (let r = 0; r < STAGE.cells; r++) {
    for (let c = 0; c < STAGE.cells; c++) {
      let sum = 0
      for (let y = r * STEP; y < (r + 1) * STEP; y++) {
        for (let x = c * STEP; x < (c + 1) * STEP; x++) sum += data[(y * px + x) * 4 + 3] ?? 0
      }
      coverage[(STAGE.row + r) * COLS + STAGE.col + c] = sum / (STEP * STEP * 255)
    }
  }
  return coverage
}

function draw(ctx: Context, art: Art, px: number): void {
  if (art === 'mark') {
    // La marca ocupa 24 × 20 de su caja (de 4 a 28 y de 6 a 26): centrada, a un 70 %.
    const unit = (px * 0.7) / 24
    const x0 = (px - 24 * unit) / 2 - 4 * unit
    const y0 = (px - 20 * unit) / 2 - 6 * unit
    for (const [x, y, w, h] of MARK) ctx.fillRect(x0 + x * unit, y0 + y * unit, w * unit, h * unit)
    return
  }
  const sprite: Sprite = art === 'contact' ? CONTACT_SPRITE : GLYPHS[art]
  const frame = sprite.frames[Math.min(POSTER[art], sprite.frames.length - 1)]
  if (typeof frame === 'function') {
    frame(ctx as unknown as CanvasRenderingContext2D, px, px, 'Departure Mono')
  } else if (frame !== undefined) {
    ctx.font = `${Math.round(px * (sprite.textScale ?? 0.38))}px "Departure Mono"`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(frame, px / 2, px / 2)
  }
}

/** Las celdas del arte, con la luz del sprite en ámbar (un glifo); el resto, el ruido de fondo del campo. */
function paintField(ctx: Context, coverage: Float32Array, random: () => number): void {
  const offset = (STEP - DOT) / 2
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const g = coverage[row * COLS + col] ?? 0
      const noise = random()
      const lit = random() < FIELD_DEFAULTS.chance
      const sprite = g > GLYPH_MIN
      const level = levelOf(sprite ? spriteLight(g, noise) : lit ? noise * NOISE_MAX : 0)
      if (level < 0) continue
      ctx.fillStyle = (sprite ? ACCENT : BASE)[level] ?? INK.fg
      ctx.fillRect(col * STEP + offset, row * STEP + offset, DOT, DOT)
    }
  }
}

/** Las marcas en las esquinas del escenario, como `.frame`. */
function paintTicks(ctx: Context): void {
  const { x, y, size } = STAGE_PX
  const tick = 20
  const line = 2
  ctx.fillStyle = INK.tick
  for (const [cx, cy, dx, dy] of [
    [x, y, 1, 1],
    [x + size, y, -1, 1],
    [x, y + size, 1, -1],
    [x + size, y + size, -1, -1],
  ] as const) {
    ctx.fillRect(dx > 0 ? cx : cx - tick, dy > 0 ? cy : cy - line, tick, line)
    ctx.fillRect(dx > 0 ? cx : cx - line, dy > 0 ? cy : cy - tick, line, tick)
  }
}

// ─── El texto ────────────────────────────────────────────────────────────────

const PIXEL = '"Departure Mono"'
const SANS = '"Instrument Sans"'
/** Departure Mono solo en múltiplos de 11: el título baja de tamaño hasta caber. */
const TITLE_SIZES = [88, 77, 66, 55, 44]
const LEAD = { size: 34, line: 46, lines: 3 }

function paintText(ctx: Context, card: OgCard): void {
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  // Arriba, el prompt del header, a la altura del escenario: `jm ~/<ruta>▮`.
  ctx.font = `33px ${PIXEL}`
  const promptBase = STAGE_PX.y + capHeight(ctx)
  ctx.fillStyle = INK.fg
  ctx.fillText('jm', MARGIN, promptBase)
  const path = ` ~/${card.prompt}`
  const pathX = MARGIN + ctx.measureText('jm').width
  ctx.fillStyle = INK.muted
  ctx.fillText(path, pathX, promptBase)
  const cursorX = pathX + ctx.measureText(path).width + 4
  ctx.fillStyle = INK.signal
  ctx.fillRect(cursorX, promptBase - 26, 16, 26)

  // Abajo, el dominio, a ras del escenario.
  ctx.font = `22px ${PIXEL}`
  ctx.fillStyle = INK.muted
  ctx.fillText(new URL(SITE.url).host, MARGIN, STAGE_PX.y + STAGE_PX.size)

  // Al medio: título, bajada y la línea corta, centrados con el escenario.
  const titleSize =
    TITLE_SIZES.find((size) => {
      ctx.font = `${size}px ${PIXEL}`
      return ctx.measureText(card.title).width <= TEXT_WIDTH
    }) ?? 44
  ctx.font = `${titleSize}px ${PIXEL}`
  const titleCap = capHeight(ctx)
  ctx.font = `${LEAD.size}px ${SANS}`
  const lead = wrapText(ctx, card.lead, TEXT_WIDTH, LEAD.lines)
  const leadCap = capHeight(ctx)
  const gap = 44
  const metaGap = 40
  const metaCap = 16
  const height =
    titleCap + gap + leadCap + (lead.length - 1) * LEAD.line + (card.meta ? metaGap + metaCap : 0)
  let y = MIDDLE - height / 2 + titleCap

  ctx.font = `${titleSize}px ${PIXEL}`
  ctx.fillStyle = INK.fg
  ctx.fillText(card.title, MARGIN, y)

  y += gap + leadCap
  ctx.font = `${LEAD.size}px ${SANS}`
  for (const [i, line] of lead.entries()) ctx.fillText(line, MARGIN, y + i * LEAD.line)
  y += (lead.length - 1) * LEAD.line

  if (card.meta) {
    ctx.font = `22px ${PIXEL}`
    ctx.fillStyle = INK.muted
    ctx.fillText(card.meta, MARGIN, y + metaGap + metaCap)
  }
}

/** El índice de proyectos: los nombres numerados en el escenario, con una línea entre filas. */
function paintList(ctx: Context, items: string[]): void {
  const row = 66
  const x = STAGE_PX.x + 44
  const width = STAGE_PX.size - 88
  let y = MIDDLE - (items.length * row) / 2
  for (const [i, item] of items.entries()) {
    ctx.fillStyle = INK.tick
    ctx.fillRect(x, y, width, 2)
    ctx.font = `33px ${PIXEL}`
    const base = y + row / 2 + capHeight(ctx) / 2
    ctx.fillStyle = INK.fg
    ctx.fillText(item, x + 56, base)
    ctx.font = `22px ${PIXEL}`
    ctx.fillStyle = INK.muted
    ctx.fillText(String(i + 1).padStart(2, '0'), x, base)
    y += row
  }
  ctx.fillStyle = INK.tick
  ctx.fillRect(x, y, width, 2)
}

function capHeight(ctx: Context): number {
  return ctx.measureText('H').actualBoundingBoxAscent
}

/** Corta en palabras; si no cabe en `max` líneas, la última termina en «…». */
function wrapText(ctx: Context, text: string, width: number, max: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > width) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  if (lines.length <= max) return lines
  let last = lines[max - 1] ?? ''
  while (last && ctx.measureText(`${last}…`).width > width) last = last.replace(/\s*\S+$/, '')
  return [...lines.slice(0, max - 1), `${last}…`]
}

/** Ruido determinista por tarjeta: el mismo PNG en cada build. */
function seeded(key: string): () => number {
  let seed = 2166136261
  for (const char of key) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619)
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
