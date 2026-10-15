/**
 * Los patrones vivos, por nombre (`data-grid-stage="live:<nombre>"`). Cada uno se
 * baja aparte (`import()`), solo en la página que lo usa: la home paga el suyo y
 * no los demás del laboratorio.
 */

import type { CursorMode, LiveSource } from './live'

/** Crea el patrón; el cursor se lee en cada cuadro. */
export type LiveFactory = (cursor: () => CursorMode) => LiveSource

const LOADERS = {
  'mold-open': async () => {
    const { createMold } = await import('./live-mold')
    return (cursor) => createMold({ habitat: 'open', cursor })
  },
  'mold-reef': async () => {
    const { createMold } = await import('./live-mold')
    return (cursor) => createMold({ habitat: 'reef', cursor })
  },
  cosmos: async () => {
    const { createCosmos } = await import('./live-cosmos')
    return (cursor) => createCosmos({ cursor })
  },
  'cosmos-alone': async () => {
    const { createCosmos } = await import('./live-cosmos')
    return (cursor) => createCosmos({ cursor, alone: true })
  },
  flock: async () => {
    const { createFlock } = await import('./live-flock')
    return (cursor) => createFlock({ cursor })
  },
  currents: async () => {
    const { createCurrents } = await import('./live-currents')
    return (cursor) => createCurrents({ cursor })
  },
  frost: async () => {
    const { createFrost } = await import('./live-frost')
    return (cursor) => createFrost({ cursor })
  },
  julia: async () => {
    const { createJulia } = await import('./live-julia')
    return (cursor) => createJulia({ cursor })
  },
} satisfies Record<string, () => Promise<LiveFactory>>

export type LivePattern = keyof typeof LOADERS

export function isLivePattern(value: string): value is LivePattern {
  return Object.hasOwn(LOADERS, value)
}

export function loadLivePattern(pattern: LivePattern): Promise<LiveFactory> {
  return LOADERS[pattern]()
}
