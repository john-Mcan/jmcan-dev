import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import astro from 'eslint-plugin-astro'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { ignores: ['dist/', '.astro/', '.wrangler/', 'node_modules/', 'docs/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['error'] }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'Sin frameworks de UI: usa .astro + <script>.' },
            { name: 'react-dom', message: 'Sin frameworks de UI: usa .astro + <script>.' },
          ],
        },
      ],
    },
  },
)
