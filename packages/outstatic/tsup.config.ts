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
      './src/utils/server.ts',
      './src/utils/index.ts'
    ],
    external: ['react', 'react-dom', 'next', 'tsup'],
    format: ['cjs', 'esm'],
    dts: true,
    minify: !options.watch,
    onSuccess() {
      fs.readFile(filePath, 'utf8', function (err, data) {
        if (err) {
          return console.error(err)
        }

        const result = data.replace(/"use strict";/g, '"use client";')
        fs.writeFile(filePath, result, 'utf8', function (err) {
          if (err) {
            return console.error(err)
          }

          console.log(`Modified file: ${filePath}`)
        })
      })

      // Process filePath2
      fs.readFile(filePath2, 'utf8', function (err, data) {
        if (err) {
          return console.error(err)
        }

        // Add "use client" to the top of the file
        const result = `"use client";\n${data}`
        fs.writeFile(filePath2, result, 'utf8', function (err) {
          if (err) {
            return console.error(err)
          }

          console.log(`Modified file: ${filePath2}`)
        })
      })
    }
  } as Options
})
