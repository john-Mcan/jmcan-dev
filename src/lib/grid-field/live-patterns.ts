/**
 * Los patrones vivos, por nombre (`data-grid-stage="live:<nombre>"`). Este módulo se
 * baja aparte, solo en la página que tiene un escenario vivo.
 */

import type { CursorMode, LiveSource } from './live'
import { createCurrents } from './live-currents'
import { createFlock } from './live-flock'
import { createFrost } from './live-frost'
import { createJulia } from './live-julia'
import { createMold } from './live-mold'

export const LIVE_PATTERNS = [
  'mold-open',
  'mold-reef',
  'flock',
  'currents',
  'frost',
  'julia',
] as const

export type LivePattern = (typeof LIVE_PATTERNS)[number]

export function isLivePattern(value: string): value is LivePattern {
  return (LIVE_PATTERNS as readonly string[]).includes(value)
}

export function createLivePattern(pattern: LivePattern, cursor: () => CursorMode): LiveSource {
  switch (pattern) {
    case 'mold-open':
      return createMold({ habitat: 'open', cursor })
    case 'mold-reef':
      return createMold({ habitat: 'reef', cursor })
    case 'flock':
      return createFlock({ cursor })
    case 'currents':
      return createCurrents({ cursor })
    case 'frost':
      return createFrost({ cursor })
    case 'julia':
      return createJulia({ cursor })
  }
}
