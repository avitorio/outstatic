import fs from 'fs'
import path from 'path'
import { defineConfig } from 'tsup'

const filePath = path.join(__dirname, './dist/client/client.js')

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
    }
  }
})
