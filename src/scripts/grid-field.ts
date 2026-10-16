/**
 * Monta el fondo una sola vez (persiste entre navegaciones) y decide qué imprime
 * según lo que hay en pantalla. Las páginas declaran sus escenarios con atributos:
 *
 *  - `data-grid-stage="contact" | "sent" | "404" | "glyph:<clave>"`: una caja donde
 *    la grilla imprime ese sprite mientras la caja esté a la vista. Un glifo va en
 *    ámbar; con `data-grid-tone="base"`, en la paleta de base (el siguiente proyecto).
 *  - `data-grid-stage="live:<patrón>"`: un escenario vivo (el hero).
 *  - `data-grid-projects`: lista de proyectos. Contiene `data-grid-panel` (pantalla
 *    sticky en escritorio) y filas `data-grid-row` con `data-grid-glyph="<clave>"`,
 *    un título `data-grid-row-title` y, para móvil, una caja `data-grid-glyph-box`.
 *    La fila activa (centro del viewport, o hover/foco) se marca en ámbar y su
 *    glifo se imprime en el panel.
 *
 * En un teléfono (bajo `md:`) las cajas no son sticky y bajan con la página: los
 * sprites sostenidos (glifos, 404) van en su propia pantalla (`screens.ts`), que
 * baja con ellas como una imagen. En la lista, cada fila a la vista muestra su
 * glifo: la activa en ámbar y el resto, tenue. El campo sigue con el hero.
 *
 * `data-grid-intro="fade"` en la página: el fondo entra con un fundido, sin barrido.
 *
 * Un `document.dispatchEvent(new Event('grid:refresh'))` vuelve a leer los escenarios
 * (p. ej. cuando el formulario cambia `contact` por `sent`).
 */

import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config'
import { GLYPH_KEYS, type GlyphKey } from '@/lib/grid-field/glyph-keys'
import { CONTACT_SPRITE, GLYPHS, NOT_FOUND_SPRITE, SENT_SPRITE } from '@/lib/grid-field/library'
import type { CursorMode } from '@/lib/grid-field/live'
import {
  isLivePattern,
  loadLivePattern,
  type LiveFactory,
  type LivePattern,
} from '@/lib/grid-field/live-patterns'
import {
  createGridFieldRunner,
  GRID_FIELD_DEFAULTS,
  SHAPE_ATTRIBUTE,
  type GridFieldRunner,
  type Intro,
  type Stage,
} from '@/lib/grid-field/runner'
import type { Screen, Screens } from '@/lib/grid-field/screens'
import type { SpriteFont } from '@/lib/grid-field/sprite-raster'
import type { Sprite } from '@/lib/grid-field/sprites'

/** Mismo corte que `md:` de Tailwind: desde aquí la lista de proyectos usa el panel sticky. */
const WIDE_QUERY = '(min-width: 48rem)'
/** Cuánto de una caja debe verse para que su escenario gane. */
const MIN_RATIO = 0.3
/** `data-grid-stage="live:<patrón>"`: un escenario vivo (moho, cosmos, enjambre…). */
const LIVE_PREFIX = 'live:'

let mounted = false
/** Cada patrón se baja solo en la página que lo usa: el resto del sitio no lo paga. */
const factories = new Map<LivePattern, LiveFactory>()
/** Las pantallas propias se bajan solo en un teléfono, en una página que las use. */
let screens: Screens | null = null

export function mountGridField(): void {
  if (mounted) return
  const host = document.getElementById('grid-field')
  const canvas = host?.querySelector('canvas')
  if (!host || !canvas) return
  mounted = true

  // El fondo es decoración: espera a que la página cargue y el navegador quede libre,
  // así nunca compite con el contenido (LCP) ni con la primera interacción.
  whenIdle(() => {
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-departure')
    const font: SpriteFont = { family: family.trim() || 'monospace', weight: 400 }
    const runner = createGridFieldRunner(host, canvas, {
      ...GRID_FIELD_DEFAULTS,
      intro: pageIntro(),
      font,
    })
    const stages = createStageController(runner, font)
    stages.bind()
    document.addEventListener('astro:before-preparation', () => {
      stages.unbind()
      runner.leave()
    })
    document.addEventListener('astro:after-swap', () => runner.enter(pageIntro()))
    document.addEventListener('astro:page-load', () => stages.bind())
  })
}

function whenIdle(run: () => void): void {
  const schedule = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(run, { timeout: 1200 })
    } else {
      setTimeout(run, 200)
    }
  }
  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })
}

function pageIntro(): Intro {
  return document.querySelector('[data-grid-intro="fade"]') ? 'fade' : 'sweep'
}

function pageLocale(): Locale {
  const lang = document.documentElement.lang
  return isLocale(lang) ? lang : DEFAULT_LOCALE
}

function isGlyphKey(value: string | undefined): value is GlyphKey {
  return (GLYPH_KEYS as readonly (string | undefined)[]).includes(value)
}

function hold(target: Element, sprite: Sprite, accent: boolean): Stage {
  return { target, program: { kind: 'hold', sprite }, accent }
}

function parseStage(target: Element, value: string): Stage | null {
  const locale = pageLocale()
  if (value.startsWith(LIVE_PREFIX)) return liveStage(target, value.slice(LIVE_PREFIX.length))
  if (value === 'contact') return hold(target, CONTACT_SPRITE, false)
  if (value === 'sent') return hold(target, SENT_SPRITE[locale], true)
  if (value === '404') return hold(target, NOT_FOUND_SPRITE, true)
  const glyph = value.startsWith('glyph:') ? value.slice('glyph:'.length) : undefined
  const accent = target.getAttribute('data-grid-tone') !== 'base'
  return isGlyphKey(glyph) ? hold(target, GLYPHS[glyph], accent) : null
}

/** Un escenario vivo lee `data-grid-cursor` (atrae, aparta o nada) en cada cuadro. */
function liveStage(target: Element, pattern: string): Stage | null {
  const create = isLivePattern(pattern) ? factories.get(pattern) : undefined
  if (!create) return null
  const source = create(() => cursorMode(target.getAttribute('data-grid-cursor')))
  return { target, program: { kind: 'live', source }, accent: false }
}

/** Los patrones vivos de la página que todavía no se bajaron. */
function missingPatterns(): LivePattern[] {
  const missing = new Set<LivePattern>()
  for (const element of document.querySelectorAll(`[data-grid-stage^="${LIVE_PREFIX}"]`)) {
    const pattern = element.getAttribute('data-grid-stage')?.slice(LIVE_PREFIX.length) ?? ''
    if (isLivePattern(pattern) && !factories.has(pattern)) missing.add(pattern)
  }
  return [...missing]
}

/** Si la página tiene sprites sostenidos (filas de proyectos, glifos, 404) que irían en pantallas. */
function hasHeldStages(): boolean {
  const held = `[data-grid-row], [data-grid-stage]:not([data-grid-stage^="${LIVE_PREFIX}"])`
  return document.querySelector(held) !== null
}

function cursorMode(value: string | null): CursorMode {
  return value === 'repel' || value === 'off' ? value : 'attract'
}

interface ProjectList {
  panel: Element | null
  rows: HTMLElement[]
  visible: boolean
  active: HTMLElement | null
  hover: HTMLElement | null
}

function createStageController(runner: GridFieldRunner, font: SpriteFont) {
  const wide = window.matchMedia(WIDE_QUERY)
  const ratios = new Map<Element, number>()
  // Escenarios cacheados: el runner compara por identidad y no debe reiniciar el sprite.
  const stageCache = new WeakMap<Element, { value: string; stage: Stage | null }>()
  const rowCache = new Map<Element, { wide: boolean; stage: Stage | null }>()
  /** En un teléfono, la pantalla propia de cada fila. */
  const rowScreens = new Map<HTMLElement, Screen>()
  let list: ProjectList | null = null
  let marked: HTMLElement | null = null
  let teardown: (() => void)[] = []

  function stageOf(element: Element): Stage | null {
    const value = element.getAttribute('data-grid-stage') ?? ''
    const cached = stageCache.get(element)
    if (cached?.value === value) return cached.stage
    const stage = parseStage(element, value)
    stageCache.set(element, { value, stage })
    return stage
  }

  /** En el campo, solo en escritorio (el panel sticky); en un teléfono la fila tiene su pantalla. */
  function rowStage(row: HTMLElement): Stage | null {
    const isWide = wide.matches
    if (!isWide) return null
    const cached = rowCache.get(row)
    if (cached?.wide === isWide) return cached.stage
    const key = row.dataset['gridGlyph']
    const target = isWide ? list?.panel : row.querySelector('[data-grid-glyph-box]')
    const stage = target && isGlyphKey(key) ? hold(target, GLYPHS[key], true) : null
    rowCache.set(row, { wide: isWide, stage })
    return stage
  }

  /** La fila activa se enciende en ámbar (forma de señal) y el panel muestra su nombre. */
  function markRow(row: HTMLElement | null): void {
    if (row === marked) return
    if (marked) rowScreens.get(marked)?.setAccent(false)
    if (row) rowScreens.get(row)?.setAccent(true)
    for (const candidate of [marked, row]) {
      if (!candidate) continue
      const on = candidate === row
      candidate.toggleAttribute('data-active', on)
      const title = candidate.querySelector('[data-grid-row-title]')
      if (on) title?.setAttribute(SHAPE_ATTRIBUTE, 'accent')
      else title?.removeAttribute(SHAPE_ATTRIBUTE)
    }
    marked = row
    if (row && list?.panel) {
      const caption = list.panel.parentElement?.querySelector('[data-grid-panel-caption]')
      if (caption) caption.textContent = row.dataset['caption'] ?? ''
    }
    runner.rescan()
  }

  function resolve(): void {
    const row = list ? (list.hover ?? (list.visible ? list.active : null)) : null
    if (list) markRow(row ?? list.active)
    if (row) {
      runner.setStage(rowStage(row))
      return
    }
    let best: Element | null = null
    let bestRatio = MIN_RATIO
    for (const [element, ratio] of ratios) {
      if (ratio >= bestRatio) {
        best = element
        bestRatio = ratio
      }
    }
    runner.setStage(best ? stageOf(best) : null)
  }

  function on<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    listener: () => void,
  ): void {
    target.addEventListener(type, listener)
    teardown.push(() => target.removeEventListener(type, listener))
  }

  function bindProjects(root: Element): void {
    const rows = [...root.querySelectorAll<HTMLElement>('[data-grid-row]')]
    const current: ProjectList = {
      panel: root.querySelector('[data-grid-panel]'),
      rows,
      visible: false,
      active: rows[0] ?? null,
      hover: null,
    }
    list = current

    if (!wide.matches && screens) {
      for (const row of rows) {
        const box = row.querySelector<HTMLElement>('[data-grid-glyph-box]')
        const key = row.dataset['gridGlyph']
        if (box && isGlyphKey(key)) rowScreens.set(row, screens.add(box, GLYPHS[key], false))
      }
    }

    const listObserver = new IntersectionObserver(
      ([entry]) => {
        current.visible = entry?.isIntersecting ?? false
        resolve()
      },
      { rootMargin: '-25% 0px -25% 0px' },
    )
    listObserver.observe(root)

    // La fila que cruza la franja central del viewport es la activa.
    const rowObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLElement)
            current.active = entry.target
        }
        resolve()
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    for (const row of rows) {
      rowObserver.observe(row)
      const enter = () => {
        current.hover = row
        resolve()
      }
      const leave = () => {
        if (current.hover !== row) return
        current.hover = null
        resolve()
      }
      on(row, 'pointerenter', enter)
      on(row, 'pointerleave', leave)
      on(row, 'focusin', enter)
      on(row, 'focusout', leave)
    }
    teardown.push(() => {
      listObserver.disconnect()
      rowObserver.disconnect()
    })
  }

  function bind(): void {
    unbind()
    const narrow = !wide.matches
    const loads: Promise<unknown>[] = missingPatterns().map((pattern) =>
      loadLivePattern(pattern).then((create) => factories.set(pattern, create)),
    )
    if (narrow && !screens && hasHeldStages()) {
      loads.push(
        import('@/lib/grid-field/screens').then(({ createScreens }) => {
          screens ??= createScreens(font)
        }),
      )
    }
    if (loads.length > 0) {
      void Promise.all(loads).then(bind)
      return
    }

    const observed: Element[] = []
    for (const element of document.querySelectorAll('[data-grid-stage]')) {
      const stage = stageOf(element)
      // En un teléfono, un sprite sostenido va en su pantalla, no en el campo.
      if (narrow && screens && stage?.program.kind === 'hold' && element instanceof HTMLElement) {
        screens.add(element, stage.program.sprite, stage.accent)
      } else {
        observed.push(element)
      }
    }
    if (observed.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0)
          }
          resolve()
        },
        { threshold: [0, 0.15, 0.3, 0.5, 0.75, 1] },
      )
      for (const element of observed) observer.observe(element)
      teardown.push(() => observer.disconnect())
    }

    const projects = document.querySelector('[data-grid-projects]')
    if (projects) bindProjects(projects)

    // Cambiar de ancho cambia dónde van los sprites (campo o pantallas): se vuelve a armar.
    // En un teléfono, un escenario que cambia (`contact` → `sent`) cambia su pantalla.
    const refresh = () => (wide.matches ? resolve() : bind())
    wide.addEventListener('change', bind)
    document.addEventListener('grid:refresh', refresh)
    teardown.push(() => {
      wide.removeEventListener('change', bind)
      document.removeEventListener('grid:refresh', refresh)
    })
    resolve()
  }

  function unbind(): void {
    for (const undo of teardown) undo()
    teardown = []
    ratios.clear()
    rowCache.clear()
    rowScreens.clear()
    screens?.clear()
    list = null
    marked = null
    runner.setStage(null)
  }

  return { bind, unbind }
}
