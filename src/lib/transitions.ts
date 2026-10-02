import type { TransitionDirectionalAnimations } from 'astro'

/** El contenido se apaga y se enciende en pasos: el mismo vocabulario cuantizado de la grilla. */
const swap = {
  old: { name: 'page-out', duration: '160ms', easing: 'steps(4, end)', fillMode: 'both' },
  new: {
    name: 'page-in',
    duration: '320ms',
    delay: '140ms',
    easing: 'steps(6, end)',
    fillMode: 'both',
  },
}

export const pageTransition: TransitionDirectionalAnimations = { forwards: swap, backwards: swap }
