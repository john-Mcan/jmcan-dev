import { defineConfig } from 'vitest/config'

// Solo módulos puros (el motor de la grilla): no hace falta levantar Astro ni workerd.
export default defineConfig({
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
})
