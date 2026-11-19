/**
 * Los enlaces que suben un nivel (`data-up`: «← Proyectos», las migas del header) vuelven
 * a donde se estaba. Si la página de arriba está atrás en el historial, separada solo por
 * páginas de su mismo nivel (otros proyectos), se vuelve a esa entrada y el router repone
 * su scroll. Si no está (se llegó directo al detalle), el enlace navega como siempre y la
 * página abre arriba.
 */

/** Sin la Navigation API: la ruta de cada entrada del historial que vio esta carga. */
const seen: (string | undefined)[] = []

/** Las rutas del historial, de la primera a la actual. */
function trail(): (string | undefined)[] {
  const nav = 'navigation' in window ? window.navigation : undefined
  const index = nav?.currentEntry?.index ?? -1
  if (nav && index >= 0) {
    return nav
      .entries()
      .slice(0, index + 1)
      .map((entry) => (entry.url ? new URL(entry.url).pathname : undefined))
  }
  return seen.slice(0, historyIndex() + 1)
}

/** El índice que el router de Astro guarda en cada entrada. */
function historyIndex(): number {
  const state: unknown = history.state
  const index = state && typeof state === 'object' && 'index' in state ? state.index : 0
  return typeof index === 'number' ? index : 0
}

/** `/proyectos/revra/` → `/proyectos/`. */
function parent(path: string): string {
  return path.replace(/[^/]+\/?$/, '')
}

/** Cuántas entradas atrás está `target`, pasando solo por páginas hijas suyas; 0 si no está. */
function stepsBack(target: string): number {
  const paths = trail()
  for (let i = paths.length - 2; i >= 0; i--) {
    const path = paths[i]
    if (path === target) return paths.length - 1 - i
    if (path === undefined || parent(path) !== target) break
  }
  return 0
}

export function watchUpLinks(): void {
  document.addEventListener('astro:page-load', () => {
    seen[historyIndex()] = location.pathname
  })
  // En la captura: antes del router y del script del historial, que respetan `defaultPrevented`.
  document.addEventListener(
    'click',
    (event) => {
      if (event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[data-up]')
          : null
      if (!link) return
      const steps = stepsBack(new URL(link.href).pathname)
      if (steps === 0) return
      event.preventDefault()
      history.go(-steps)
    },
    { capture: true },
  )
}
