/**
 * Claves de los glifos dibujados que un proyecto puede usar en su frontmatter.
 * Vive aparte de los dibujos para que el schema de contenido no importe código de canvas.
 */
export const GLYPH_KEYS = ['loop', 'eq', 'path', 'orbit', 'zap'] as const

export type GlyphKey = (typeof GLYPH_KEYS)[number]
