import fs from 'fs'
import path from 'path'
import { Options, defineConfig } from 'tsup'

const filePath = path.join(__dirname, './dist/client/client.js')
const filePath2 = path.join(__dirname, './dist/client/client.mjs')

export default defineConfig((options) => {
  return {
    entry: [
      './src/index.tsx',
      './src/client/client.tsx',
      './src/utils/server.ts'
    ],
    external: [
      'react',
      'react-dom',
      'next',
      'tsup',
      'tailwindcss'
      // Add any other external dependencies your project uses
    ],
    noExternal: ['@outstatic/ui'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: !options.watch,
    minify: !options.watch,
    treeshake: true, // Add tree shaking
    esbuildOptions(options) {
      // Ensure proper handling of JSX
      options.jsx = 'automatic'
    },
    // Modify the onSuccess handler to be more robust
    async onSuccess() {
      const files = [filePath, filePath2]

      for (const file of files) {
        try {
          if (!fs.existsSync(file)) {
            console.warn(`File not found: ${file}`)
            continue
          }

          const data = await fs.promises.readFile(file, 'utf8')
          const hasUseClient = data.includes('"use client"')
          let result = data

          if (!hasUseClient) {
            result = `"use client";\n${data.replace(/"use strict";/g, '')}`
          }

          await fs.promises.writeFile(file, result, 'utf8')
          console.log(`Successfully modified: ${file}`)
        } catch (err) {
          console.error(`Error processing ${file}:`, err)
        }
      }
    }
  } as Options
})
