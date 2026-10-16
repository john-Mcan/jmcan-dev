/**
 * En qué está un proyecto: cambia cómo se lee («en pausa» no es «en línea»). Vive
 * aparte para que el schema de contenido y los textos de UI lo usen sin importar
 * `astro:content`. El texto de cada estado está en `projects.statuses` (`ui/*.ts`).
 */
export const PROJECT_STATUSES = ['live', 'prelaunch', 'building', 'paused'] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]
