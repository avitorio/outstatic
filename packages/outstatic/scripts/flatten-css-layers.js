const fs = require('fs')
const path = require('path')
const postcss = require('postcss')

const FORBIDDEN_AT_RULES = new Set([
  'apply',
  'config',
  'custom-variant',
  'layer',
  'plugin',
  'source',
  'tailwind',
  'theme',
  'utility'
])

const inputPath = process.argv[2]

if (!inputPath) {
  console.error('Usage: node scripts/flatten-css-layers.js <css-file>')
  process.exit(1)
}

const cssPath = path.resolve(process.cwd(), inputPath)
const css = fs.readFileSync(cssPath, 'utf8')
const root = postcss.parse(css, { from: cssPath })

const layerOrder = []
const layerBuckets = new Map()
const unlayeredNodes = []

function splitLayerParams(params) {
  return params
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

function ensureLayer(name) {
  if (!layerBuckets.has(name)) {
    layerBuckets.set(name, [])
    layerOrder.push(name)
  }
}

root.each((node) => {
  if (node.type !== 'atrule' || node.name !== 'layer') {
    unlayeredNodes.push(node.clone())
    return
  }

  const layerNames = splitLayerParams(node.params)

  if (!node.nodes) {
    layerNames.forEach(ensureLayer)
    return
  }

  const [layerName] = layerNames

  if (!layerName) {
    unlayeredNodes.push(...node.nodes.map((child) => child.clone()))
    return
  }

  ensureLayer(layerName)
  layerBuckets.get(layerName).push(...node.nodes.map((child) => child.clone()))
})

const flattenedRoot = postcss.root()

while (unlayeredNodes[0]?.type === 'comment') {
  flattenedRoot.append(unlayeredNodes.shift())
}

for (const layerName of layerOrder) {
  flattenedRoot.append(...layerBuckets.get(layerName))
}

flattenedRoot.append(...unlayeredNodes)

const result = flattenedRoot.toResult({ from: cssPath, map: false }).css
const resultRoot = postcss.parse(result, { from: cssPath })
const remainingForbiddenAtRules = []

resultRoot.walkAtRules((atRule) => {
  if (FORBIDDEN_AT_RULES.has(atRule.name)) {
    remainingForbiddenAtRules.push(
      `@${atRule.name} at line ${atRule.source?.start?.line ?? '?'}`
    )
  }
})

if (remainingForbiddenAtRules.length > 0) {
  console.error(
    [
      'outstatic.css still contains Tailwind source at-rules:',
      ...remainingForbiddenAtRules.map((rule) => `- ${rule}`)
    ].join('\n')
  )
  process.exit(1)
}

fs.writeFileSync(cssPath, result)
