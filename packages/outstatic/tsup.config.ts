import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  return {
    entry: [
      './src/index.tsx',
      './src/client/client.tsx',
      './src/utils/server.ts'
    ],
    external: ['react', 'react-dom', 'next', 'tsup'],
    format: ['cjs', 'esm'],
    dts: true,
    minify: !options.watch
  }
})
