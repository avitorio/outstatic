import { Options, defineConfig } from 'tsup'

const CORE_ENTRIES = [
  './src/index.ts',
  './src/utils/server.ts',
  './src/utils/auth/auth.ts',
  './src/utils/hooks/index.ts',
  './src/components/index.ts',
  './src/graphql/utils/token-refresh-utility.ts',
  './src/typegen/index.ts',
  './src/cli/index.ts'
]

const CLIENT_ENTRY = {
  'client/client': './src/client/client.ts'
}

const AUTH_PROVIDER_ENTRY = {
  'utils/auth/auth-provider': './src/utils/auth/auth-provider.tsx'
}

const TYPE_ENTRIES = [
  './src/index.ts',
  './src/client/client.ts',
  './src/utils/server.ts',
  './src/utils/auth/auth.ts',
  './src/utils/auth/auth-provider.tsx',
  './src/utils/hooks/index.ts',
  './src/components/index.ts',
  './src/graphql/utils/token-refresh-utility.ts',
  './src/next-plugin.ts',
  './src/typegen/index.ts',
  './src/cli/index.ts'
]

const EXTERNALS = [
  'react',
  'react-dom',
  'next',
  'tsup',
  'tailwindcss',
  'tw-animate-css',
  '@parcel/watcher'
]

function sharedOptions(options: Options): Omit<Options, 'entry' | 'format'> {
  return {
    external: EXTERNALS,
    minify: !options.watch,
    treeshake: true,
    esbuildOptions(esbuildOptions) {
      esbuildOptions.jsx = 'automatic'
      esbuildOptions.conditions = ['style']
    }
  }
}

export default defineConfig((options) => {
  const dtsEnabled = !options.watch

  return [
    {
      ...sharedOptions(options),
      name: 'core',
      entry: CORE_ENTRIES,
      format: ['cjs', 'esm'],
      clean: !options.watch,
      dts: dtsEnabled
        ? {
            entry: TYPE_ENTRIES
          }
        : false
    },
    {
      ...sharedOptions(options),
      name: 'client',
      entry: CLIENT_ENTRY,
      format: ['cjs', 'esm'],
      clean: false,
      dts: false,
      treeshake: false,
      banner: {
        js: '"use client";'
      }
    },
    {
      ...sharedOptions(options),
      name: 'auth-provider',
      entry: AUTH_PROVIDER_ENTRY,
      format: ['cjs', 'esm'],
      clean: false,
      dts: false,
      treeshake: false
    },
    {
      ...sharedOptions(options),
      name: 'next-plugin-esm',
      entry: ['./src/next-plugin.ts'],
      format: ['esm'],
      clean: false,
      dts: false
    },
    {
      ...sharedOptions(options),
      name: 'next-plugin-cjs',
      entry: {
        'next-plugin': './src/next-plugin.cjs.ts'
      },
      format: ['cjs'],
      clean: false,
      dts: false
    }
  ]
})
