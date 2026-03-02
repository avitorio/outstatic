#!/usr/bin/env node
/**
 * Standalone script: reads version from package.json, updates constants.ts,
 * then stages and commits with "chore: upgrade outstatic to ${VERSION}".
 * Run: node version.mjs (from packages/outstatic)
 */

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const packageDir = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = join(packageDir, 'package.json')
const constantsPath = join(packageDir, 'src/utils/constants.ts')

const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
const version = pkg.version
if (!version) {
  console.error('package.json has no version')
  process.exit(1)
}

const constants = readFileSync(constantsPath, 'utf-8')
const updated = constants.replace(
  /export const OUTSTATIC_VERSION = '[^']*'/,
  `export const OUTSTATIC_VERSION = '${version}'`
)
if (updated === constants) {
  console.log(`OUTSTATIC_VERSION already ${version}; nothing to do.`)
  process.exit(0)
}
writeFileSync(constantsPath, updated)
console.log(`Updated OUTSTATIC_VERSION to ${version} in src/utils/constants.ts`)

const gitRoot = execSync('git rev-parse --show-toplevel', {
  encoding: 'utf-8'
}).trim()
execSync('git add -A', { cwd: gitRoot })
execSync(`git commit -m "chore: upgrade outstatic to ${version}"`, {
  cwd: gitRoot
})
console.log(`Committed: chore: upgrade outstatic to ${version}`)
