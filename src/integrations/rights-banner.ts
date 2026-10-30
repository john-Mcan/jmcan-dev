/**
 * El aviso corto de derechos al inicio de cada JS y CSS propio, como comentario
 * `/*! … *\/`: quien le pase el código minificado a un modelo de lenguaje le pasa
 * también la prohibición. Los chunks del runtime de Astro (router, prefetch) no lo
 * llevan.
 *
 * El JS se marca ya escrito (`writeBundle`): Vite le suma su preámbulo después de
 * `generateBundle`, y el aviso debe ir primero. El CSS lo emite el build del servidor
 * y Astro lo mueve al cliente; se marca en `generateBundle`, en cualquier entorno.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'
import { codeNotice } from '../data/rights'

export function rightsBanner(): AstroIntegration {
  return {
    name: 'rights-banner',
    hooks: {
      'astro:config:setup': ({ command, config, updateConfig }) => {
        if (command !== 'build') return
        const src = fileURLToPath(new URL('src/', config.root)).replaceAll('\\', '/')
        const banner = `/*! ${codeNotice()} */\n`
        const ours = (moduleIds: readonly string[]) =>
          moduleIds.some((id) => id.replaceAll('\\', '/').startsWith(src))
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'rights-banner',
                enforce: 'post',
                generateBundle(_, bundle) {
                  for (const file of Object.values(bundle)) {
                    if (file.type === 'asset' && file.fileName.endsWith('.css')) {
                      file.source = banner + String(file.source)
                    }
                  }
                },
                async writeBundle(options, bundle) {
                  const dir = options.dir
                  if (this.environment.name !== 'client' || !dir) return
                  await Promise.all(
                    Object.values(bundle).map(async (file) => {
                      if (file.type !== 'chunk' || !ours(file.moduleIds)) return
                      const path = join(dir, file.fileName)
                      await writeFile(path, banner + (await readFile(path, 'utf8')))
                    }),
                  )
                },
              },
            ],
          },
        })
      },
    },
  }
}
