/**
 * Los sprites del sitio. Todo a nivel de MÓDULO: el runner compara escenarios y
 * pools por identidad, y un array creado en cada llamada reiniciaría el sprite.
 */

import type { Locale } from '@/i18n/config'
import type { GlyphKey } from './glyph-keys'
import {
  CHANNEL_ZAP,
  CLOSING_LOOP,
  ENVELOPE,
  EQUALIZER,
  glitchText,
  ORBITING_DISCS,
  STEPPING_PATH,
} from './sprite-drawings'
import { WORD_MS, type Sprite } from './sprites'

/** Uno por proyecto: Revra, NEX, orientame.cl, Fandoms.io y Chucao. */
export const GLYPHS: Record<GlyphKey, Sprite> = {
  loop: { frames: CLOSING_LOOP, frameMs: 60 },
  eq: { frames: EQUALIZER, frameMs: 70 },
  path: { frames: STEPPING_PATH, frameMs: 80 },
  orbit: { frames: ORBITING_DISCS, frameMs: 60 },
  zap: { frames: CHANNEL_ZAP, frameMs: 70 },
}

export const CONTACT_SPRITE: Sprite = { frames: ENVELOPE, frameMs: 70 }

export const SENT_SPRITE: Record<Locale, Sprite> = {
  es: { frames: ['enviado', 'enviado_'], frameMs: WORD_MS },
  en: { frames: ['sent', 'sent_'], frameMs: WORD_MS },
}

export const NOT_FOUND_SPRITE: Sprite = { frames: glitchText('404', 16), frameMs: 90 }
