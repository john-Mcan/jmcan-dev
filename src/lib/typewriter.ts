/**
 * Escritura tecla a tecla, como en una terminal: para pasar de un texto a otro,
 * borra hasta lo que tienen en común y escribe el resto. Si el destino cambia a
 * mitad de camino, sigue desde donde está. Mientras escribe, marca `data-typing`
 * (el cursor deja de parpadear). Con movimiento reducido, cambia de golpe.
 * La usan el prompt del header y la pregunta del hero.
 */

/** Un tramo del texto; con `href`, un enlace externo (abre en otra pestaña). */
export interface TypedPart {
  text: string
  href?: string
}

export type Typed = string | readonly TypedPart[]

export interface Typewriter {
  /** Lleva el texto a `to`; `done` corre cuando queda escrito, si otro `type` no lo cambió antes. */
  type(to: Typed, done?: () => void): void
  /** Deja de escribir donde esté. */
  stop(): void
}

/** Una tecla: el carácter y el enlace del que es parte. */
interface Key {
  char: string
  href: string | undefined
}

/** Ritmo (ms): cada tecla, con algo de variación humana; cada borrado; la pausa entre borrar y escribir. */
const KEY_MS = 55
const KEY_JITTER_MS = 60
const ERASE_MS = 30
const BEAT_MS = 200

export function createTypewriter(target: HTMLElement, busy: HTMLElement = target): Typewriter {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  const shown = keysOf(partsOf(target))
  let goal: Key[] = [...shown]
  let done: (() => void) | undefined
  let timer = 0

  function render(): void {
    const nodes: (Node | string)[] = []
    for (let i = 0; i < shown.length;) {
      const href = shown[i]?.href
      let text = ''
      for (; i < shown.length && shown[i]?.href === href; i++) text += shown[i]?.char ?? ''
      if (href === undefined) {
        nodes.push(text)
        continue
      }
      const link = document.createElement('a')
      link.className = 'link'
      link.href = href
      link.rel = 'noopener'
      link.target = '_blank'
      link.textContent = text
      nodes.push(link)
    }
    target.replaceChildren(...nodes)
  }

  function finish(): void {
    timer = 0
    busy.removeAttribute('data-typing')
    const callback = done
    done = undefined
    callback?.()
  }

  function later(ms: number): void {
    timer = window.setTimeout(tick, ms)
  }

  function tick(): void {
    const keep = common(shown, goal)
    if (shown.length > keep) {
      shown.pop()
      render()
      if (shown.length > keep) later(ERASE_MS)
      else if (keep < goal.length) later(BEAT_MS)
      else finish()
      return
    }
    const next = goal[shown.length]
    if (!next) {
      finish()
      return
    }
    shown.push(next)
    render()
    if (shown.length < goal.length) later(keyMs())
    else finish()
  }

  return {
    type(to, callback) {
      goal = keysOf(to)
      done = callback
      if (reduced.matches) {
        window.clearTimeout(timer)
        shown.splice(0, shown.length, ...goal)
        render()
        finish()
        return
      }
      if (timer) return
      if (common(shown, goal) === shown.length && shown.length === goal.length) {
        finish()
        return
      }
      busy.setAttribute('data-typing', '')
      later(keyMs())
    },
    stop() {
      window.clearTimeout(timer)
      timer = 0
      done = undefined
      busy.removeAttribute('data-typing')
    },
  }
}

function keyMs(): number {
  return KEY_MS + Math.random() * KEY_JITTER_MS
}

function keysOf(to: Typed): Key[] {
  const parts = typeof to === 'string' ? [{ text: to }] : to
  return parts.flatMap(({ text, href }) => Array.from(text, (char) => ({ char, href })))
}

/** El texto de un elemento en tramos (texto suelto y enlaces), con los espacios como se ven. */
export function partsOf(element: Element): TypedPart[] {
  const parts: TypedPart[] = []
  let spaced = true
  for (const node of element.childNodes) {
    if (!(node instanceof Text || node instanceof Element)) continue
    let text = (node.textContent ?? '').replace(/\s+/g, ' ')
    if (spaced && text.startsWith(' ')) text = text.slice(1)
    if (!text) continue
    spaced = text.endsWith(' ')
    const href = node instanceof HTMLAnchorElement ? node.getAttribute('href') : null
    parts.push(href === null ? { text } : { text, href })
  }
  const last = parts.at(-1)
  if (last && spaced) last.text = last.text.slice(0, -1)
  return parts
}

/** Cuántas teclas iniciales comparten `a` y `b`. */
function common(a: readonly Key[], b: readonly Key[]): number {
  let n = 0
  while (n < a.length && n < b.length && a[n]?.char === b[n]?.char && a[n]?.href === b[n]?.href) n++
  return n
}
