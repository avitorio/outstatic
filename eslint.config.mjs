import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import turboConfig from 'eslint-config-turbo/flat'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...turboConfig,
  eslintConfigPrettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    '**/.next/**',
    '**/out/**',
    '**/dist/**',
    '**/build/**',
    '**/next-env.d.ts',
    '**/.outstatic/**'
  ])
])

export default eslintConfig
