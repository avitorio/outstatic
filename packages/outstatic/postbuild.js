const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, './dist/client/client.js')

fs.readFile(filePath, 'utf8', function (err, data) {
  if (err) {
    return console.error(err)
  }

  const result = data.replace(/"use strict";/g, '"use client";')
  console.log(result)
  fs.writeFile(filePath, result, 'utf8', function (err) {
    if (err) {
      return console.error(err)
    }

    console.log(`Modified file: ${filePath}`)
  })
})
