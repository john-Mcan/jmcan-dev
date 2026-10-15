/**
 * Los candidatos del hero que monta `/lab/[variant]` (solo en `astro dev`). Todos
 * usan el hero de la home (`Hero.astro`); cambia el patrón vivo del fondo y el cursor
 * con que se eligió. Cada patrón nombra a su modo «atrae» y «aparta». `intro: 'fade'`:
 * el fondo entra con un fundido, sin el barrido de arriba hacia abajo.
 */
export const LAB_VARIANTS = [
  {
    slug: 'sesion',
    label: 'moho · sesión',
    pattern: 'mold-open',
    cursor: 'attract',
    attract: 'atrae',
    repel: 'aparta',
  },
  {
    // En móvil el arrecife vive como red abierta (ver `habitatFor`): es solo de escritorio.
    slug: 'arrecife',
    label: 'moho · arrecife',
    pattern: 'mold-reef',
    cursor: 'attract',
    attract: 'atrae',
    repel: 'aparta',
  },
  {
    slug: 'cosmos',
    label: 'cosmos',
    pattern: 'cosmos',
    cursor: 'attract',
    attract: 'atrae',
    repel: 'aparta',
  },
  {
    // Entra con un fundido, y el tornado formado se sostiene solo: el fondo se vacía.
    slug: 'cosmosv2',
    label: 'cosmos v2',
    pattern: 'cosmos-alone',
    cursor: 'attract',
    attract: 'atrae',
    repel: 'aparta',
    intro: 'fade',
  },
  {
    slug: 'enjambre',
    label: 'enjambre',
    pattern: 'flock',
    cursor: 'off',
    attract: 'curiosa',
    repel: 'tímida',
  },
  {
    slug: 'corrientes',
    label: 'corrientes',
    pattern: 'currents',
    cursor: 'attract',
    attract: 'remolino',
    repel: 'roca',
  },
  {
    slug: 'escarcha',
    label: 'escarcha',
    pattern: 'frost',
    cursor: 'attract',
    attract: 'atrae',
    repel: 'aparta',
  },
  {
    slug: 'julia',
    label: 'julia',
    pattern: 'julia',
    cursor: 'attract',
    attract: 'guía',
    repel: 'invierte',
  },
] as const

export type LabVariant = (typeof LAB_VARIANTS)[number]['slug']
