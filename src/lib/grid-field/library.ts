/**
 * Los sprites del sitio. Todo a nivel de MÓDULO: el runner compara escenarios y
 * pools por identidad, y un array creado en cada llamada reiniciaría el sprite.
 */

import type { Locale } from '@/i18n/config'
import type { GlyphKey } from './glyph-keys'
import {
  BREATHING_RING,
  ENVELOPE,
  GLOBE,
  glitchText,
  NETWORK_PULSE,
  ORBITING_DISCS,
  RADAR,
  SCOPE,
  WIRE_CUBE,
} from './sprite-drawings'
import { WORD_MS, type Sprite } from './sprites'

export const GLYPHS: Record<GlyphKey, Sprite> = {
  cube: { frames: WIRE_CUBE, frameMs: 60 },
  globe: { frames: GLOBE, frameMs: 70 },
  scope: { frames: SCOPE, frameMs: 50 },
  radar: { frames: RADAR, frameMs: 50 },
  network: { frames: NETWORK_PULSE, frameMs: 70 },
  ring: { frames: BREATHING_RING, frameMs: 70 },
  orbit: { frames: ORBITING_DISCS, frameMs: 60 },
}

const MONOGRAM: Sprite = { frames: ['jm', 'jm_', 'jm', 'jm_'], frameMs: WORD_MS, textScale: 0.5 }

const GREETING: Record<Locale, Sprite> = {
  es: { frames: ['>', '> h', '> ho', '> hol', '> hola', '> hola_', '> hola'], frameMs: 260 },
  en: { frames: ['>', '> h', '> he', '> hel', '> hell', '> hello', '> hello_'], frameMs: 260 },
}

/** El pool del hero: el primero (el monograma) abre siempre; después alterna al azar. */
export const HERO_POOL: Record<Locale, readonly Sprite[]> = {
  es: [MONOGRAM, GREETING.es, GLYPHS.cube, GLYPHS.globe, GLYPHS.scope, GLYPHS.radar],
  en: [MONOGRAM, GREETING.en, GLYPHS.cube, GLYPHS.globe, GLYPHS.scope, GLYPHS.radar],
}

export const CONTACT_SPRITE: Sprite = { frames: ENVELOPE, frameMs: 70 }

export const SENT_SPRITE: Record<Locale, Sprite> = {
  es: { frames: ['enviado', 'enviado_'], frameMs: WORD_MS },
  en: { frames: ['sent', 'sent_'], frameMs: WORD_MS },
}

export const NOT_FOUND_SPRITE: Sprite = { frames: glitchText('404', 16), frameMs: 90 }
