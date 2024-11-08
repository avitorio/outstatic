const fs = require('fs')
const path = require('path')

const files = [
  path.join(__dirname, './dist/client/client.js'),
  path.join(__dirname, './dist/client/client.mjs')
]

files.forEach((filePath) => {
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
})
